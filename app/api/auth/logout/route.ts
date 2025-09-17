import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiClient } from "@/lib/api-client";

export async function POST() {
  try {
    // Opcional: llamar al endpoint de logout del backend si es necesario invalidar tokens del lado del servidor
    await apiClient.logout();
  } catch (error) {
    // Aunque falle la llamada al backend, procedemos a limpiar la cookie local
    console.error("[API_LOGOUT_BACKEND_ERROR]", error);
  }

  try {
    // Eliminar la cookie de sesión
    cookies().set("session", "", { expires: new Date(0), path: "/" });
    return NextResponse.json({ success: true, message: "Logout exitoso" });
  } catch (error) {
    console.error("[API_LOGOUT_COOKIE_ERROR]", error);
    const errorMessage = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
