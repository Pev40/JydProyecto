import { type NextRequest, NextResponse } from "next/server"
import { ProcesoAutomatico } from "@/lib/proceso-automatico"
import { requireRole } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    // Solo administradores pueden ejecutar el proceso manualmente
    await requireRole(["ADMIN"])

    const resultado = await ProcesoAutomatico.ejecutarProcesoManual()

    return NextResponse.json({
      success: true,
      resultado,
    })
  } catch (error) {
    console.error("Error ejecutando proceso automático:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Solo administradores pueden ver el historial
    await requireRole(["ADMIN"])

    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get("limit")) || 30

    const historial = await ProcesoAutomatico.obtenerHistorialProceso(limit)

    return NextResponse.json({
      success: true,
      historial,
    })
  } catch (error) {
    console.error("Error obteniendo historial del proceso:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
