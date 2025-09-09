import { type NextRequest, NextResponse } from "next/server"
import { sql, testConnection } from "@/lib/db"

export async function GET() {
  try {
    if (!sql || !(await testConnection())) {
      return NextResponse.json([
        { IdCartera: 1, Nombre: "Cartera Arequipa", IdEncargado: null, Estado: "ACTIVA" },
        { IdCartera: 2, Nombre: "Cartera Trujillo", IdEncargado: null, Estado: "ACTIVA" },
      ])
    }

    const carteras = await sql`
      SELECT 
        c."IdCartera",
        c."Nombre",
        c."IdEncargado",
        c."FechaCreacion",
        c."Estado",
        u."NombreCompleto" as "EncargadoNombre"
      FROM "Cartera" c
      LEFT JOIN "Usuario" u ON c."IdEncargado" = u."IdUsuario"
      ORDER BY c."Nombre"
    `

    return NextResponse.json(carteras)
  } catch (error) {
    console.error("Error fetching carteras:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { Nombre, IdEncargado, Estado } = await request.json()

    if (!sql || !(await testConnection())) {
      return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })
    }

    const result = await sql`
      INSERT INTO "Cartera" ("Nombre", "IdEncargado", "Estado", "FechaCreacion")
      VALUES (${Nombre}, ${IdEncargado || null}, ${Estado || 'ACTIVA'}, NOW())
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating cartera:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
