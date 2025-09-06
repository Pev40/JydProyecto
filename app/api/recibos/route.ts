import { NextResponse } from "next/server"
import { obtenerRecibosEnviados } from "@/lib/recibo-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    const { recibos, total, hasMore } = await obtenerRecibosEnviados(limit, offset)

    return NextResponse.json({
      success: true,
      recibos,
      pagination: {
        page,
        limit,
        total,
        hasMore,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    })
  } catch (error) {
    console.error("Error en GET /api/recibos:", error)
    return NextResponse.json({ success: false, error: "Error al listar recibos" }, { status: 500 })
  }
}


