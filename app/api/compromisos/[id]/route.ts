import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  if (!sql) {
    return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })
  }

  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const compromiso = await sql`
      SELECT 
        cp.*,
        c."RazonSocial" as "ClienteRazonSocial",
        u."NombreCompleto" as "ResponsableNombre",
        p."Monto" as "MontoPagoVinculado",
        p."Fecha" as "FechaPagoVinculado"
      FROM "CompromisoPago" cp
      LEFT JOIN "Cliente" c ON cp."IdCliente" = c."IdCliente"
      LEFT JOIN "Usuario" u ON cp."IdResponsable" = u."IdUsuario"
      LEFT JOIN "Pago" p ON cp."IdPagoVinculado" = p."IdPago"
      WHERE cp."IdCompromisoPago" = ${id}
    `

    if (compromiso.length === 0) {
      return NextResponse.json({ error: "Compromiso no encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      compromiso: compromiso[0],
    })
  } catch (error) {
    console.error("❌ Error al obtener compromiso:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener compromiso",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  if (!sql) {
    return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })
  }

  try {
    const id = Number.parseInt(params.id)
    const body = await request.json()

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const { estado, idPagoVinculado, observaciones } = body

    console.log(`🔄 Actualizando compromiso ${id}:`, { estado, idPagoVinculado, observaciones })

    // Verificar que el compromiso existe
    const compromisoExistente = await sql`
      SELECT * FROM "CompromisoPago" WHERE "IdCompromisoPago" = ${id}
    `

    if (compromisoExistente.length === 0) {
      return NextResponse.json({ error: "Compromiso no encontrado" }, { status: 404 })
    }

    // Actualizar el compromiso
    const compromisoActualizado = await sql`
      UPDATE "CompromisoPago" 
      SET 
        "Estado" = ${estado || compromisoExistente[0].Estado},
        "IdPagoVinculado" = ${idPagoVinculado || compromisoExistente[0].IdPagoVinculado},
        "Observaciones" = ${observaciones || compromisoExistente[0].Observaciones},
        "FechaActualizacion" = CURRENT_TIMESTAMP
      WHERE "IdCompromisoPago" = ${id}
      RETURNING *
    `

    // Si se vincula un pago, registrar en el historial
    if (idPagoVinculado && estado === "CUMPLIDO") {
      console.log(`✅ Compromiso ${id} cumplido mediante pago ${idPagoVinculado}`)

      // Opcional: Registrar en una tabla de historial de compromisos
      try {
        await sql`
          INSERT INTO "HistorialCompromiso" (
            "IdCompromisoPago",
            "EstadoAnterior",
            "EstadoNuevo", 
            "IdPagoVinculado",
            "FechaCambio",
            "Observaciones"
          ) VALUES (
            ${id},
            ${compromisoExistente[0].Estado},
            ${estado},
            ${idPagoVinculado},
            CURRENT_TIMESTAMP,
            ${observaciones || "Compromiso cumplido mediante pago registrado"}
          )
        `
      } catch (historialError) {
        console.warn("⚠️ No se pudo registrar en historial de compromisos:", historialError)
        // No fallar la actualización por esto
      }
    }

    return NextResponse.json({
      success: true,
      message: "Compromiso actualizado exitosamente",
      compromiso: compromisoActualizado[0],
    })
  } catch (error) {
    console.error("❌ Error al actualizar compromiso:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al actualizar compromiso",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!sql) {
    return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })
  }

  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    // Verificar que el compromiso existe y no está vinculado a un pago
    const compromiso = await sql`
      SELECT * FROM "CompromisoPago" 
      WHERE "IdCompromisoPago" = ${id}
    `

    if (compromiso.length === 0) {
      return NextResponse.json({ error: "Compromiso no encontrado" }, { status: 404 })
    }

    if (compromiso[0].IdPagoVinculado) {
      return NextResponse.json(
        {
          error: "No se puede eliminar un compromiso vinculado a un pago",
        },
        { status: 400 },
      )
    }

    // Eliminar el compromiso
    await sql`
      DELETE FROM "CompromisoPago" WHERE "IdCompromisoPago" = ${id}
    `

    console.log(`🗑️ Compromiso ${id} eliminado exitosamente`)

    return NextResponse.json({
      success: true,
      message: "Compromiso eliminado exitosamente",
    })
  } catch (error) {
    console.error("❌ Error al eliminar compromiso:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al eliminar compromiso",
      },
      { status: 500 },
    )
  }
}
