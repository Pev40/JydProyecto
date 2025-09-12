"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { ArrowLeft, User, Mail, Lock, Shield, Building, Save, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ClienteSearch } from "@/components/cliente-search"

interface Cliente {
  IdCliente: number;
  RazonSocial: string;
  RucDni: string;
  Estado: string;
}

interface UsuarioFormV2Props {
  usuario?: {
    Email?: string;
    Nombre?: string;
    IdRol?: number;
    IdCliente?: number;
  };
  onSuccess?: () => void;
}

export default function UsuarioFormV2({ usuario, onSuccess }: UsuarioFormV2Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  
  const [formData, setFormData] = useState({
    email: usuario?.Email || "",
    nombre: usuario?.Nombre || "",
    idRol: usuario?.IdRol?.toString() || "",
    idCliente: usuario?.IdCliente?.toString() || "",
    password: "",
    confirmPassword: "",
    activo: usuario?.Activo !== false
  })

  // Cargar cliente seleccionado si está editando
  useEffect(() => {
    if (usuario?.IdCliente && !clienteSeleccionado) {
      fetch(`/api/clientes/${usuario.IdCliente}`)
        .then(res => res.json())
        .then(cliente => {
          if (cliente) {
            setClienteSeleccionado(cliente)
          }
        })
        .catch(console.error)
    }
  }, [usuario?.IdCliente, clienteSeleccionado])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

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

    // Validar cliente para rol CLIENTE
    const rolSeleccionado = roles.find((r) => r.IdRol.toString() === formData.idRol)
    if (rolSeleccionado?.NombreRol === "CLIENTE" && !formData.idCliente) {
      setError("Debe seleccionar un cliente para usuarios tipo CLIENTE")
      setLoading(false)
      return
    }

    try {
      const response = await fetch(
        usuario ? `/api/usuarios/${usuario.IdUsuario}` : "/api/usuarios",
        {
          method: usuario ? "PUT" : "POST",
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
        }
      )

      const data = await response.json()

      if (data.success) {
        setSuccess(usuario ? "Usuario actualizado exitosamente" : "Usuario creado exitosamente")
        setTimeout(() => {
          router.push("/usuarios")
        }, 1500)
      } else {
        setError(data.error || "Error al procesar la solicitud")
      }
    } catch {
      setError("Error de conexión. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleClienteSelect = (cliente: Cliente | null) => {
    setClienteSeleccionado(cliente)
    setFormData({ 
      ...formData, 
      idCliente: cliente ? cliente.IdCliente.toString() : "" 
    })
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
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50 text-green-700">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Personal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Información Personal
              </h3>

              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre Completo *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="pl-10"
                    placeholder="Juan Pérez"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10"
                    placeholder="juan@empresa.com"
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
                <ClienteSearch
                  clienteSeleccionado={clienteSeleccionado}
                  onClienteSelect={handleClienteSelect}
                  placeholder="Buscar cliente..."
                />
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
