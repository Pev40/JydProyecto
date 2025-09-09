import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user || (user.rol !== "ADMIN" && user.rol !== "EMPLOYEE")) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 })
    }

    const clienteId = Number.parseInt(params.id)
    const { estado } = await request.json()

    // Validar estado
    if (!["ACTIVO", "INACTIVO"].includes(estado)) {
      return NextResponse.json({ success: false, error: "Estado no válido" }, { status: 400 })
    }

    // Verificar que el cliente existe
    const clienteExiste = await sql`
      SELECT "IdCliente", "RazonSocial", "Estado"
      FROM "Cliente" 
      WHERE "IdCliente" = ${clienteId}
    `

    if (clienteExiste.length === 0) {
      return NextResponse.json({ success: false, error: "Cliente no encontrado" }, { status: 404 })
    }

    // Actualizar estado del cliente
    await sql`
      UPDATE "Cliente" 
      SET "Estado" = ${estado}, "FechaActualizacion" = NOW()
      WHERE "IdCliente" = ${clienteId}
    `

    // Log de la acción
    console.log(`Usuario ${user.email} cambió el estado del cliente ${clienteExiste[0].RazonSocial} a ${estado}`)

    return NextResponse.json({
      success: true,
      message: `Estado del cliente actualizado a ${estado}`,
      data: {
        clienteId,
        nuevoEstado: estado,
        cliente: clienteExiste[0].RazonSocial
      }
    })

  } catch (error) {
    console.error("Error actualizando estado del cliente:", error)
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
