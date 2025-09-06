import { NextResponse } from "next/server"
import { generarReciboParaPago } from "@/lib/recibo-service"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const pagoId = Number.parseInt(body?.pagoId)
    if (Number.isNaN(pagoId)) {
      return NextResponse.json({ success: false, error: "pagoId inválido" }, { status: 400 })
    }

    const res = await generarReciboParaPago(pagoId)
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error || "Error al generar" }, { status: 500 })
    }

    return NextResponse.json({ success: true, reciboId: res.reciboId, numeroRecibo: res.numeroRecibo })
  } catch (error) {
    console.error("Error en POST /api/recibos/generar:", error)
    return NextResponse.json({ success: false, error: "Error al generar recibo" }, { status: 500 })
  }
}


