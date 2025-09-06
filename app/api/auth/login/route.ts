import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    
    let email, password
    
    try {
      const parsed = JSON.parse(body)
      email = parsed.email
      password = parsed.password
    } catch (parseError) {
      return NextResponse.json({ error: "Formato de datos inválido" }, { status: 400 })
    }

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 })
    }

    if (!sql) {
      return NextResponse.json({ error: "Base de datos no disponible" }, { status: 500 })
    }

    // Buscar usuario en la base de datos con nombres correctos
    const usuarios = await sql`
      SELECT 
        u."IdUsuario",
        u."NombreCompleto",
        u."Username",
        u."Email",
        u."HashContrasena",
        u."Estado",
        u."IdRol",
        r."Nombre" as "RolNombre"
      FROM "Usuario" u
      LEFT JOIN "Rol" r ON u."IdRol" = r."IdRol"
      WHERE u."Username" = ${email} AND u."Estado" = 'ACTIVO'
    `

    if (usuarios.length === 0) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    const usuario = usuarios[0]

    // Verificar contraseña
    const passwordValida = await bcrypt.compare(password, usuario.HashContrasena)

    if (!passwordValida) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    // Actualizar último acceso
    await sql`
      UPDATE "Usuario" 
      SET "FechaUltimaSesion" = NOW()
      WHERE "IdUsuario" = ${usuario.IdUsuario}
    `

    // Crear sesión
    const session = {
      userId: usuario.IdUsuario,
      email: usuario.Email,
      nombre: usuario.NombreCompleto,
      rol: usuario.RolNombre,
      timestamp: Date.now(),
    }

    // Crear respuesta con cookie de sesión
    const response = NextResponse.json({
      success: true,
      user: {
        id: usuario.IdUsuario,
        email: usuario.Email,
        nombre: usuario.NombreCompleto,
        NombreRol: usuario.RolNombre,
      },
    })

    // Configurar cookie de sesión
    response.cookies.set("session", JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Error en login:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
