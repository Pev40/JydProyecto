import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser, createUser } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || user.NombreRol !== "ADMIN") {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 })
    }

    const usuarios = await sql`
      SELECT 
        u.IdUsuario,
        u.Email,
        u.Nombre,
        u.Activo,
        u.UltimoAcceso,
        u.FechaCreacion,
        r.NombreRol,
        c.RazonSocial as ClienteNombre,
        c.IdCliente
      FROM Usuarios u
      JOIN Roles r ON u.IdRol = r.IdRol
      LEFT JOIN Clientes c ON u.IdCliente = c.IdCliente
      ORDER BY u.FechaCreacion DESC
    `

    return NextResponse.json({
      success: true,
      usuarios,
    })
  } catch (error) {
    console.error("Error obteniendo usuarios:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.NombreRol !== "ADMIN") {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 })
    }

    const { email, nombre, password, idRol, idCliente, activo } = await request.json()

    // Validaciones
    if (!email || !nombre || !password || !idRol) {
      return NextResponse.json({ success: false, error: "Faltan campos obligatorios" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 },
      )
    }

    // Verificar si el email ya existe
    const existingUser = await sql`
      SELECT IdUsuario FROM Usuarios WHERE Email = ${email}
    `

    if (existingUser.length > 0) {
      return NextResponse.json({ success: false, error: "El email ya está registrado" }, { status: 400 })
    }

    // Verificar que el rol existe
    const rol = await sql`
      SELECT NombreRol FROM Roles WHERE IdRol = ${idRol}
    `

    if (rol.length === 0) {
      return NextResponse.json({ success: false, error: "Rol no válido" }, { status: 400 })
    }

    // Si es rol CLIENTE, verificar que tenga cliente asociado
    if (rol[0].NombreRol === "CLIENTE" && !idCliente) {
      return NextResponse.json(
        { success: false, error: "Los usuarios tipo CLIENTE deben tener un cliente asociado" },
        { status: 400 },
      )
    }

    // Crear el usuario
    const result = await createUser(email, password, nombre, idRol, idCliente)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Usuario creado exitosamente",
    })
  } catch (error) {
    console.error("Error creando usuario:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
