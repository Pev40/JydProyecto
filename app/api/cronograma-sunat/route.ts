import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const año = searchParams.get("año")
    const accion = searchParams.get("accion")

    // Obtener años disponibles
    if (accion === "años") {
      const años = await sql`
        SELECT DISTINCT Año, 
               COUNT(*) as totalRegistros,
               MIN(FechaCreacion) as fechaCreacion,
               Estado
        FROM CronogramaSunat 
        WHERE Estado = 'ACTIVO'
        GROUP BY Año, Estado
        ORDER BY Año DESC
      `

      return NextResponse.json({ success: true, años })
    }

    // Obtener estadísticas de un año específico
    if (accion === "estadisticas" && año) {
      const estadisticas = await sql`
        SELECT 
          COUNT(*) as totalRegistros,
          COUNT(DISTINCT Mes) as mesesCompletos,
          COUNT(DISTINCT UltimoDigitoRuc) as digitosConfigurados,
          MIN(FechaCreacion) as fechaCreacion,
          MAX(FechaCreacion) as fechaUltimaModificacion
        FROM CronogramaSunat
        WHERE Año = ${Number.parseInt(año)} AND Estado = 'ACTIVO'
      `

      return NextResponse.json({ success: true, estadisticas: estadisticas[0] })
    }

    // Obtener cronograma por año (por defecto)
    const añoConsulta = año ? Number.parseInt(año) : new Date().getFullYear()

    const cronograma = await sql`
      SELECT 
        IdCronograma,
        Año,
        Mes,
        CASE Mes
          WHEN 1 THEN 'Enero'
          WHEN 2 THEN 'Febrero'
          WHEN 3 THEN 'Marzo'
          WHEN 4 THEN 'Abril'
          WHEN 5 THEN 'Mayo'
          WHEN 6 THEN 'Junio'
          WHEN 7 THEN 'Julio'
          WHEN 8 THEN 'Agosto'
          WHEN 9 THEN 'Septiembre'
          WHEN 10 THEN 'Octubre'
          WHEN 11 THEN 'Noviembre'
          WHEN 12 THEN 'Diciembre'
        END as NombreMes,
        UltimoDigitoRuc,
        CASE UltimoDigitoRuc
          WHEN '0' THEN 'Dígito 0'
          WHEN '1' THEN 'Dígito 1'
          WHEN '2,3' THEN 'Dígitos 2 y 3'
          WHEN '4,5' THEN 'Dígitos 4 y 5'
          WHEN '6,7' THEN 'Dígitos 6 y 7'
          WHEN '8,9' THEN 'Dígitos 8 y 9'
          WHEN 'BC' THEN 'Buenos Contribuyentes y UESP'
          ELSE UltimoDigitoRuc
        END as DescripcionDigito,
        FechaVencimiento,
        DATE_FORMAT(FechaVencimiento, '%d/%m/%Y') as FechaVencimientoFormateada,
        DAYNAME(FechaVencimiento) as DiaSemana,
        FechaCreacion,
        UsuarioCreacion,
        Estado
      FROM CronogramaSunat
      WHERE Año = ${añoConsulta} AND Estado = 'ACTIVO'
      ORDER BY Mes ASC, 
        CASE UltimoDigitoRuc
          WHEN '0' THEN 1
          WHEN '1' THEN 2
          WHEN '2,3' THEN 3
          WHEN '4,5' THEN 4
          WHEN '6,7' THEN 5
          WHEN '8,9' THEN 6
          WHEN 'BC' THEN 7
          ELSE 8
        END
    `

    // Agrupar por mes
    const cronogramaPorMes = cronograma.reduce((acc: any, item: any) => {
      if (!acc[item.NombreMes]) {
        acc[item.NombreMes] = []
      }
      acc[item.NombreMes].push(item)
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      cronograma: cronogramaPorMes,
      año: añoConsulta,
      totalRegistros: cronograma.length,
    })
  } catch (error) {
    console.error("Error en cronograma SUNAT:", error)
    return NextResponse.json({ success: false, error: "Error al obtener cronograma SUNAT" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accion, año, añoOrigen, añoDestino, usuario = "SISTEMA", cronograma } = body

    switch (accion) {
      case "crear":
        // Crear cronograma base para nuevo año
        await sql`CALL CrearCronogramaBase(${año}, ${usuario})`

        return NextResponse.json({
          success: true,
          message: `Cronograma base creado para el año ${año}`,
        })

      case "copiar":
        // Copiar cronograma de un año a otro
        await sql`CALL CopiarCronogramaSunat(${añoOrigen}, ${añoDestino}, ${usuario})`

        return NextResponse.json({
          success: true,
          message: `Cronograma copiado de ${añoOrigen} a ${añoDestino}`,
        })

      case "actualizar":
        // Actualizar cronograma completo
        if (!cronograma || !Array.isArray(cronograma)) {
          return NextResponse.json({ success: false, error: "Datos de cronograma inválidos" }, { status: 400 })
        }

        // Desactivar cronograma existente
        await sql`
          UPDATE CronogramaSunat 
          SET Estado = 'INACTIVO' 
          WHERE Año = ${año}
        `

        // Insertar nuevo cronograma
        for (const item of cronograma) {
          await sql`
            INSERT INTO CronogramaSunat (
              Año, Mes, UltimoDigitoRuc, FechaVencimiento, 
              FechaCreacion, UsuarioCreacion, Estado
            ) VALUES (
              ${año}, ${item.mes}, ${item.ultimoDigitoRuc}, ${item.fechaVencimiento},
              NOW(), ${usuario}, 'ACTIVO'
            )
          `
        }

        return NextResponse.json({
          success: true,
          message: `Cronograma actualizado para el año ${año}`,
        })

      case "eliminar":
        // Desactivar cronograma (no eliminar físicamente)
        await sql`
          UPDATE CronogramaSunat 
          SET Estado = 'INACTIVO' 
          WHERE Año = ${año}
        `

        return NextResponse.json({
          success: true,
          message: `Cronograma desactivado para el año ${año}`,
        })

      default:
        return NextResponse.json({ success: false, error: "Acción no válida" }, { status: 400 })
    }
  } catch (error: any) {
    console.error("Error en operación cronograma SUNAT:", error)

    // Manejar errores específicos de las stored procedures
    if (error.message?.includes("Ya existe un cronograma")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 409 })
    }

    if (error.message?.includes("No existe cronograma")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 })
    }

    return NextResponse.json({ success: false, error: "Error en operación del cronograma SUNAT" }, { status: 500 })
  }
}
