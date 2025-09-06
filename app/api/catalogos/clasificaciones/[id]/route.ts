import { type NextRequest, NextResponse } from "next/server"
import { sql, testConnection } from "@/lib/db"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { Codigo, Descripcion, Color } = await request.json()
    const id = Number.parseInt(params.id)

    if (!sql || !(await testConnection())) {
      return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })
    }

    const result = await sql`
      UPDATE "Clasificacion" 
      SET "Codigo" = ${Codigo}, "Descripcion" = ${Descripcion}, "Color" = ${Color}
      WHERE "IdClasificacion" = ${id}
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating clasificacion:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (!sql || !(await testConnection())) {
      return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })
    }

    await sql`
      DELETE FROM "Clasificacion" WHERE "IdClasificacion" = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting clasificacion:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
