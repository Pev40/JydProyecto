import { type NextRequest, NextResponse } from "next/server"
import { sql, testConnection } from "@/lib/db"

export async function GET() {
  try {
    if (!sql || !(await testConnection())) {
      return NextResponse.json([
        { IdClasificacion: 1, Codigo: "A", Descripcion: "Cliente al día", Color: "green" },
        { IdClasificacion: 2, Codigo: "B", Descripcion: "Cliente con deuda 1-2 meses", Color: "orange" },
        { IdClasificacion: 3, Codigo: "C", Descripcion: "Cliente moroso +3 meses", Color: "red" },
      ])
    }

    const clasificaciones = await sql`
      SELECT * FROM "Clasificacion" ORDER BY "Codigo"
    `

    return NextResponse.json(clasificaciones)
  } catch (error) {
    console.error("Error fetching clasificaciones:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { Codigo, Descripcion, Color } = await request.json()

    if (!sql || !(await testConnection())) {
      return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })
    }

    const result = await sql`
      INSERT INTO "Clasificacion" ("Codigo", "Descripcion", "Color")
      VALUES (${Codigo}, ${Descripcion}, ${Color})
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating clasificacion:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
