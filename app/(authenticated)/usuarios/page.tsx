import { getCurrentUser } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserPlus, Shield, User, Building, Edit, Trash2, Eye } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

const sql = neon(process.env.DATABASE_URL!)

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic'

export default async function UsuariosPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/login")
  }
  
  if (user.rol === "CLIENTE") {
    redirect("/portal")
  }
  
  if (user.rol !== "ADMIN") {
    // Si no es admin pero está autenticado, redirigir a una página apropiada
    // En lugar de crear un bucle, redirigir a una página de "no autorizado"
    redirect("/unauthorized")
  }  const usuarios = await sql`
    SELECT 
      u."IdUsuario",
      u."Email",
      u."NombreCompleto",
      u."Estado" as "Activo",
      u."FechaUltimaSesion" as "UltimoAcceso",
      u."FechaCreacion",
      r."Nombre" as "NombreRol",
      c."RazonSocial" as "ClienteNombre",
      c."IdCliente"
    FROM "Usuario" u
    JOIN "Rol" r ON u."IdRol" = r."IdRol"
    LEFT JOIN "Cliente" c ON u."IdUsuario" = c."IdEncargado"
    ORDER BY u."FechaCreacion" DESC
  `

  const estadisticas = await sql`
    SELECT 
      r."Nombre" as "NombreRol",
      COUNT(*) as "Total",
      COUNT(CASE WHEN u."Estado" = 'ACTIVO' THEN 1 END) as "Activos"
    FROM "Usuario" u
    JOIN "Rol" r ON u."IdRol" = r."IdRol"
    GROUP BY r."Nombre", r."IdRol"
    ORDER BY r."IdRol"
  `

  const totalUsuarios = await sql`
    SELECT COUNT(*) as total FROM "Usuario" WHERE "Estado" = 'ACTIVO'
  `

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
              <p className="text-gray-600 mt-1">Administra los usuarios y permisos del sistema</p>
            </div>
            <Link href="/usuarios/nuevo">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="h-4 w-4 mr-2" />
                Nuevo Usuario
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsuarios[0]?.total || 0}</div>
              <p className="text-xs text-muted-foreground">Usuarios activos</p>
            </CardContent>
          </Card>

          {estadisticas.map((stat) => (
            <Card key={stat.NombreRol}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.NombreRol}S</CardTitle>
                {stat.NombreRol === "ADMIN" ? (
                  <Shield className="h-4 w-4 text-red-500" />
                ) : stat.NombreRol === "EMPLEADO" ? (
                  <User className="h-4 w-4 text-blue-500" />
                ) : (
                  <Building className="h-4 w-4 text-green-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.Activos}</div>
                <p className="text-xs text-muted-foreground">
                  de {stat.Total} total{stat.Total !== 1 ? "es" : ""}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Lista de Usuarios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Usuarios del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Cliente Asociado</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Último Acceso</TableHead>
                    <TableHead>Fecha Registro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.map((usuario: any) => (
                    <TableRow key={usuario.IdUsuario}>
                      <TableCell>
                        <div className="font-medium">{usuario.Nombre}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">{usuario.Email}</div>
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>
                        {usuario.ClienteNombre ? (
                          <Link
                            href={`/clientes/${usuario.IdCliente}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {usuario.ClienteNombre}
                          </Link>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={usuario.Activo ? "default" : "destructive"}>
                          {usuario.Activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {usuario.UltimoAcceso
                            ? new Date(usuario.UltimoAcceso).toLocaleString("es-PE", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Nunca"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{new Date(usuario.FechaCreacion).toLocaleDateString("es-PE")}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Link href={`/usuarios/${usuario.IdUsuario}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/usuarios/${usuario.IdUsuario}/editar`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          {usuario.IdUsuario !== user.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 bg-transparent"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {usuarios.length === 0 && (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay usuarios</h3>
                <p className="text-gray-600 mb-4">Comienza creando el primer usuario del sistema.</p>
                <Link href="/usuarios/nuevo">
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Crear Usuario
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
