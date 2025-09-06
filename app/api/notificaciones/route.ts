import { sql } from "@/lib/db"
import { NotificationService } from "@/lib/notification-service"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  if (!sql) {
    return NextResponse.json(
      { success: false, error: "Base de datos no configurada. Configure DATABASE_URL." },
      { status: 500 },
    )
  }

  try {
    const notificaciones = await sql`
      SELECT 
        n.*,
        c."RazonSocial" as "ClienteRazonSocial",
        tn."Nombre" as "TipoNotificacionNombre",
        u."NombreCompleto" as "ResponsableNombre"
      FROM "Notificacion" n
      LEFT JOIN "Cliente" c ON n."IdCliente" = c."IdCliente"
      LEFT JOIN "TipoNotificacion" tn ON n."IdTipoNotificacion" = tn."IdTipoNotificacion"
      LEFT JOIN "Usuario" u ON n."IdResponsable" = u."IdUsuario"
      ORDER BY n."FechaEnvio" DESC
      LIMIT 50
    `

    return NextResponse.json({ success: true, data: notificaciones })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ success: false, error: "Error al obtener notificaciones" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!sql) {
    return NextResponse.json(
      { success: false, error: "Base de datos no configurada. Configure DATABASE_URL." },
      { status: 500 },
    )
  }

  try {
    const body = await request.json()
    const { idCliente, idTipoNotificacion, contenido, asunto } = body

    // Validar campos requeridos
    if (!idCliente || !idTipoNotificacion || !contenido) {
      return NextResponse.json(
        { success: false, error: "Cliente, tipo de notificación y contenido son requeridos" },
        { status: 400 },
      )
    }

    // Obtener información del cliente
    const cliente = await sql`
      SELECT 
        c.*,
        cl."Codigo" as "ClasificacionCodigo"
      FROM "Cliente" c
      LEFT JOIN "Clasificacion" cl ON c."IdClasificacion" = cl."IdClasificacion"
      WHERE c."IdCliente" = ${idCliente}
    `

    if (cliente.length === 0) {
      return NextResponse.json({ success: false, error: "Cliente no encontrado" }, { status: 404 })
    }

    const clienteData = cliente[0]

    // Obtener tipo de notificación
    const tipoNotif = await sql`
      SELECT * FROM "TipoNotificacion" 
      WHERE "IdTipoNotificacion" = ${idTipoNotificacion}
    `

    if (tipoNotif.length === 0) {
      return NextResponse.json({ success: false, error: "Tipo de notificación no encontrado" }, { status: 404 })
    }

    const tipoData = tipoNotif[0]

    // Determinar destinatario según el tipo
    let destinatario = ""
    if (idTipoNotificacion === NotificationService.getTiposNotificacion().WHATSAPP) {
      destinatario = clienteData.Telefono
      if (!destinatario) {
        return NextResponse.json(
          { success: false, error: "Cliente no tiene teléfono registrado para WhatsApp" },
          { status: 400 },
        )
      }
    } else if (idTipoNotificacion === NotificationService.getTiposNotificacion().EMAIL) {
      destinatario = clienteData.Email
      if (!destinatario) {
        return NextResponse.json({ success: false, error: "Cliente no tiene email registrado" }, { status: 400 })
      }
    }

    // Registrar la notificación en la base de datos ANTES del envío
    const notificacionResult = await sql`
      INSERT INTO "Notificacion" (
        "IdCliente",
        "IdTipoNotificacion",
        "Contenido",
        "IdResponsable",
        "Estado"
      ) VALUES (
        ${idCliente},
        ${idTipoNotificacion},
        ${contenido},
        1,
        'PENDIENTE'
      ) RETURNING "IdNotificacion"
    `

    const notificacionId = notificacionResult[0].IdNotificacion

    // Enviar la notificación usando el servicio real
    const envioResult = await NotificationService.sendNotification(
      idTipoNotificacion,
      destinatario,
      contenido,
      asunto,
      clienteData.RazonSocial,
    )

    // Actualizar el estado de la notificación según el resultado
    const estadoFinal = envioResult.success ? "ENVIADO" : "ERROR"
    const observaciones = envioResult.success ? envioResult.message : envioResult.error

    await sql`
      UPDATE "Notificacion" 
      SET 
        "Estado" = ${estadoFinal},
        "Observaciones" = ${observaciones}
      WHERE "IdNotificacion" = ${notificacionId}
    `

    if (envioResult.success) {
      return NextResponse.json({
        success: true,
        notificacionId,
        message: `Notificación enviada exitosamente por ${tipoData.Nombre}`,
        details: envioResult.message,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: `Error al enviar por ${tipoData.Nombre}: ${envioResult.error}`,
          notificacionId, // Se registró pero falló el envío
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error sending notification:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor al enviar la notificación",
      },
      { status: 500 },
    )
  }
}
