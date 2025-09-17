"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserPlus, Shield, User, Building, Edit, Trash2, Eye, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

interface Usuario {
  IdUsuario: number
  Nombre: string
  Email: string
  NombreRol: string
  Estado: string
  Activo: boolean
  UltimoAcceso: string | null
  FechaCreacion: string
  ClienteNombre?: string
  IdCliente?: number
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    cargarUsuarios()
  }, [])

  const cargarUsuarios = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      const page = searchParams.get("page") || "1"
      params.append("page", page)
      params.append("limit", "20")

      const response = await fetch(`/api/usuarios?${params}`)
      if (!response.ok) {
        throw new Error('Error cargando usuarios')
      }

      const data = await response.json()
      setUsuarios(data.usuarios || [])
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error cargando usuarios:', error)
      setError("Error al cargar los usuarios. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={cargarUsuarios}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // Calcular estadísticas
  const totalUsuarios = usuarios.filter(u => u.Activo).length
  const estadisticas = [
    { NombreRol: "ADMIN", Activos: usuarios.filter(u => u.NombreRol === "ADMIN" && u.Activo).length, Total: usuarios.filter(u => u.NombreRol === "ADMIN").length },
    { NombreRol: "EMPLEADO", Activos: usuarios.filter(u => u.NombreRol === "EMPLEADO" && u.Activo).length, Total: usuarios.filter(u => u.NombreRol === "EMPLEADO").length },
    { NombreRol: "CLIENTE", Activos: usuarios.filter(u => u.NombreRol === "CLIENTE" && u.Activo).length, Total: usuarios.filter(u => u.NombreRol === "CLIENTE").length }
  ].filter(stat => stat.Total > 0)

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
              <div className="text-2xl font-bold">{totalUsuarios}</div>
              <p className="text-xs text-muted-foreground">Usuarios activos</p>
            </CardContent>
          </Card>

          {estadisticas.map((stat) => (
            <Card key={stat.NombreRol}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.NombreRol}</CardTitle>
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
                <p className="text-xs text-muted-foreground">de {stat.Total} total</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabla de Usuarios */}
        <Card>
          <CardHeader>
            <CardTitle>Usuarios del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Último Acceso</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.map((usuario) => (
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
                          {usuario.IdUsuario !== 1 && ( // Asumiendo que el usuario 1 es admin principal
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

        {/* Paginación */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} resultados
            </div>
            <div className="flex items-center space-x-2">
              {pagination.hasPrevPage && (
                <Link
                  href={`/usuarios?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: (pagination.page - 1).toString() }).toString()}`}
                >
                  <Button variant="outline" size="sm">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                </Link>
              )}

              <span className="text-sm text-gray-700">
                Página {pagination.page} de {pagination.totalPages}
              </span>

              {pagination.hasNextPage && (
                <Link
                  href={`/usuarios?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: (pagination.page + 1).toString() }).toString()}`}
                >
                  <Button variant="outline" size="sm">
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
