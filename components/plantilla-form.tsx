"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Loader2, Save, Eye } from "lucide-react"

interface PlantillaFormProps {
  catalogos: {
    clasificaciones: Clasificacion[]
  }
  plantilla?: Plantilla
  isEditing?: boolean
}

interface Clasificacion {
  IdClasificacion: number
  Codigo: string
  Descripcion: string
  Color: string
}

interface Plantilla {
  IdPlantillaMensaje: number
  Nombre: string
  IdClasificacion: number
  Contenido: string
}

export function PlantillaForm({ catalogos, plantilla, isEditing = false }: PlantillaFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: plantilla?.Nombre || "",
    idClasificacion: plantilla?.IdClasificacion?.toString() || "",
    contenido: plantilla?.Contenido || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = isEditing ? `/api/plantillas/${plantilla.IdPlantillaMensaje}` : "/api/plantillas"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          idClasificacion: Number.parseInt(formData.idClasificacion),
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: isEditing ? "Plantilla actualizada" : "Plantilla creada",
          description: isEditing
            ? "La plantilla ha sido actualizada correctamente."
            : "La plantilla ha sido creada exitosamente.",
        })
        router.push("/plantillas")
      } else {
        throw new Error(result.error || "Error al procesar la solicitud")
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

  type FormState = typeof formData
  const handleInputChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const insertarVariable = (variable: string) => {
    const textarea = document.getElementById("contenido") as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = formData.contenido
      const before = text.substring(0, start)
      const after = text.substring(end, text.length)
      const newText = before + variable + after

      setFormData((prev) => ({ ...prev, contenido: newText }))

      // Restaurar posición del cursor
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + variable.length, start + variable.length)
      }, 0)
    }
  }

  const clasificacionSeleccionada = catalogos.clasificaciones.find(
    (c) => c.IdClasificacion.toString() === formData.idClasificacion,
  )

  // Vista previa del mensaje
  const vistaPrevia = formData.contenido
    .replace("{cliente}", "EMPRESA EJEMPLO SAC")
    .replace("{contacto}", "Juan Pérez")
    .replace("{monto}", "1,500.00")
    .replace("{fecha}", "15/01/2024")
    .replace("{empresa}", "J & D CONSULTORES DE NEGOCIOS S.A.C.")
    .replace("{telefono}", "999-999-999")

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información Básica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre de la Plantilla *</Label>
          <Input
            id="nombre"
            value={formData.nombre}
            onChange={(e) => handleInputChange("nombre", e.target.value)}
            placeholder="Ej: Recordatorio Cliente Moroso"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="idClasificacion">Clasificación de Cliente *</Label>
          <Select
            value={formData.idClasificacion}
            onValueChange={(value) => handleInputChange("idClasificacion", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccione clasificación" />
            </SelectTrigger>
            <SelectContent>
              {catalogos.clasificaciones.map((clasificacion) => (
                <SelectItem key={clasificacion.IdClasificacion} value={clasificacion.IdClasificacion.toString()}>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={
                        clasificacion.Color === "green"
                          ? "bg-green-100 text-green-800"
                          : clasificacion.Color === "orange"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-red-100 text-red-800"
                      }
                    >
                      {clasificacion.Codigo}
                    </Badge>
                    <span>{clasificacion.Descripcion}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Variables Disponibles */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm text-blue-800">Variables Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              { var: "{cliente}", desc: "Razón social" },
              { var: "{contacto}", desc: "Nombre contacto" },
              { var: "{monto}", desc: "Monto deuda" },
              { var: "{fecha}", desc: "Fecha vencimiento" },
              { var: "{empresa}", desc: "Nuestra empresa" },
              { var: "{telefono}", desc: "Nuestro teléfono" },
            ].map(({ var: variable, desc }) => (
              <Button
                key={variable}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => insertarVariable(variable)}
                className="text-left justify-start h-auto p-2"
              >
                <div>
                  <div className="font-mono text-xs text-blue-600">{variable}</div>
                  <div className="text-xs text-gray-500">{desc}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contenido del Mensaje */}
      <div className="space-y-2">
        <Label htmlFor="contenido">Contenido del Mensaje *</Label>
        <Textarea
          id="contenido"
          value={formData.contenido}
          onChange={(e) => handleInputChange("contenido", e.target.value)}
          placeholder="Escriba el contenido de la plantilla usando las variables disponibles..."
          rows={6}
          required
        />
        <div className="text-xs text-gray-500">Haga clic en las variables de arriba para insertarlas en el mensaje</div>
      </div>

      {/* Vista Previa */}
      {formData.contenido && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Vista Previa del Mensaje
              {clasificacionSeleccionada && (
                <Badge
                  variant="secondary"
                  className={
                    clasificacionSeleccionada.Color === "green"
                      ? "bg-green-100 text-green-800"
                      : clasificacionSeleccionada.Color === "orange"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-red-100 text-red-800"
                  }
                >
                  {clasificacionSeleccionada.Codigo}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-50 rounded-lg border">
              <div className="text-sm whitespace-pre-wrap">{vistaPrevia}</div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Esta es una vista previa con datos de ejemplo. Las variables se reemplazarán con datos reales del cliente.
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
          <Save className="h-4 w-4 mr-2" />
          {isEditing ? "Actualizar Plantilla" : "Crear Plantilla"}
        </Button>
      </div>
    </form>
  )
}
