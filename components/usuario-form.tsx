"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Save, ArrowLeft, User, Mail, Lock, Shield, Building } from "lucide-react"
import Link from "next/link"

interface UsuarioFormProps {
  usuario?: {
    IdUsuario: number
    Email: string
    Nombre: string
    IdRol: number
    IdCliente?: number
    Activo: boolean
  }
  roles: Array<{
    IdRol: number
    NombreRol: string
    Descripcion: string
  }>
  clientes: Array<{
    IdCliente: number
    RazonSocial: string
    RUC: string
  }>
}

export function UsuarioForm({ usuario, roles, clientes }: UsuarioFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [formData, setFormData] = useState({
    email: usuario?.Email || "",
    nombre: usuario?.Nombre || "",
    password: "",
    confirmPassword: "",
    idRol: usuario?.IdRol?.toString() || "0",
    idCliente: usuario?.IdCliente?.toString() || "0",
    activo: usuario?.Activo ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    // Validaciones
    if (!formData.email || !formData.nombre || !formData.idRol) {
      setError("Por favor completa todos los campos obligatorios")
      setLoading(false)
      return
    }

    if (!usuario && (!formData.password || formData.password.length < 6)) {
      setError("La contraseña debe tener al menos 6 caracteres")
      setLoading(false)
      return
    }

    if (!usuario && formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      setLoading(false)
      return
    }

    // Si es rol CLIENTE, debe tener cliente asociado
    const rolSeleccionado = roles.find((r) => r.IdRol.toString() === formData.idRol)
    if (rolSeleccionado?.NombreRol === "CLIENTE" && !formData.idCliente) {
      setError("Los usuarios tipo CLIENTE deben tener un cliente asociado")
      setLoading(false)
      return
    }

    try {
      const url = usuario ? `/api/usuarios/${usuario.IdUsuario}` : "/api/usuarios"
      const method = usuario ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          nombre: formData.nombre,
          password: formData.password || undefined,
          idRol: Number.parseInt(formData.idRol),
          idCliente: formData.idCliente ? Number.parseInt(formData.idCliente) : null,
          activo: formData.activo,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(usuario ? "Usuario actualizado exitosamente" : "Usuario creado exitosamente")
        setTimeout(() => {
          router.push("/usuarios")
        }, 1500)
      } else {
        setError(data.error || "Error al procesar la solicitud")
      }
    } catch (error) {
      setError("Error de conexión. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Link href="/usuarios">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {usuario ? "Editar Usuario" : "Nuevo Usuario"}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información Personal */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Información Personal
              </h3>

              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre Completo *</Label>
                <Input
                  id="nombre"
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ingresa el nombre completo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="usuario@ejemplo.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Configuración de Acceso */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Configuración de Acceso
              </h3>

              <div className="space-y-2">
                <Label htmlFor="password">{usuario ? "Nueva Contraseña (opcional)" : "Contraseña *"}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  required={!usuario}
                />
              </div>

              {!usuario && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Repite la contraseña"
                    required
                  />
                </div>
              )}
            </div>
          </div>

          {/* Permisos y Asociaciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Permisos
              </h3>

              <div className="space-y-2">
                <Label htmlFor="rol">Rol del Usuario *</Label>
                <Select value={formData.idRol} onValueChange={(value) => setFormData({ ...formData, idRol: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((rol) => (
                      <SelectItem key={rol.IdRol} value={rol.IdRol.toString()}>
                        <div className="flex items-center gap-2">
                          {rol.NombreRol === "ADMIN" ? (
                            <Shield className="h-4 w-4 text-red-500" />
                          ) : rol.NombreRol === "EMPLEADO" ? (
                            <User className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Building className="h-4 w-4 text-green-500" />
                          )}
                          <div>
                            <div className="font-medium">{rol.NombreRol}</div>
                            <div className="text-sm text-gray-500">{rol.Descripcion}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
                <Label htmlFor="activo">Usuario activo</Label>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Building className="h-4 w-4" />
                Asociación
              </h3>

              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente Asociado</Label>
                <Select
                  value={formData.idCliente}
                  onValueChange={(value) => setFormData({ ...formData, idCliente: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un cliente (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sin cliente asociado</SelectItem>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.IdCliente} value={cliente.IdCliente.toString()}>
                        <div>
                          <div className="font-medium">{cliente.RazonSocial}</div>
                          <div className="text-sm text-gray-500">RUC: {cliente.RUC}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">Requerido para usuarios tipo CLIENTE</p>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-4 pt-6">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {usuario ? "Actualizando..." : "Creando..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {usuario ? "Actualizar Usuario" : "Crear Usuario"}
                </>
              )}
            </Button>
            <Link href="/usuarios">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
