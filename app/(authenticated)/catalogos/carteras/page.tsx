"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Edit, Trash2, Save, X } from "lucide-react"
import Link from "next/link"

interface Cartera {
  IdCartera: number
  Nombre: string
  Descripcion: string
  Estado: string
}

export default function CarterasPage() {
  const [carteras, setCarteras] = useState<Cartera[]>([])
  const [editando, setEditando] = useState<number | null>(null)
  const [nuevo, setNuevo] = useState(false)
  const [formData, setFormData] = useState({
    Nombre: "",
    Descripcion: "",
    Estado: "ACTIVA",
  })

  useEffect(() => {
    cargarCarteras()
  }, [])

  const cargarCarteras = async () => {
    try {
      const response = await fetch("/api/catalogos/carteras")
      const data = await response.json()
      setCarteras(data)
    } catch (error) {
      console.error("Error cargando carteras:", error)
    }
  }

  const guardar = async () => {
    try {
      const url = editando ? `/api/catalogos/carteras/${editando}` : "/api/catalogos/carteras"

      const method = editando ? "PUT" : "POST"

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      await cargarCarteras()
      cancelar()
    } catch (error) {
      console.error("Error guardando:", error)
    }
  }

  const eliminar = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar esta cartera?")) return

    try {
      await fetch(`/api/catalogos/carteras/${id}`, {
        method: "DELETE",
      })
      await cargarCarteras()
    } catch (error) {
      console.error("Error eliminando:", error)
    }
  }

  const editar = (cartera: Cartera) => {
    setEditando(cartera.IdCartera)
    setFormData({
      Nombre: cartera.Nombre,
      Descripcion: cartera.Descripcion || "",
      Estado: cartera.Estado,
    })
  }

  const cancelar = () => {
    setEditando(null)
    setNuevo(false)
    setFormData({ Nombre: "", Descripcion: "", Estado: "ACTIVA" })
  }

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
                <h1 className="text-3xl font-bold text-gray-900">Carteras</h1>
                <p className="text-gray-600 mt-1">Gestionar carteras de clientes</p>
              </div>
            </div>
            <Button onClick={() => setNuevo(true)} disabled={nuevo || editando !== null}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Cartera
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(nuevo || editando !== null) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editando ? "Editar" : "Nueva"} Cartera</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={formData.Nombre}
                    onChange={(e) => setFormData({ ...formData, Nombre: e.target.value })}
                    placeholder="Nombre de la cartera"
                  />
                </div>
                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <select
                    id="estado"
                    value={formData.Estado}
                    onChange={(e) => setFormData({ ...formData, Estado: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="ACTIVA">Activa</option>
                    <option value="INACTIVA">Inactiva</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Input
                  id="descripcion"
                  value={formData.Descripcion}
                  onChange={(e) => setFormData({ ...formData, Descripcion: e.target.value })}
                  placeholder="Descripción de la cartera"
                />
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
            <CardTitle>Lista de Carteras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {carteras.map((cartera) => (
                <div key={cartera.IdCartera} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Badge variant={cartera.Estado === "ACTIVA" ? "default" : "secondary"}>{cartera.Estado}</Badge>
                    <div>
                      <div className="font-medium">{cartera.Nombre}</div>
                      {cartera.Descripcion && <div className="text-sm text-gray-500">{cartera.Descripcion}</div>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => editar(cartera)}
                      disabled={editando !== null || nuevo}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => eliminar(cartera.IdCartera)}
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
