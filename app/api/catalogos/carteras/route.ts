import { type NextRequest, NextResponse } from "next/server"
import { sql, testConnection } from "@/lib/db"

export async function GET() {
  try {
    if (!sql || !(await testConnection())) {
      return NextResponse.json([
        { IdCartera: 1, Nombre: "Cartera Arequipa", Descripcion: "Clientes de Arequipa", Estado: "ACTIVA" },
        { IdCartera: 2, Nombre: "Cartera Trujillo", Descripcion: "Clientes de Trujillo", Estado: "ACTIVA" },
      ])
    }

    const carteras = await sql`
      SELECT * FROM "Cartera" ORDER BY "Nombre"
    `

    return NextResponse.json(carteras)
  } catch (error) {
    console.error("Error fetching carteras:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { Nombre, Descripcion, Estado } = await request.json()

    if (!sql || !(await testConnection())) {
      return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })
    }

    const result = await sql`
      INSERT INTO "Cartera" ("Nombre", "Descripcion", "Estado")
      VALUES (${Nombre}, ${Descripcion}, ${Estado})
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating cartera:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
