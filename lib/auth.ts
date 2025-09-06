import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { sql } from "@/lib/db"

export interface User {
  id: number
  email: string
  nombre: string
  rol: string
  clienteNombre?: string
}

export interface Session {
  userId: number
  email: string
  nombre: string
  rol: string
  timestamp: number
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie || !sql) {
      return null
    }

    const session = JSON.parse(sessionCookie.value)

    if (!session.userId) {
      return null
    }

    // Verificar usuario en base de datos
    const usuarios = await sql`
      SELECT 
        u."IdUsuario",
        u."NombreCompleto",
        u."Email",
        u."Estado",
        r."Nombre" as "RolNombre",
        c."RazonSocial" as "ClienteNombre"
      FROM "Usuario" u
      LEFT JOIN "Rol" r ON u."IdRol" = r."IdRol"
      LEFT JOIN "Cliente" c ON u."IdUsuario" = c."IdEncargado"
      WHERE u."IdUsuario" = ${session.userId} AND u."Estado" = 'ACTIVO'
    `

    if (usuarios.length === 0) {
      return null
    }

    const usuario = usuarios[0]

    return {
      id: usuario.IdUsuario,
      email: usuario.Email,
      nombre: usuario.NombreCompleto,
      rol: usuario.RolNombre,
      clienteNombre: usuario.ClienteNombre,
    }
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return user
}

export async function requireRole(allowedRoles: string[]): Promise<User> {
  const user = await requireAuth()

  if (!allowedRoles.includes(user.rol)) {
    redirect("/unauthorized")
  }

  return user
}

export async function login(
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error }
    }

    return { success: true, user: data.user }
  } catch (error) {
    console.error("Error en login:", error)
    return { success: false, error: "Error de conexión" }
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    })
  } catch (error) {
    console.error("Error en logout:", error)
  }
}

export function isAdmin(user: User | null): boolean {
  return user?.rol === "ADMIN"
}

export function isEmployee(user: User | null): boolean {
  return user?.rol === "EMPLEADO"
}

export function isClient(user: User | null): boolean {
  return user?.rol === "CLIENTE"
}

export function canAccessAdminRoutes(user: User | null): boolean {
  return isAdmin(user) || isEmployee(user)
}
