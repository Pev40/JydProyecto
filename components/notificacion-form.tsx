"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { Loader2, Send, MessageSquare, Mail, Phone } from "lucide-react"
import type { Cliente } from "@/lib/db"

interface NotificacionFormProps {
  clientes: Cliente[]
  catalogos: {
    tiposNotificacion: TipoNotificacion[]
  }
}

interface TipoNotificacion {
  IdTipoNotificacion: number
  Nombre: string
}

type FormState = {
  idCliente: string
  idTipoNotificacion: string
  contenido: string
  programarEnvio: boolean
  fechaProgramada: string
  horaProgramada: string
}

export function NotificacionForm({ clientes, catalogos }: NotificacionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormState>({
    idCliente: "",
    idTipoNotificacion: "",
    contenido: "",
    programarEnvio: false,
    fechaProgramada: "",
    horaProgramada: "",
  })

  // Plantillas predefinidas
  const plantillas = {
    recordatorio:
      "Estimado {cliente}, le recordamos que tiene un pago pendiente de S/ {monto}. Por favor regularice su situación a la brevedad. Gracias.",
    vencimiento:
      "Estimado {cliente}, su pago de S/ {monto} vence hoy. Para evitar inconvenientes, realice su pago antes de las 6:00 PM.",
    moroso:
      "Estimado {cliente}, su cuenta presenta una deuda vencida de S/ {monto}. Comuníquese urgentemente al 999-999-999 para regularizar su situación.",
  }

  const clienteSeleccionado = clientes.find((c) => c.IdCliente.toString() === formData.idCliente)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Reemplazar variables en el contenido
      let contenidoFinal = formData.contenido
      if (clienteSeleccionado) {
        contenidoFinal = contenidoFinal
          .replace("{cliente}", clienteSeleccionado.RazonSocial)
          .replace("{contacto}", clienteSeleccionado.NombreContacto || "")
          .replace("{monto}", Number(clienteSeleccionado.SaldoPendiente ?? 0).toFixed(2))
      }

      const response = await fetch("/api/notificaciones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          contenido: contenidoFinal,
          idCliente: Number.parseInt(formData.idCliente),
          idTipoNotificacion: Number.parseInt(formData.idTipoNotificacion),
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Notificación enviada",
          description: "La notificación ha sido enviada exitosamente.",
        })
        router.push("/notificaciones")
      } else {
        throw new Error(result.error || "Error al enviar la notificación")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error inesperado",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const aplicarPlantilla = (tipo: keyof typeof plantillas) => {
    setFormData((prev) => ({
      ...prev,
      contenido: plantillas[tipo],
    }))
  }

  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case "WhatsApp":
        return <MessageSquare className="h-4 w-4 text-green-600" />
      case "Email":
        return <Mail className="h-4 w-4 text-blue-600" />
      case "SMS":
        return <Phone className="h-4 w-4 text-purple-600" />
      default:
        return <Send className="h-4 w-4" />
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información Básica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="idCliente">Cliente *</Label>
          <Select value={formData.idCliente} onValueChange={(value) => handleInputChange("idCliente", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione cliente" />
            </SelectTrigger>
            <SelectContent>
              {clientes.map((cliente) => (
                <SelectItem key={cliente.IdCliente} value={cliente.IdCliente.toString()}>
                  <div className="flex flex-col">
                    <span>{cliente.RazonSocial}</span>
                    <span className="text-xs text-gray-500">
                      {cliente.ClasificacionCodigo} - Saldo: S/ {Number(cliente.SaldoPendiente ?? 0).toFixed(2)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="idTipoNotificacion">Tipo de Notificación *</Label>
          <Select
            value={formData.idTipoNotificacion}
            onValueChange={(value) => handleInputChange("idTipoNotificacion", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccione tipo" />
            </SelectTrigger>
            <SelectContent>
              {(catalogos.tiposNotificacion ?? []).map((tipo) => (
                <SelectItem key={tipo.IdTipoNotificacion} value={tipo.IdTipoNotificacion.toString()}>
                  <div className="flex items-center gap-2">
                    {getIconoTipo(tipo.Nombre)}
                    <span>{tipo.Nombre}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Información del Cliente Seleccionado */}
      {clienteSeleccionado && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm">Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Contacto:</span>
                <p>{clienteSeleccionado.NombreContacto || "No especificado"}</p>
              </div>
              <div>
                <span className="font-medium">Email:</span>
                <p>{clienteSeleccionado.Email || "No especificado"}</p>
              </div>
              <div>
                <span className="font-medium">Teléfono:</span>
                <p>{clienteSeleccionado.Telefono || "No especificado"}</p>
              </div>
              <div>
                <span className="font-medium">Clasificación:</span>
                <p>
                  {clienteSeleccionado.ClasificacionCodigo} - {clienteSeleccionado.ClasificacionDescripcion}
                </p>
              </div>
              <div>
                <span className="font-medium">Saldo Pendiente:</span>
                <p className="text-red-600 font-medium">
                  S/ {Number(clienteSeleccionado.SaldoPendiente ?? 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plantillas Rápidas */}
      <div className="space-y-4">
        <Label>Plantillas Rápidas</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => aplicarPlantilla("recordatorio")}
            className="text-left h-auto p-3"
          >
            <div>
              <div className="font-medium">Recordatorio</div>
              <div className="text-xs text-gray-500">Para clientes con deuda leve</div>
            </div>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => aplicarPlantilla("vencimiento")}
            className="text-left h-auto p-3"
          >
            <div>
              <div className="font-medium">Vencimiento Hoy</div>
              <div className="text-xs text-gray-500">Para pagos que vencen hoy</div>
            </div>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => aplicarPlantilla("moroso")}
            className="text-left h-auto p-3"
          >
            <div>
              <div className="font-medium">Cliente Moroso</div>
              <div className="text-xs text-gray-500">Para clientes con deuda vencida</div>
            </div>
          </Button>
        </div>
      </div>

      {/* Contenido del Mensaje */}
      <div className="space-y-2">
        <Label htmlFor="contenido">Contenido del Mensaje *</Label>
        <Textarea
          id="contenido"
          value={formData.contenido}
          onChange={(e) => handleInputChange("contenido", e.target.value)}
          placeholder="Escriba el mensaje que desea enviar..."
          rows={6}
          required
        />
        <div className="text-xs text-gray-500">
          Variables disponibles: {"{cliente}"}, {"{contacto}"}, {"{monto}"}
        </div>
      </div>

      {/* Vista Previa */}
      {formData.contenido && clienteSeleccionado && (
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-sm">Vista Previa del Mensaje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-white rounded border">
              {formData.contenido
                .replace("{cliente}", clienteSeleccionado.RazonSocial)
                .replace("{contacto}", clienteSeleccionado.NombreContacto || "")
                .replace("{monto}", Number(clienteSeleccionado.SaldoPendiente ?? 0).toFixed(2))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botones */}
      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <Send className="h-4 w-4 mr-2" />
          Enviar Notificación
        </Button>
      </div>
    </form>
  )
}
