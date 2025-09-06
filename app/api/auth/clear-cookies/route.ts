import { NextResponse } from "next/server"

export async function POST() {
  try {
    const response = NextResponse.json({ success: true, message: "Cookies limpiadas" })
    
    // Limpiar la cookie de sesión
    response.cookies.set("session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0, // Expira inmediatamente
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Error limpiando cookies:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
