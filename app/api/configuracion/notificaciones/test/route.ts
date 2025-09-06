import { NotificationService } from "@/lib/notification-service"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tipo, destinatario, mensaje, asunto } = body

    if (!tipo || !destinatario || !mensaje) {
      return NextResponse.json(
        {
          success: false,
          error: "Tipo, destinatario y mensaje son requeridos",
        },
        { status: 400 },
      )
    }

    let result

    if (tipo === "whatsapp") {
      result = await NotificationService.sendWhatsApp(destinatario, mensaje, "Prueba")
    } else if (tipo === "email") {
      result = await NotificationService.sendEmail(destinatario, asunto || "Prueba del Sistema", mensaje, "Prueba")
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Tipo de notificación no válido",
        },
        { status: 400 },
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error testing notification:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al probar la notificación",
      },
      { status: 500 },
    )
  }
}
