import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic'

export default async function DashboardRedirect() {
  const user = await getCurrentUser()

  // Si no hay usuario, redirigir a login
  if (!user) {
    redirect("/login")
  }

  // Si es cliente, redirigir al portal
  if (user.rol === "CLIENTE") {
    redirect("/portal")
  }

  // Para administradores, mostrar el dashboard principal
  // Redirigir a la ruta raíz donde está el dashboard autenticado
  redirect("/")
}
