import { NextResponse } from "next/server"
import { obtenerEstadisticasRecibos } from "@/lib/recibo-service"

export async function GET() {
  try {
    const estadisticas = await obtenerEstadisticasRecibos()
    return NextResponse.json(estadisticas)
  } catch (error) {
    console.error("Error al obtener estadísticas de recibos:", error)
    return NextResponse.json({ error: "Error al obtener estadísticas" }, { status: 500 })
  }
}
