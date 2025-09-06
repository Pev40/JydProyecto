import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    if (!sql) {
      return NextResponse.json({
        connected: false,
        message: "BD no configurada",
      })
    }

    // Hacer una consulta simple para verificar la conexión
    await sql`SELECT 1 as test`

    return NextResponse.json({
      connected: true,
      message: "BD conectada",
    })
  } catch (error) {
    console.error("Database status error:", error)
    return NextResponse.json({
      connected: false,
      message: "BD desconectada",
    })
  }
}
