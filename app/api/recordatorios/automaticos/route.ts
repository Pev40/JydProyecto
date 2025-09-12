import { sql } from "@/lib/db"
import { NotificationService } from "@/lib/notification-service"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(_request: NextRequest) {
  if (!sql) {
    return NextResponse.json(
      { success: false, error: "Base de datos no configurada. Configure DATABASE_URL." },
      { status: 500 },
    )
  }

  try {
    // Obtener configuración de recordatorios
    const configuracion = {
      diasAntes: 3,
      horaEnvio: "09:00",
      frecuenciaDias: 7,
      habilitado: true,
    }

    if (!configuracion.habilitado) {
      return NextResponse.json({
        success: true,
        message: "Recordatorios automáticos deshabilitados",
        enviados: 0,
      })
    }

    // Validar configuración de servicios de notificación
    const configValidation = NotificationService.validateConfiguration()
    if (!configValidation.whatsapp && !configValidation.email) {
      return NextResponse.json(
        {
          success: false,
          error: "No hay servicios de notificación configurados (WhatsApp o Email)",
        },
        { status: 500 },
      )
    }

    // Obtener clientes que necesitan recordatorios
    const clientesParaRecordatorio = await sql`
      SELECT 
        c.*,
        cl."Codigo" as "ClasificacionCodigo",
        cl."Descripcion" as "ClasificacionDescripcion",
        pm."Contenido" as "PlantillaMensaje",
        COALESCE(
          (c."MontoFijoMensual" * EXTRACT(MONTH FROM AGE(CURRENT_DATE, c."FechaRegistro"))) - 
          COALESCE(SUM(p."Monto"), 0), 
          0
        ) as "SaldoPendiente"
      FROM "Cliente" c
      LEFT JOIN "Clasificacion" cl ON c."IdClasificacion" = cl."IdClasificacion"
      LEFT JOIN "PlantillaMensaje" pm ON cl."IdClasificacion" = pm."IdClasificacion"
      LEFT JOIN "Pago" p ON c."IdCliente" = p."IdCliente" AND p."Estado" = 'CONFIRMADO'
      WHERE c."IdClasificacion" IN (2, 3) -- Solo clientes B y C
      GROUP BY c."IdCliente", cl."Codigo", cl."Descripcion", pm."Contenido"
      HAVING COALESCE(
        (c."MontoFijoMensual" * EXTRACT(MONTH FROM AGE(CURRENT_DATE, c."FechaRegistro"))) - 
        COALESCE(SUM(p."Monto"), 0), 
        0
      ) > 0
    `

    let recordatoriosEnviados = 0
    let erroresEnvio = 0
    interface ResultadoEnvio {
      cliente: string
      estado: "OMITIDO" | "ENVIADO" | "ERROR"
      razon?: string
      tipo?: string
      destinatario?: string
    }
    const resultados: ResultadoEnvio[] = []

    for (const cliente of clientesParaRecordatorio) {
      try {
        // Verificar si ya se envió un recordatorio reciente
        const recordatorioReciente = await sql`
          SELECT "IdNotificacion"
          FROM "Notificacion"
          WHERE "IdCliente" = ${cliente.IdCliente}
          AND "FechaEnvio" > CURRENT_DATE - INTERVAL '${configuracion.frecuenciaDias} days'
          AND "Contenido" LIKE '%recordatorio%'
        `

        if (recordatorioReciente.length > 0) {
          resultados.push({
            cliente: cliente.RazonSocial,
            estado: "OMITIDO",
            razon: "Recordatorio reciente ya enviado",
          })
          continue
        }

        // Personalizar mensaje
        let contenido = cliente.PlantillaMensaje || getPlantillaPorDefecto(cliente.ClasificacionCodigo)
        contenido = contenido
          .replace("{cliente}", cliente.RazonSocial)
          .replace("{contacto}", cliente.NombreContacto || "")
          .replace("{monto}", cliente.SaldoPendiente.toFixed(2))

        // Determinar tipo de notificación preferido
        let tipoNotificacion = NotificationService.getTiposNotificacion().WHATSAPP
        let destinatario = cliente.Telefono

        // Si no hay WhatsApp configurado o no hay teléfono, usar email
        if (!configValidation.whatsapp || !cliente.Telefono) {
          if (configValidation.email && cliente.Email) {
            tipoNotificacion = NotificationService.getTiposNotificacion().EMAIL
            destinatario = cliente.Email
          } else {
            resultados.push({
              cliente: cliente.RazonSocial,
              estado: "ERROR",
              razon: "No hay teléfono ni email disponible",
            })
            erroresEnvio++
            continue
          }
        }

        // Registrar notificación en la base de datos
        const notificacionResult = await sql`
          INSERT INTO "Notificacion" (
            "IdCliente",
            "IdTipoNotificacion",
            "Contenido",
            "IdResponsable",
            "Estado"
          ) VALUES (
            ${cliente.IdCliente},
            ${tipoNotificacion},
            ${contenido},
            1,
            'PENDIENTE'
          ) RETURNING "IdNotificacion"
        `

        const notificacionId = notificacionResult[0].IdNotificacion

        // Enviar notificación usando el servicio real
        const envioResult = await NotificationService.sendNotification(
          tipoNotificacion,
          destinatario,
          contenido,
          "Recordatorio de Pago - " + process.env.NEXT_PUBLIC_COMPANY_NAME,
          cliente.RazonSocial,
        )

        // Actualizar estado en la base de datos
        const estadoFinal = envioResult.success ? "ENVIADO" : "ERROR"
        await sql`
          UPDATE "Notificacion" 
          SET 
            "Estado" = ${estadoFinal},
            "Observaciones" = ${envioResult.success ? envioResult.message : envioResult.error}
          WHERE "IdNotificacion" = ${notificacionId}
        `

        if (envioResult.success) {
          recordatoriosEnviados++
          resultados.push({
            cliente: cliente.RazonSocial,
            estado: "ENVIADO",
            tipo: tipoNotificacion === NotificationService.getTiposNotificacion().WHATSAPP ? "WhatsApp" : "Email",
            destinatario: destinatario,
          })
        } else {
          erroresEnvio++
          resultados.push({
            cliente: cliente.RazonSocial,
            estado: "ERROR",
            razon: envioResult.error,
          })
        }

        // Pequeña pausa entre envíos para evitar rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`Error procesando cliente ${cliente.RazonSocial}:`, error)
        erroresEnvio++
        resultados.push({
          cliente: cliente.RazonSocial,
          estado: "ERROR",
          razon: error instanceof Error ? error.message : "Error desconocido",
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Proceso completado: ${recordatoriosEnviados} enviados, ${erroresEnvio} errores`,
      enviados: recordatoriosEnviados,
      errores: erroresEnvio,
      total: clientesParaRecordatorio.length,
      resultados,
      configuracion: {
        whatsappDisponible: configValidation.whatsapp,
        emailDisponible: configValidation.email,
      },
    })
  } catch (error) {
    console.error("Error sending automatic reminders:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al enviar recordatorios automáticos",
      },
      { status: 500 },
    )
  }
}

function getPlantillaPorDefecto(clasificacion: string): string {
  switch (clasificacion) {
    case "B":
      return "Estimado {cliente}, le recordamos que tiene un pago pendiente de S/ {monto}. Por favor regularice su situación a la brevedad. Gracias."
    case "C":
      return "Estimado {cliente}, su cuenta presenta una deuda vencida de S/ {monto}. Comuníquese urgentemente para evitar el corte del servicio."
    default:
      return "Estimado {cliente}, le recordamos sobre su pago pendiente de S/ {monto}. Gracias por su atención."
  }
}
