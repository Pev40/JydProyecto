"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Edit, User, Mail, Shield, Building, Calendar, Clock, Activity, Loader2 } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

interface Usuario {
  IdUsuario: number
  NombreCompleto: string
  Email: string
  Estado: string
  FechaCreacion: string
  FechaUltimaSesion: string | null
  NombreRol: string
  RolDescripcion: string
  ClienteNombre?: string
  ClienteRUC?: string
  IdCliente?: number
}

export default function UsuarioDetallePage() {
  const params = useParams()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const usuarioId = params.id as string
    if (usuarioId && !isNaN(Number(usuarioId))) {
      cargarUsuario(Number(usuarioId))
    } else {
      setError("ID de usuario inválido")
      setLoading(false)
    }
  }, [params.id])

  const cargarUsuario = async (usuarioId: number) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/usuarios/${usuarioId}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError("Usuario no encontrado")
        } else {
          throw new Error('Error cargando usuario')
        }
        return
      }

      const data = await response.json()
      setUsuario(data.usuario)
    } catch (error) {
      console.error('Error cargando usuario:', error)
      setError("Error al cargar el usuario. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando usuario...</p>
        </div>
      </div>
    )
  }

  if (error || !usuario) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <Link href="/usuarios">
                <Button variant="outline" className="mb-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Error</h1>
              <p className="text-gray-600 mt-1">{error || "Usuario no encontrado"}</p>
            </div>
          </div>
        </header>
      </div>
    )
  }

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
          {/* Información Personal */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nombre Completo</label>
                    <p className="mt-1 text-lg font-medium">{usuario.NombreCompleto}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Correo Electrónico</label>
                    <p className="mt-1 text-lg font-medium">{usuario.Email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Estado</label>
                    <div className="mt-1">
                      <Badge variant={usuario.Estado === 'ACTIVO' ? 'default' : 'destructive'}>
                        {usuario.Estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Rol</label>
                    <div className="mt-1">
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
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <label className="text-sm font-medium text-gray-500">Descripción del Rol</label>
                  <p className="mt-1 text-sm text-gray-600">{usuario.RolDescripcion}</p>
                </div>

                {usuario.ClienteNombre && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Cliente Asociado</label>
                        <p className="mt-1 text-lg font-medium">{usuario.ClienteNombre}</p>
                      </div>
                      {usuario.ClienteRUC && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">RUC del Cliente</label>
                          <p className="mt-1 text-lg font-mono">{usuario.ClienteRUC}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Información del Sistema */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Información del Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Fecha de Registro
                  </label>
                  <p className="mt-1 text-sm">
                    {new Date(usuario.FechaCreacion).toLocaleDateString("es-PE", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Último Acceso
                  </label>
                  <p className="mt-1 text-sm">
                    {usuario.FechaUltimaSesion
                      ? new Date(usuario.FechaUltimaSesion).toLocaleString("es-PE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })
                      : "Nunca ha iniciado sesión"}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">ID de Usuario</label>
                  <p className="mt-1 text-sm font-mono">#{usuario.IdUsuario}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
