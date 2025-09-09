import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const incluirInactivos = searchParams.get("incluirInactivos") === "true"

    if (!query || query.length < 2) {
      return NextResponse.json({ 
        success: true, 
        clientes: [],
        message: "Mínimo 2 caracteres para buscar"
      })
    }

    // Construir la consulta de búsqueda
    const searchTerm = `%${query.toLowerCase()}%`
    
    let whereClause = sql`
      WHERE (
        LOWER(c."RazonSocial") LIKE ${searchTerm} 
        OR c."RucDni" LIKE ${searchTerm}
        OR LOWER(c."NombreContacto") LIKE ${searchTerm}
      )
    `

    // Si no incluir inactivos, filtrar solo activos
    if (!incluirInactivos) {
      whereClause = sql`
        WHERE (
          LOWER(c."RazonSocial") LIKE ${searchTerm} 
          OR c."RucDni" LIKE ${searchTerm}
          OR LOWER(c."NombreContacto") LIKE ${searchTerm}
        )
        AND c."Estado" = 'ACTIVO'
      `
    }

    const clientes = await sql`
      SELECT 
        c."IdCliente",
        c."RazonSocial",
        c."RucDni",
        c."Estado",
        c."NombreContacto",
        c."Email",
        c."Telefono",
        c."FechaRegistro"
      FROM "Cliente" c
      ${whereClause}
      ORDER BY c."FechaRegistro" DESC, c."RazonSocial" ASC
      LIMIT 20
    `

    return NextResponse.json({
      success: true,
      clientes: clientes,
      total: clientes.length
    })

  } catch (error) {
    console.error("Error en búsqueda de clientes:", error)
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
