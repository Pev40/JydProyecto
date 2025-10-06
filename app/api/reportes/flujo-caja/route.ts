import { getClientes, getPagos, getPagosPorMes, getCatalogos } from "@/lib/queries"
import { NextRequest, NextResponse } from "next/server"

// Forzar que esta ruta sea dinámica ya que usa parámetros de consulta
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tipo = searchParams.get("tipo") || "digito"
    const periodo = searchParams.get("periodo") || "mes"
    const año = searchParams.get("año") ? Number.parseInt(searchParams.get("año")!) : undefined
    const mes = searchParams.get("mes") ? Number.parseInt(searchParams.get("mes")!) : undefined

    // Obtener datos según el período seleccionado
    const [clientes, pagos, catalogos] = await Promise.all([
      getClientes(),
      periodo === "mes" ? getPagosPorMes(año, mes) : getPagos(),
      getCatalogos()
    ])

    // Generar reporte según el tipo seleccionado
    let reporteData: any[] = []

    if (tipo === "digito") {
      // Flujo de caja por dígito RUC
      reporteData = generarReportePorDigito(clientes, pagos)
    } else if (tipo === "cartera") {
      // Flujo de caja por cartera
      reporteData = generarReportePorCartera(
        clientes,
        pagos,
        catalogos.carteras || []
      )
    }

    return NextResponse.json({
      success: true,
      clientes,
      pagos,
      catalogos,
      reporteData
    })

  } catch (error) {
    console.error("Error generating flujo de caja report:", error)
    return NextResponse.json(
      { success: false, error: "Error al generar reporte" },
      { status: 500 }
    )
  }
}

function generarReportePorDigito(clientes: any[], pagos: any[]) {
  const reporte = []

  for (let digito = 0; digito <= 9; digito++) {
    const clientesDigito = clientes.filter((c) => c.UltimoDigitoRUC === digito)
    const pagosDigito = pagos.filter((p) => clientesDigito.some((c) => c.IdCliente === p.IdCliente))

    const totalPagado = pagosDigito.reduce((sum, p) => sum + Number(p.Monto || 0), 0)
    const saldoPendiente = clientesDigito.reduce((sum, c) => sum + Number(c.SaldoPendiente || 0), 0)
    const totalEsperado = Number(totalPagado) + Number(saldoPendiente)
    const porcentajeCobranza = totalEsperado > 0 ? (Number(totalPagado) / Number(totalEsperado)) * 100 : 0
    const promedioPorCliente = clientesDigito.length > 0 ? Number(totalPagado) / clientesDigito.length : 0

    reporte.push({
      categoria: digito.toString(),
      cantidadClientes: clientesDigito.length,
      totalPagado,
      saldoPendiente,
      porcentajeCobranza,
      promedioPorCliente,
    })
  }

  return reporte.sort((a, b) => b.totalPagado - a.totalPagado)
}

function generarReportePorCartera(
  clientes: any[],
  pagos: any[],
  carteras: { IdCartera: number; Nombre: string }[]
) {
  const reporte = []

  for (const cartera of carteras) {
    const clientesCartera = clientes.filter((c) => c.IdCartera === cartera.IdCartera)
    const pagosCartera = pagos.filter((p) => clientesCartera.some((c) => c.IdCliente === p.IdCliente))

    const totalPagado = pagosCartera.reduce((sum, p) => sum + Number(p.Monto || 0), 0)
    const saldoPendiente = clientesCartera.reduce((sum, c) => sum + Number(c.SaldoPendiente || 0), 0)
    const totalEsperado = Number(totalPagado) + Number(saldoPendiente)
    const porcentajeCobranza = totalEsperado > 0 ? (Number(totalPagado) / Number(totalEsperado)) * 100 : 0
    const promedioPorCliente = clientesCartera.length > 0 ? Number(totalPagado) / clientesCartera.length : 0

    reporte.push({
      categoria: cartera.Nombre,
      cantidadClientes: clientesCartera.length,
      totalPagado,
      saldoPendiente,
      porcentajeCobranza,
      promedioPorCliente,
    })
  }

  return reporte.sort((a, b) => b.totalPagado - a.totalPagado)
}
