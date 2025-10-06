import { getCurrentUser } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"
import { redirect } from "next/navigation"
import UsuarioForm from "@/components/usuario-form"

const sql = neon(process.env.DATABASE_URL!)

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NuevoUsuarioPage() {
  const user = await getCurrentUser()

  if (!user || user.rol !== "ADMIN") {
    redirect("/")
  }

  const roles = await sql`
    SELECT "IdRol", "Nombre" as "NombreRol", "Descripcion"
    FROM "Rol"
    ORDER BY "IdRol"
  ` as Array<{
    IdRol: number
    NombreRol: string
    Descripcion: string
  }>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Usuario</h1>
            <p className="text-gray-600 mt-1">Registra un nuevo usuario en el sistema</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UsuarioForm roles={roles} />
      </main>
    </div>
  )
}
