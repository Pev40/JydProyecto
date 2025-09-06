import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    if (!sql) {
      return NextResponse.json({ error: "Base de datos no disponible" }, { status: 500 })
    }

    // Verificar datos de caja variable
    const cajaVariableCount = await sql`
      SELECT COUNT(*) as total FROM VistaReporteCajaVariable 
      WHERE "Año" = ${new Date().getFullYear()}
    `

    // Verificar datos de caja fija
    const cajaFijaCount = await sql`
      SELECT COUNT(*) as total FROM VistaReporteCajaFijaProyectado
    `

    // Verificar proyecciones
    const proyeccionesCount = await sql`
      SELECT COUNT(*) as total FROM "ProyeccionesCajaFija" 
      WHERE "Año" = ${new Date().getFullYear()}
    `

    // Verificar clientes con monto fijo
    const clientesFijosCount = await sql`
      SELECT COUNT(*) as total FROM "Cliente" 
      WHERE "AplicaMontoFijo" = true
    `

    // Verificar pagos recientes
    const pagosRecientesCount = await sql`
      SELECT COUNT(*) as total FROM "Pago" 
      WHERE "Fecha" >= CURRENT_DATE - INTERVAL '30 days'
    `

    // Obtener muestra de datos de caja variable
    const muestraCajaVariable = await sql`
      SELECT * FROM VistaReporteCajaVariable 
      LIMIT 3
    `

    // Obtener muestra de datos de caja fija
    const muestraCajaFija = await sql`
      SELECT * FROM ObtenerReporteCajaFijaProyectado(${new Date().getFullYear()})
      LIMIT 3
    `

    return NextResponse.json({
      verificacion: {
        cajaVariable: {
          total: cajaVariableCount[0]?.total || 0,
          muestra: muestraCajaVariable,
        },
        cajaFija: {
          total: cajaFijaCount[0]?.total || 0,
          muestra: muestraCajaFija,
        },
        proyecciones: {
          total: proyeccionesCount[0]?.total || 0,
        },
        clientesFijos: {
          total: clientesFijosCount[0]?.total || 0,
        },
        pagosRecientes: {
          total: pagosRecientesCount[0]?.total || 0,
        },
      },
      estado: "OK",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error verificando datos:", error)
    return NextResponse.json(
      {
        error: "Error al verificar datos",
        details: error instanceof Error ? error.message : "Error desconocido",
        estado: "ERROR",
      },
      { status: 500 },
    )
  }
}
