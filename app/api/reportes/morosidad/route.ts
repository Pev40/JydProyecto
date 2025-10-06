import { getClientes, getPagos, getCompromisosPago } from "@/lib/queries"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Iniciando análisis de morosidad...')
    
    const [clientes, pagos, compromisos] = await Promise.all([
      getClientes(),
      getPagos(),
      getCompromisosPago()
    ])

    console.log('📊 Datos obtenidos:', {
      totalClientes: clientes.length,
      totalPagos: pagos.length,
      totalCompromisos: compromisos.length,
      clasificaciones: clientes.reduce((acc, c) => {
        acc[c.ClasificacionCodigo || 'Sin clasificación'] = (acc[c.ClasificacionCodigo || 'Sin clasificación'] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    })

    return NextResponse.json({
      success: true,
      clientes,
      pagos,
      compromisos
    })

  } catch (error) {
    console.error("Error generating morosidad analysis:", error)
    return NextResponse.json(
      { success: false, error: "Error al generar análisis de morosidad" },
      { status: 500 }
    )
  }
}



