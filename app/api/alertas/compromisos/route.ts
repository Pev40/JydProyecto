import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  if (!sql) {
    return NextResponse.json(
      { success: false, error: "Base de datos no configurada. Configure DATABASE_URL." },
      { status: 500 },
    )
  }

  try {
    // Obtener compromisos vencidos
    const compromisosVencidos = await sql`
      SELECT 
        cp.*,
        c."RazonSocial",
        c."NombreContacto",
        c."Email",
        c."Telefono",
        u."NombreCompleto" as "ResponsableNombre"
      FROM "CompromisoPago" cp
      LEFT JOIN "Cliente" c ON cp."IdCliente" = c."IdCliente"
      LEFT JOIN "Usuario" u ON cp."IdResponsable" = u."IdUsuario"
      WHERE cp."Estado" = 'PENDIENTE'
      AND cp."FechaCompromiso" < CURRENT_DATE
      ORDER BY cp."FechaCompromiso" ASC
    `

    // Obtener compromisos que vencen hoy
    const compromisosHoy = await sql`
      SELECT 
        cp.*,
        c."RazonSocial",
        c."NombreContacto",
        c."Email",
        c."Telefono",
        u."NombreCompleto" as "ResponsableNombre"
      FROM "CompromisoPago" cp
      LEFT JOIN "Cliente" c ON cp."IdCliente" = c."IdCliente"
      LEFT JOIN "Usuario" u ON cp."IdResponsable" = u."IdUsuario"
      WHERE cp."Estado" = 'PENDIENTE'
      AND cp."FechaCompromiso" = CURRENT_DATE
      ORDER BY cp."MontoCompromiso" DESC
    `

    // Obtener compromisos que vencen en los próximos 3 días
    const compromisosProximos = await sql`
      SELECT 
        cp.*,
        c."RazonSocial",
        c."NombreContacto",
        c."Email",
        c."Telefono",
        u."NombreCompleto" as "ResponsableNombre"
      FROM "CompromisoPago" cp
      LEFT JOIN "Cliente" c ON cp."IdCliente" = c."IdCliente"
      LEFT JOIN "Usuario" u ON cp."IdResponsable" = u."IdUsuario"
      WHERE cp."Estado" = 'PENDIENTE'
      AND cp."FechaCompromiso" BETWEEN CURRENT_DATE + INTERVAL '1 day' AND CURRENT_DATE + INTERVAL '3 days'
      ORDER BY cp."FechaCompromiso" ASC
    `

    return NextResponse.json({
      success: true,
      alertas: {
        vencidos: compromisosVencidos,
        hoy: compromisosHoy,
        proximos: compromisosProximos,
      },
    })
  } catch (error) {
    console.error("Error fetching commitment alerts:", error)
    return NextResponse.json({ success: false, error: "Error al obtener alertas de compromisos" }, { status: 500 })
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
    const { tipo } = body // 'vencidos', 'hoy', 'proximos'

    let alertasEnviadas = 0

    if (tipo === "vencidos" || tipo === "todos") {
      // Enviar alertas por compromisos vencidos
      const compromisosVencidos = await sql`
        SELECT 
          cp.*,
          c."RazonSocial",
          c."NombreContacto",
          c."Email",
          c."Telefono",
          u."NombreCompleto" as "ResponsableNombre",
          u."Email" as "ResponsableEmail"
        FROM "CompromisoPago" cp
        LEFT JOIN "Cliente" c ON cp."IdCliente" = c."IdCliente"
        LEFT JOIN "Usuario" u ON cp."IdResponsable" = u."IdUsuario"
        WHERE cp."Estado" = 'PENDIENTE'
        AND cp."FechaCompromiso" < CURRENT_DATE
      `

      for (const compromiso of compromisosVencidos) {
        const diasVencido = Math.floor(
          (Date.now() - new Date(compromiso.FechaCompromiso).getTime()) / (1000 * 60 * 60 * 24),
        )

        const contenido = `🚨 COMPROMISO VENCIDO 🚨

Cliente: ${compromiso.RazonSocial}
Monto: S/ ${Number(compromiso.MontoCompromiso).toFixed(2)}
Fecha compromiso: ${new Date(compromiso.FechaCompromiso).toLocaleDateString("es-PE")}
Días vencido: ${diasVencido}
Responsable: ${compromiso.ResponsableNombre}

Acción requerida: Contactar al cliente inmediatamente.`

        // Registrar notificación interna
        await sql`
          INSERT INTO "Notificacion" (
            "IdCliente",
            "IdTipoNotificacion",
            "Contenido",
            "IdResponsable",
            "Estado"
          ) VALUES (
            ${compromiso.IdCliente},
            2,
            ${contenido},
            1,
            'ENVIADO'
          )
        `

        // Enviar email al responsable (simulado)
        if (compromiso.ResponsableEmail) {
          console.log(`Alerta enviada a ${compromiso.ResponsableEmail}: ${contenido}`)
        }

        alertasEnviadas++
      }
    }

    if (tipo === "hoy" || tipo === "todos") {
      // Enviar recordatorios por compromisos de hoy
      const compromisosHoy = await sql`
        SELECT 
          cp.*,
          c."RazonSocial",
          c."NombreContacto",
          c."Email",
          c."Telefono",
          u."NombreCompleto" as "ResponsableNombre",
          u."Email" as "ResponsableEmail"
        FROM "CompromisoPago" cp
        LEFT JOIN "Cliente" c ON cp."IdCliente" = c."IdCliente"
        LEFT JOIN "Usuario" u ON cp."IdResponsable" = u."IdUsuario"
        WHERE cp."Estado" = 'PENDIENTE'
        AND cp."FechaCompromiso" = CURRENT_DATE
      `

      for (const compromiso of compromisosHoy) {
        const contenido = `📅 COMPROMISO HOY 📅

Cliente: ${compromiso.RazonSocial}
Monto: S/ ${Number(compromiso.MontoCompromiso).toFixed(2)}
Fecha compromiso: HOY
Responsable: ${compromiso.ResponsableNombre}

Recordatorio: Hacer seguimiento del pago prometido.`

        // Registrar notificación interna
        await sql`
          INSERT INTO "Notificacion" (
            "IdCliente",
            "IdTipoNotificacion",
            "Contenido",
            "IdResponsable",
            "Estado"
          ) VALUES (
            ${compromiso.IdCliente},
            2,
            ${contenido},
            1,
            'ENVIADO'
          )
        `

        alertasEnviadas++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Se enviaron ${alertasEnviadas} alertas de compromisos`,
      alertasEnviadas,
    })
  } catch (error) {
    console.error("Error sending commitment alerts:", error)
    return NextResponse.json({ success: false, error: "Error al enviar alertas de compromisos" }, { status: 500 })
  }
}
