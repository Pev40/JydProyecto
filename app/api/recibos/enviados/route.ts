import { type NextRequest, NextResponse } from "next/server"
import { obtenerRecibosEnviados } from "@/lib/recibo-service"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const busqueda = searchParams.get("busqueda")
    const estado = searchParams.get("estado")
    const fecha = searchParams.get("fecha")

    const offset = (page - 1) * limit

    const resultado = await obtenerRecibosEnviados(limit, offset)

    return NextResponse.json(resultado)
  } catch (error) {
    console.error("Error al obtener recibos enviados:", error)
    return NextResponse.json({ error: "Error al obtener recibos enviados" }, { status: 500 })
  }
}
