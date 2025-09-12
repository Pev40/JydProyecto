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
        SELECT DISTINCT "Año", 
               COUNT(*) as totalRegistros,
               MIN("FechaCreacion") as fechaCreacion,
               "Estado"
        FROM "CronogramaSunat" 
        WHERE "Estado" = 'ACTIVO'
        GROUP BY "Año", "Estado"
        ORDER BY "Año" DESC
      `

      return NextResponse.json({ success: true, años })
    }

    // Obtener estadísticas de un año específico
    if (accion === "estadisticas" && año) {
      const estadisticas = await sql`
        SELECT 
          COUNT(*) as totalRegistros,
          COUNT(DISTINCT "Mes") as mesesCompletos,
          COUNT(DISTINCT "DigitoRUC") as digitosConfigurados,
          MIN("FechaCreacion") as fechaCreacion,
          MAX("FechaCreacion") as fechaUltimaModificacion
        FROM "CronogramaSunat"
        WHERE "Año" = ${Number.parseInt(año)} AND "Estado" = 'ACTIVO'
      `

      return NextResponse.json({ success: true, estadisticas: estadisticas[0] })
    }

    // Obtener cronograma por año (por defecto)
    const añoConsulta = año ? Number.parseInt(año) : new Date().getFullYear()

    const cronograma = await sql`
      SELECT 
        "IdCronograma",
        "Año",
        "Mes",
        CASE "Mes"
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
        END as "NombreMes",
        "DigitoRUC",
        "Dia",
        "MesVencimiento",
        "FechaCreacion",
        "UsuarioCreacion",
        "Estado"
      FROM "CronogramaSunat"
      WHERE "Año" = ${añoConsulta} AND "Estado" = 'ACTIVO'
      ORDER BY "Mes" ASC, "DigitoRUC" ASC
    `

interface CronogramaItem {
  IdCronograma: number;
  Año: number;
  Mes: number;
  NombreMes: string;
  DigitoRUC: string;
  Dia: number;
  MesVencimiento: number;
  FechaCreacion: string;
  UsuarioCreacion: string;
  Estado: string;
}

interface CronogramaPorMes {
  [nombreMes: string]: CronogramaItem[];
}

    // Agrupar por mes
    const cronogramaPorMes = (cronograma as CronogramaItem[]).reduce((acc: CronogramaPorMes, item: CronogramaItem) => {
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
        // Verificar que no existe el cronograma para ese año
        const existeAño = await sql`
          SELECT COUNT(*) as count FROM "CronogramaSunat" 
          WHERE "Año" = ${año} AND "Estado" = 'ACTIVO'
        `
        
        if (existeAño[0].count > 0) {
          return NextResponse.json({ 
            success: false, 
            error: `Ya existe un cronograma activo para el año ${año}` 
          }, { status: 409 })
        }

        // Crear cronograma base con estructura básica
        const cronogramaBase = [
          // Enero
          [año, 1, 0, 14, 2], [año, 1, 1, 15, 2], [año, 1, 2, 16, 2], 
          [año, 1, 4, 17, 2], [año, 1, 6, 20, 2], [año, 1, 8, 21, 2], [año, 1, 99, 22, 2],
          // Febrero
          [año, 2, 0, 13, 3], [año, 2, 1, 14, 3], [año, 2, 2, 17, 3], 
          [año, 2, 4, 18, 3], [año, 2, 6, 19, 3], [año, 2, 8, 20, 3], [año, 2, 99, 21, 3],
          // Marzo
          [año, 3, 0, 14, 4], [año, 3, 1, 17, 4], [año, 3, 2, 18, 4], 
          [año, 3, 4, 19, 4], [año, 3, 6, 20, 4], [año, 3, 8, 21, 4], [año, 3, 99, 24, 4],
          // Abril
          [año, 4, 0, 14, 5], [año, 4, 1, 15, 5], [año, 4, 2, 16, 5], 
          [año, 4, 4, 17, 5], [año, 4, 6, 20, 5], [año, 4, 8, 21, 5], [año, 4, 99, 22, 5],
          // Mayo
          [año, 5, 0, 13, 6], [año, 5, 1, 14, 6], [año, 5, 2, 15, 6], 
          [año, 5, 4, 16, 6], [año, 5, 6, 19, 6], [año, 5, 8, 20, 6], [año, 5, 99, 21, 6],
          // Junio
          [año, 6, 0, 13, 7], [año, 6, 1, 16, 7], [año, 6, 2, 17, 7], 
          [año, 6, 4, 18, 7], [año, 6, 6, 19, 7], [año, 6, 8, 20, 7], [año, 6, 99, 23, 7],
          // Julio
          [año, 7, 0, 14, 8], [año, 7, 1, 15, 8], [año, 7, 2, 16, 8], 
          [año, 7, 4, 17, 8], [año, 7, 6, 18, 8], [año, 7, 8, 21, 8], [año, 7, 99, 22, 8],
          // Agosto
          [año, 8, 0, 13, 9], [año, 8, 1, 14, 9], [año, 8, 2, 15, 9], 
          [año, 8, 4, 18, 9], [año, 8, 6, 19, 9], [año, 8, 8, 20, 9], [año, 8, 99, 21, 9],
          // Septiembre
          [año, 9, 0, 15, 10], [año, 9, 1, 16, 10], [año, 9, 2, 17, 10], 
          [año, 9, 4, 18, 10], [año, 9, 6, 19, 10], [año, 9, 8, 22, 10], [año, 9, 99, 23, 10],
          // Octubre
          [año, 10, 0, 13, 11], [año, 10, 1, 14, 11], [año, 10, 2, 15, 11], 
          [año, 10, 4, 16, 11], [año, 10, 6, 17, 11], [año, 10, 8, 20, 11], [año, 10, 99, 21, 11],
          // Noviembre
          [año, 11, 0, 13, 12], [año, 11, 1, 14, 12], [año, 11, 2, 17, 12], 
          [año, 11, 4, 18, 12], [año, 11, 6, 19, 12], [año, 11, 8, 20, 12], [año, 11, 99, 21, 12],
          // Diciembre
          [año, 12, 0, 15, 1], [año, 12, 1, 16, 1], [año, 12, 2, 17, 1], 
          [año, 12, 4, 18, 1], [año, 12, 6, 19, 1], [año, 12, 8, 20, 1], [año, 12, 99, 21, 1]
        ]

        for (const [añoVal, mes, digito, dia, mesVenc] of cronogramaBase) {
          await sql`
            INSERT INTO "CronogramaSunat" 
            ("Año", "Mes", "DigitoRUC", "Dia", "MesVencimiento", "UsuarioCreacion", "Estado") 
            VALUES (${añoVal}, ${mes}, ${digito}, ${dia}, ${mesVenc}, ${usuario}, 'ACTIVO')
          `
        }

        return NextResponse.json({
          success: true,
          message: `Cronograma base creado para el año ${año}`,
        })

      case "copiar":
        // Verificar que existe el cronograma origen
        const cronogramaOrigen = await sql`
          SELECT COUNT(*) as count FROM "CronogramaSunat" 
          WHERE "Año" = ${añoOrigen} AND "Estado" = 'ACTIVO'
        `
        
        if (cronogramaOrigen[0].count === 0) {
          return NextResponse.json({ 
            success: false, 
            error: `No existe cronograma activo para el año ${añoOrigen}` 
          }, { status: 404 })
        }

        // Verificar que no existe el cronograma destino
        const existeDestino = await sql`
          SELECT COUNT(*) as count FROM "CronogramaSunat" 
          WHERE "Año" = ${añoDestino} AND "Estado" = 'ACTIVO'
        `
        
        if (existeDestino[0].count > 0) {
          return NextResponse.json({ 
            success: false, 
            error: `Ya existe un cronograma activo para el año ${añoDestino}` 
          }, { status: 409 })
        }

        // Copiar cronograma
        await sql`
          INSERT INTO "CronogramaSunat" ("Año", "Mes", "DigitoRUC", "Dia", "MesVencimiento", "UsuarioCreacion", "Estado")
          SELECT ${añoDestino}, "Mes", "DigitoRUC", "Dia", "MesVencimiento", ${usuario}, 'ACTIVO'
          FROM "CronogramaSunat"
          WHERE "Año" = ${añoOrigen} AND "Estado" = 'ACTIVO'
        `

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
          UPDATE "CronogramaSunat" 
          SET "Estado" = 'INACTIVO' 
          WHERE "Año" = ${año}
        `

        // Insertar nuevo cronograma
        for (const item of cronograma) {
          await sql`
            INSERT INTO "CronogramaSunat" (
              "Año", "Mes", "DigitoRUC", "Dia", "MesVencimiento",
              "FechaCreacion", "UsuarioCreacion", "Estado"
            ) VALUES (
              ${año}, ${item.mes}, ${item.digitoRuc}, ${item.dia}, ${item.mesVencimiento},
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
          UPDATE "CronogramaSunat" 
          SET "Estado" = 'INACTIVO' 
          WHERE "Año" = ${año}
        `

        return NextResponse.json({
          success: true,
          message: `Cronograma desactivado para el año ${año}`,
        })

      default:
        return NextResponse.json({ success: false, error: "Acción no válida" }, { status: 400 })
    }
  } catch (error: unknown) {
    console.error("Error en operación cronograma SUNAT:", error)

    // Manejar errores específicos de las stored procedures
    if (error instanceof Error) {
      if (error.message?.includes("Ya existe un cronograma")) {
        return NextResponse.json({ success: false, error: error.message }, { status: 409 })
      }

      if (error.message?.includes("No existe cronograma")) {
        return NextResponse.json({ success: false, error: error.message }, { status: 404 })
      }
    }

    return NextResponse.json({ success: false, error: "Error en operación del cronograma SUNAT" }, { status: 500 })
  }
}
