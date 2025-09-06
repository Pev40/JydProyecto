"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Edit, Trash2, Save, X } from "lucide-react"
import Link from "next/link"

interface Clasificacion {
  IdClasificacion: number
  Codigo: string
  Descripcion: string
  Color: string
}

export default function ClasificacionesPage() {
  const [clasificaciones, setClasificaciones] = useState<Clasificacion[]>([])
  const [editando, setEditando] = useState<number | null>(null)
  const [nuevo, setNuevo] = useState(false)
  const [formData, setFormData] = useState({
    Codigo: "",
    Descripcion: "",
    Color: "blue",
  })

  useEffect(() => {
    cargarClasificaciones()
  }, [])

  const cargarClasificaciones = async () => {
    try {
      const response = await fetch("/api/catalogos/clasificaciones")
      const data = await response.json()
      setClasificaciones(data)
    } catch (error) {
      console.error("Error cargando clasificaciones:", error)
    }
  }

  const guardar = async () => {
    try {
      const url = editando ? `/api/catalogos/clasificaciones/${editando}` : "/api/catalogos/clasificaciones"

      const method = editando ? "PUT" : "POST"

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      await cargarClasificaciones()
      cancelar()
    } catch (error) {
      console.error("Error guardando:", error)
    }
  }

  const eliminar = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar esta clasificación?")) return

    try {
      await fetch(`/api/catalogos/clasificaciones/${id}`, {
        method: "DELETE",
      })
      await cargarClasificaciones()
    } catch (error) {
      console.error("Error eliminando:", error)
    }
  }

  const editar = (clasificacion: Clasificacion) => {
    setEditando(clasificacion.IdClasificacion)
    setFormData({
      Codigo: clasificacion.Codigo,
      Descripcion: clasificacion.Descripcion,
      Color: clasificacion.Color,
    })
  }

  const cancelar = () => {
    setEditando(null)
    setNuevo(false)
    setFormData({ Codigo: "", Descripcion: "", Color: "blue" })
  }

  const colores = [
    { value: "green", label: "Verde", class: "bg-green-500" },
    { value: "orange", label: "Naranja", class: "bg-orange-500" },
    { value: "red", label: "Rojo", class: "bg-red-500" },
    { value: "blue", label: "Azul", class: "bg-blue-500" },
    { value: "purple", label: "Morado", class: "bg-purple-500" },
    { value: "gray", label: "Gris", class: "bg-gray-500" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link href="/catalogos">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Catálogos
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Clasificaciones</h1>
                <p className="text-gray-600 mt-1">Gestionar clasificaciones de clientes</p>
              </div>
            </div>
            <Button onClick={() => setNuevo(true)} disabled={nuevo || editando !== null}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Clasificación
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(nuevo || editando !== null) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editando ? "Editar" : "Nueva"} Clasificación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="codigo">Código</Label>
                  <Input
                    id="codigo"
                    value={formData.Codigo}
                    onChange={(e) => setFormData({ ...formData, Codigo: e.target.value })}
                    placeholder="A, B, C..."
                  />
                </div>
                <div>
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Input
                    id="descripcion"
                    value={formData.Descripcion}
                    onChange={(e) => setFormData({ ...formData, Descripcion: e.target.value })}
                    placeholder="Descripción de la clasificación"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <select
                    id="color"
                    value={formData.Color}
                    onChange={(e) => setFormData({ ...formData, Color: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {colores.map((color) => (
                      <option key={color.value} value={color.value}>
                        {color.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={guardar}>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
                <Button variant="outline" onClick={cancelar}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Lista de Clasificaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clasificaciones.map((clasificacion) => (
                <div
                  key={clasificacion.IdClasificacion}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Badge className={`bg-${clasificacion.Color}-500 text-white`}>{clasificacion.Codigo}</Badge>
                    <div>
                      <div className="font-medium">{clasificacion.Descripcion}</div>
                      <div className="text-sm text-gray-500">Color: {clasificacion.Color}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => editar(clasificacion)}
                      disabled={editando !== null || nuevo}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => eliminar(clasificacion.IdClasificacion)}
                      disabled={editando !== null || nuevo}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
