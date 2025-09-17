import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiClient } from "@/lib/api-client";
import type { Session } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 });
    }

    const response = await apiClient.login(email, password);

    if (!response.success || !response.user) {
      const errorMessage = (response as { message?: string }).message || "Credenciales incorrectas";
      return NextResponse.json({ error: errorMessage }, { status: 401 });
    }

    const userFromApi = response.user;
    
    // Mapeo de NombreRol a rol
    const rol = userFromApi.NombreRol;

    // Guardar la sesión en una cookie del lado del servidor
    const session: Session = {
      userId: userFromApi.id,
      email: userFromApi.email,
      nombre: userFromApi.nombre,
      rol: rol,
      timestamp: Date.now(),
    };

    cookies().set("session", JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 día
      path: "/",
    });

    // Devolver el usuario (sin datos sensibles) al cliente
    return NextResponse.json({ user: { id: userFromApi.id, nombre: userFromApi.nombre, email: userFromApi.email, rol: rol } });

  } catch (error) {
    console.error("[API_LOGIN_ERROR]", error);
    const errorMessage = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
