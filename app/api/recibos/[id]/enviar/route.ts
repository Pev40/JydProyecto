import { NextResponse } from "next/server"
import { ReciboService } from "@/lib/recibo-service"

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const id = Number.parseInt(params.id)
    if (Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 })
    }

    const result = await ReciboService.reenviarRecibo(id)
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || "Error al enviar" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error en POST /api/recibos/:id/enviar:", error)
    return NextResponse.json({ success: false, error: "Error al enviar recibo" }, { status: 500 })
  }
}


