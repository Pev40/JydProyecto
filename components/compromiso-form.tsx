"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useModal } from "@/components/ui/modal"
import { Loader2, Save } from "lucide-react"

interface CompromisoFormProps {
  clientes?: {
    IdCliente: number
    RazonSocial: string
    MontoFijoMensual: number
    RucDni: string
  }[]
  cliente?: {
    IdCliente: number
    RazonSocial: string
    MontoFijoMensual: number
  }
  compromiso?: {
    IdCompromisoPago: number
    FechaCompromiso?: string
    MontoCompromiso?: number
    Observaciones?: string
  }
  isEditing?: boolean
}

export function CompromisoForm({ clientes, cliente, compromiso, isEditing = false }: CompromisoFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { Modal, showError, showSuccess } = useModal()

  const [formData, setFormData] = useState({
    idCliente: cliente?.IdCliente?.toString() || "",
    fechaCompromiso: compromiso?.FechaCompromiso ? 
      new Date(compromiso.FechaCompromiso).toISOString().split('T')[0] : 
      new Date().toISOString().split('T')[0],
    montoCompromiso: compromiso?.MontoCompromiso || cliente?.MontoFijoMensual || "",
    observaciones: compromiso?.Observaciones || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validaciones básicas
      if (!formData.idCliente || !formData.fechaCompromiso || !formData.montoCompromiso) {
        showError("Datos requeridos", "Por favor, complete todos los campos obligatorios.")
        return
      }

      const url = isEditing && compromiso ? `/api/compromisos/${compromiso.IdCompromisoPago}` : "/api/compromisos"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idCliente: Number.parseInt(formData.idCliente),
          fechaCompromiso: formData.fechaCompromiso,
          montoCompromiso: Number.parseFloat(formData.montoCompromiso.toString()),
          observaciones: formData.observaciones,
        }),
      })

      const result = await response.json()

      if (result.success) {
        showSuccess(
          isEditing ? "Compromiso actualizado" : "Compromiso registrado exitosamente",
          isEditing
            ? "El compromiso de pago ha sido actualizado correctamente."
            : "El compromiso de pago ha sido registrado exitosamente en el sistema.",
          () => {
            if (formData.idCliente) {
              router.push(`/clientes/${formData.idCliente}`)
            } else {
              router.push('/clientes')
            }
          }
        )
      } else {
        // Manejar diferentes tipos de errores
        if (response.status === 400) {
          showError(
            "Datos inválidos",
            result.error || "Los datos proporcionados no son válidos. Por favor, revise el formulario."
          )
        } else {
          showError(
            "Error del servidor",
            result.error || "Ocurrió un error en el servidor. Por favor, intente nuevamente."
          )
        }
      }
    } catch (error) {
      showError(
        "Error inesperado",
        error instanceof Error ? error.message : "Ocurrió un error inesperado. Por favor, intente nuevamente."
      )
    } finally {
      setLoading(false)
    }
  }

  type FormState = typeof formData
  const handleInputChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <>
      <Modal />
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información del Cliente */}
        {cliente && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2">Cliente</h3>
            <p className="text-blue-700">{cliente.RazonSocial}</p>
            <p className="text-sm text-blue-600">
              Monto fijo mensual: S/ {cliente.MontoFijoMensual.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </p>
          </div>
        )}

        {/* Información del Compromiso */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cliente Selector - only show if clientes array is provided and no specific cliente is set */}
          {clientes && !cliente && (
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
                        <span className="text-xs text-gray-500">{cliente.RucDni}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="fechaCompromiso">Fecha de Compromiso *</Label>
            <Input
              id="fechaCompromiso"
              type="date"
              value={formData.fechaCompromiso}
              onChange={(e) => handleInputChange("fechaCompromiso", e.target.value)}
              required
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-gray-500">
              Fecha en la que el cliente se compromete a realizar el pago
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="montoCompromiso">Monto del Compromiso (S/) *</Label>
            <Input
              id="montoCompromiso"
              type="number"
              step="0.01"
              min="0"
              value={formData.montoCompromiso}
              onChange={(e) => handleInputChange("montoCompromiso", e.target.value)}
              placeholder="0.00"
              required
            />
            <p className="text-xs text-gray-500">
              Monto que el cliente se compromete a pagar
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="observaciones">Observaciones</Label>
          <Textarea
            id="observaciones"
            value={formData.observaciones}
            onChange={(e) => handleInputChange("observaciones", e.target.value)}
            placeholder="Detalles adicionales sobre el compromiso, condiciones especiales, etc."
            rows={4}
          />
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              if (cliente?.IdCliente) {
                router.push(`/clientes/${cliente.IdCliente}`)
              } else if (formData.idCliente) {
                router.push(`/clientes/${formData.idCliente}`)
              } else {
                router.push('/compromisos')
              }
            }}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="jd-button-primary">
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            {isEditing ? "Actualizar Compromiso" : "Registrar Compromiso"}
          </Button>
        </div>
      </form>
    </>
  )
}