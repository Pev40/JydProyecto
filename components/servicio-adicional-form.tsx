"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Save } from "lucide-react"
import type { Cliente } from "@/lib/queries"
import { toast } from "@/hooks/use-toast"

interface ServicioAdicionalFormProps {
  clientes: Cliente[]
  preselectedClienteId?: number
}

type FormState = {
  idCliente: string
  nombreServicio: string
  descripcion: string
  fecha: string
  monto: string
}

export function ServicioAdicionalForm({ clientes, preselectedClienteId }: ServicioAdicionalFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState<FormState>({
    idCliente: preselectedClienteId?.toString() || "",
    nombreServicio: "",
    descripcion: "",
    fecha: new Date().toISOString().split("T")[0],
    monto: "",
  })

  const handleInputChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch("/api/servicios-adicionales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idCliente: Number.parseInt(formData.idCliente),
          nombreServicio: formData.nombreServicio,
          descripcion: formData.descripcion || null,
          fecha: formData.fecha,
          monto: Number.parseFloat(formData.monto),
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast({
          title: "Servicio adicional registrado",
          description: "El servicio adicional ha sido creado correctamente.",
        })
        router.push(`/clientes/${formData.idCliente}`)
      } else {
        throw new Error(result.error || "Error al registrar servicio adicional")
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
                  {cliente.RazonSocial} - {cliente.RucDni}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fecha">Fecha *</Label>
          <Input
            id="fecha"
            type="date"
            value={formData.fecha}
            onChange={(e) => handleInputChange("fecha", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nombreServicio">Nombre del Servicio *</Label>
          <Input
            id="nombreServicio"
            value={formData.nombreServicio}
            onChange={(e) => handleInputChange("nombreServicio", e.target.value)}
            placeholder="Ej. Consultoría Tributaria"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="monto">Monto (S/) *</Label>
          <Input
            id="monto"
            type="number"
            step="0.01"
            min="0"
            value={formData.monto}
            onChange={(e) => handleInputChange("monto", e.target.value)}
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          value={formData.descripcion}
          onChange={(e) => handleInputChange("descripcion", e.target.value)}
          placeholder="Detalle del servicio adicional..."
          rows={4}
        />
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="jd-button-primary">
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <Save className="h-4 w-4 mr-2" />
          Registrar Servicio
        </Button>
      </div>
    </form>
  )
}


