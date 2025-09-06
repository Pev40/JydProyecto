import { decolectaService } from "@/lib/decolecta-service"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get("fecha")
    const mes = searchParams.get("mes")
    const año = searchParams.get("año")

    let data

    if (mes && año) {
      // Consulta mensual
      data = await decolectaService.obtenerTipoCambioMensual(Number.parseInt(mes), Number.parseInt(año))
    } else {
      // Consulta por fecha específica o actual
      data = await decolectaService.obtenerTipoCambio(fecha || undefined)
    }

    if (!data) {
      return NextResponse.json({ success: false, error: "No se pudo obtener el tipo de cambio" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("Error getting exchange rate:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
