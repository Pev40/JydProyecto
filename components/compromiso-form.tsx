"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useModal } from "@/components/ui/modal"
import { Loader2, Save, Calendar, DollarSign } from "lucide-react"

interface CompromisoFormProps {
  cliente: {
    IdCliente: number
    RazonSocial: string
    MontoFijoMensual: number
  }
  compromiso?: any
  isEditing?: boolean
}

export function CompromisoForm({ cliente, compromiso, isEditing = false }: CompromisoFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { Modal, showError, showSuccess } = useModal()

  const [formData, setFormData] = useState({
    fechaCompromiso: compromiso?.FechaCompromiso ? 
      new Date(compromiso.FechaCompromiso).toISOString().split('T')[0] : 
      new Date().toISOString().split('T')[0],
    montoCompromiso: compromiso?.MontoCompromiso || cliente.MontoFijoMensual || "",
    observaciones: compromiso?.Observaciones || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validaciones básicas
      if (!formData.fechaCompromiso || !formData.montoCompromiso) {
        showError("Datos requeridos", "Por favor, complete todos los campos obligatorios.")
        return
      }

      const url = isEditing ? `/api/compromisos/${compromiso.IdCompromisoPago}` : "/api/compromisos"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idCliente: cliente.IdCliente,
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
            router.push(`/clientes/${cliente.IdCliente}`)
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

  const handleInputChange = (field: string, value: any) => {
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
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">Cliente</h3>
          <p className="text-blue-700">{cliente.RazonSocial}</p>
          <p className="text-sm text-blue-600">
            Monto fijo mensual: S/ {cliente.MontoFijoMensual.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Información del Compromiso */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            onClick={() => router.push(`/clientes/${cliente.IdCliente}`)}
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