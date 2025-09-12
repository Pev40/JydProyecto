import { getCurrentUser } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Edit, User, Mail, Shield, Building, Calendar, Clock, Activity } from "lucide-react"
import Link from "next/link"
import { redirect, notFound } from "next/navigation"

interface Permiso {
  NombrePermiso: string
  Descripcion: string
  Modulo: string
}

interface PermisosPorModulo {
  [modulo: string]: Permiso[]
}

const sql = neon(process.env.DATABASE_URL!)

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function UsuarioDetallePage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()

  if (!user || user.rol !== "ADMIN") {
    redirect("/")
  }

  const usuarioId = Number.parseInt(params.id)
  if (isNaN(usuarioId)) {
    notFound()
  }

  const usuarios = await sql`
    SELECT 
      u.*,
      r."Nombre" as "NombreRol",
      r."Descripcion" as "RolDescripcion",
      c."RazonSocial" as "ClienteNombre",
      c."RucDni" as "ClienteRUC",
      c."IdCliente"
    FROM "Usuario" u
    JOIN "Rol" r ON u."IdRol" = r."IdRol"
    LEFT JOIN "Cliente" c ON u."IdCliente" = c."IdCliente"
    WHERE u."IdUsuario" = ${usuarioId}
  `

  if (usuarios.length === 0) {
    notFound()
  }

  const usuario = usuarios[0]

  // Obtener permisos del usuario
  const permisos = await sql`
    SELECT p."NombrePermiso", p."Descripcion", p."Modulo"
    FROM "RolPermisos" rp
    JOIN "Permisos" p ON rp."IdPermiso" = p."IdPermiso"
    WHERE rp."IdRol" = ${usuario.IdRol}
    ORDER BY p."Modulo", p."NombrePermiso"
  `

  // Agrupar permisos por módulo
  const permisosPorModulo = permisos.reduce((acc: PermisosPorModulo, permisoRow) => {
    const permiso = permisoRow as Permiso
    if (!acc[permiso.Modulo]) {
      acc[permiso.Modulo] = []
    }
    acc[permiso.Modulo].push(permiso)
    return acc
  }, {} as PermisosPorModulo)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <Link href="/usuarios">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Detalles del Usuario</h1>
                <p className="text-gray-600 mt-1">Información completa del usuario</p>
              </div>
            </div>
            <Link href={`/usuarios/${usuario.IdUsuario}/editar`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Editar Usuario
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información Principal */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nombre Completo</label>
                    <p className="text-lg font-medium">{usuario.Nombre}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-lg flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {usuario.Email}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Rol</label>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          usuario.NombreRol === "ADMIN"
                            ? "destructive"
                            : usuario.NombreRol === "EMPLEADO"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {usuario.NombreRol}
                      </Badge>
                      <span className="text-sm text-gray-500">{usuario.RolDescripcion}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Estado</label>
                    <div>
                      <Badge variant={usuario.Activo ? "default" : "destructive"}>
                        {usuario.Activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {usuario.ClienteNombre && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-gray-500">Cliente Asociado</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Building className="h-4 w-4 text-gray-400" />
                        <Link
                          href={`/clientes/${usuario.IdCliente}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          {usuario.ClienteNombre}
                        </Link>
                        <span className="text-sm text-gray-500">RUC: {usuario.ClienteRUC}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Permisos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Permisos del Usuario
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(permisosPorModulo).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(permisosPorModulo).map(([modulo, permisos]: [string, Permiso[]]) => (
                      <div key={modulo}>
                        <h4 className="font-medium text-gray-900 mb-2">{modulo}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {permisos.map((permiso: Permiso) => (
                            <div key={permiso.NombrePermiso} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <div>
                                <p className="text-sm font-medium">{permiso.NombrePermiso}</p>
                                <p className="text-xs text-gray-500">{permiso.Descripcion}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No hay permisos asignados</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Panel Lateral */}
          <div className="space-y-6">
            {/* Actividad */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Actividad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Fecha de Registro
                  </label>
                  <p className="text-sm">
                    {new Date(usuario.FechaCreacion).toLocaleDateString("es-PE", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Último Acceso
                  </label>
                  <p className="text-sm">
                    {usuario.UltimoAcceso
                      ? new Date(usuario.UltimoAcceso).toLocaleString("es-PE", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Nunca ha ingresado"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Última Actualización</label>
                  <p className="text-sm">
                    {usuario.FechaActualizacion
                      ? new Date(usuario.FechaActualizacion).toLocaleDateString("es-PE")
                      : "No actualizado"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Acciones Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/usuarios/${usuario.IdUsuario}/editar`}>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Usuario
                  </Button>
                </Link>
                {usuario.IdCliente && (
                  <Link href={`/clientes/${usuario.IdCliente}`}>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Building className="h-4 w-4 mr-2" />
                      Ver Cliente Asociado
                    </Button>
                  </Link>
                )}
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  disabled={usuario.IdUsuario === user.id}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  {usuario.Activo ? "Desactivar" : "Activar"} Usuario
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
