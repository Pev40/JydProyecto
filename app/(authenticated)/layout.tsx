import type React from "react"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ClientNavigation } from "@/components/client-navigation"

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  // Si no hay usuario, redirigir a login
  if (!user) {
    redirect("/login")
  }

  // Si es cliente (rol CLIENTE), redirigir al portal solo si no está ya ahí
  if (user.rol === "CLIENTE") {
    redirect("/portal")
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ClientNavigation userRole={user.rol} />
      <main className="flex-1 lg:ml-0">{children}</main>
    </div>
  )
}
