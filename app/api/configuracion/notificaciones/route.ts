import { NotificationService } from "@/lib/notification-service"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const validation = NotificationService.validateConfiguration()

    const configuracion = {
      whatsapp: validation.whatsapp,
      email: validation.email,
      evolution: validation.whatsapp
        ? {
            baseUrl: process.env.EVOLUTION_BASE_URL,
            instanceKey: process.env.EVOLUTION_INSTANCE_KEY,
          }
        : null,
      smtp: validation.email
        ? {
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            user: process.env.EMAIL_USER,
            secure: process.env.EMAIL_SECURE === "true",
          }
        : null,
    }

    return NextResponse.json({
      success: true,
      data: configuracion,
    })
  } catch (error) {
    console.error("Error getting notification configuration:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener la configuración",
      },
      { status: 500 },
    )
  }
}
