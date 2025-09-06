import { type NextRequest, NextResponse } from "next/server"
import { sql, testConnection } from "@/lib/db"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { Nombre, Descripcion, Estado } = await request.json()
    const id = Number.parseInt(params.id)

    if (!sql || !(await testConnection())) {
      return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })
    }

    const result = await sql`
      UPDATE "Cartera" 
      SET "Nombre" = ${Nombre}, "Descripcion" = ${Descripcion}, "Estado" = ${Estado}
      WHERE "IdCartera" = ${id}
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating cartera:", error)
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
      DELETE FROM "Cartera" WHERE "IdCartera" = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting cartera:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
