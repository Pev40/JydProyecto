import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiClient } from "./api-client";

export interface User {
  id: number;
  email: string;
  nombre: string;
  rol: string;
  idCliente?: number;
  clienteNombre?: string;
}

export interface Session {
  userId: number;
  email: string;
  nombre: string;
  rol: string;
  timestamp: number;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie) {
      return null;
    }

    const session = JSON.parse(sessionCookie.value);

    if (!session.userId) {
      return null;
    }

    // Usar el endpoint del API para obtener el usuario actual
    const response = await apiClient.getCurrentUser();

    if (response.success && response.user) {
      return {
        id: response.user.id,
        email: response.user.email,
        nombre: response.user.nombre,
        rol: response.user.rol,
        // Estos campos podrían no estar disponibles en la respuesta actual del API
        // Se pueden agregar al backend si son necesarios
        idCliente: undefined,
        clienteNombre: undefined,
      };
    }

    return null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
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

export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
  } catch (error) {
    console.error("Error en logout:", error);
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
