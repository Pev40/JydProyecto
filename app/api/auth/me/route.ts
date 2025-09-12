import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("session")

    if (!sessionCookie) {
      return NextResponse.json({ error: "No hay sesión activa" }, { status: 401 })
    }

    if (!sql) {
      return NextResponse.json({ error: "Base de datos no disponible" }, { status: 500 })
    }

    const session = JSON.parse(sessionCookie.value)

    // Verificar que la sesión sea válida
    if (!session.userId || !session.rol) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 })
    }

    // Verificar que el usuario sigue activo en la base de datos
    const usuarios = await sql`
      SELECT 
        u."IdUsuario",
        u."NombreCompleto",
        u."Email",
        u."Estado",
        r."Nombre" as "RolNombre",
        c."IdCliente",
        c."RazonSocial" as "ClienteNombre"
      FROM "Usuario" u
      LEFT JOIN "Rol" r ON u."IdRol" = r."IdRol"
      LEFT JOIN "Cliente" c ON u."IdUsuario" = c."IdEncargado"
      WHERE u."IdUsuario" = ${session.userId} AND u."Estado" = 'ACTIVO'
    `

    if (usuarios.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado o inactivo" }, { status: 401 })
    }

    const usuario = usuarios[0]

    return NextResponse.json({
      id: usuario.IdUsuario,
      email: usuario.Email,
      nombre: usuario.NombreCompleto,
      rol: usuario.RolNombre,
      idCliente: usuario.IdCliente,
      clienteNombre: usuario.ClienteNombre,
    })
  } catch (error) {
    console.error("Error obteniendo usuario:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
