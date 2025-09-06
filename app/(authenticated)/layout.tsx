import type React from "react"
import { Navigation } from "@/components/navigation"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

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

  // Si es gerente (cliente), solo puede acceder al portal
  if (user.rol === "Gerente") {
    redirect("/portal")
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Navigation userRole={user.rol} />
      <main className="flex-1 lg:ml-0">{children}</main>
    </div>
  )
}
