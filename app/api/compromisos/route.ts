import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  if (!sql) {
    return NextResponse.json(
      { error: "Base de datos no disponible" },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const {
      idCliente,
      fechaCompromiso,
      montoCompromiso,
      observaciones,
      idResponsable = 1, // TODO: Obtener del usuario actual
    } = body

    console.log("📝 Registrando nuevo compromiso:", { idCliente, fechaCompromiso, montoCompromiso })

    // Validaciones básicas
    if (!idCliente || !fechaCompromiso || !montoCompromiso) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      )
    }

    // Verificar que el cliente existe
    const cliente = await sql`
      SELECT "IdCliente", "RazonSocial" 
      FROM "Cliente" 
      WHERE "IdCliente" = ${idCliente}
    `

    if (cliente.length === 0) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      )
    }

    // Insertar el compromiso
    const nuevoCompromiso = await sql`
      INSERT INTO "CompromisoPago" (
        "IdCliente",
        "FechaCompromiso",
        "MontoCompromiso",
        "IdResponsable",
        "Observaciones",
        "Estado"
      ) VALUES (
        ${idCliente},
        ${fechaCompromiso},
        ${montoCompromiso},
        ${idResponsable},
        ${observaciones || null},
        'PENDIENTE'
      ) RETURNING *
    `

    const compromisoId = nuevoCompromiso[0].IdCompromisoPago
    console.log(`✅ Compromiso registrado con ID: ${compromisoId}`)

    return NextResponse.json({
      success: true,
      message: "Compromiso registrado exitosamente",
      compromiso: nuevoCompromiso[0],
    })
  } catch (error) {
    console.error("❌ Error al crear compromiso:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al crear compromiso",
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  if (!sql) {
    return NextResponse.json(
      { error: "Base de datos no disponible" },
      { status: 503 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get("cliente_id")
    const estado = searchParams.get("estado")

    let compromisos = []
    
    try {
      if (clienteId) {
        compromisos = await sql`
          SELECT 
            cp.*,
            c."RazonSocial" as "ClienteRazonSocial",
            u."NombreCompleto" as "ResponsableNombre"
          FROM "CompromisoPago" cp
          JOIN "Cliente" c ON cp."IdCliente" = c."IdCliente"
          LEFT JOIN "Usuario" u ON cp."IdResponsable" = u."IdUsuario"
          WHERE cp."IdCliente" = ${clienteId}
          ORDER BY cp."FechaCompromiso" DESC
        `
      } else if (estado) {
        compromisos = await sql`
          SELECT 
            cp.*,
            c."RazonSocial" as "ClienteRazonSocial",
            u."NombreCompleto" as "ResponsableNombre"
          FROM "CompromisoPago" cp
          JOIN "Cliente" c ON cp."IdCliente" = c."IdCliente"
          LEFT JOIN "Usuario" u ON cp."IdResponsable" = u."IdUsuario"
          WHERE cp."Estado" = ${estado}
          ORDER BY cp."FechaCompromiso" DESC
        `
      } else {
        compromisos = await sql`
          SELECT 
            cp.*,
            c."RazonSocial" as "ClienteRazonSocial",
            u."NombreCompleto" as "ResponsableNombre"
          FROM "CompromisoPago" cp
          JOIN "Cliente" c ON cp."IdCliente" = c."IdCliente"
          LEFT JOIN "Usuario" u ON cp."IdResponsable" = u."IdUsuario"
          ORDER BY cp."FechaCompromiso" DESC
        `
      }
    } catch (queryError) {
      console.error('Error en consulta de compromisos:', queryError)
      compromisos = []
    }

    return NextResponse.json({
      success: true,
      compromisos: compromisos || [],
    })
  } catch (error) {
    console.error("❌ Error al obtener compromisos:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener compromisos",
      },
      { status: 500 }
    )
  }
}