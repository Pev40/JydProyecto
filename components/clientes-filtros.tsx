"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, Search, X } from "lucide-react"

interface ClientesFiltrosProps {
  catalogos: {
    clasificaciones: any[]
    carteras: any[]
  }
  searchParams: {
    ultimoDigito?: string
    clasificacion?: string
    cartera?: string
    search?: string
  }
}

export function ClientesFiltros({ catalogos, searchParams }: ClientesFiltrosProps) {
  const router = useRouter()
  const [filtros, setFiltros] = useState({
    search: searchParams.search || "",
    ultimoDigito: searchParams.ultimoDigito || "ALL",
    clasificacion: searchParams.clasificacion || "ALL",
    cartera: searchParams.cartera || "ALL",
  })

  const aplicarFiltros = () => {
    const params = new URLSearchParams()

    if (filtros.search.trim()) {
      params.set("search", filtros.search.trim())
    }

    if (filtros.ultimoDigito !== "ALL") {
      params.set("ultimoDigito", filtros.ultimoDigito)
    }

    if (filtros.clasificacion !== "ALL") {
      params.set("clasificacion", filtros.clasificacion)
    }

    if (filtros.cartera !== "ALL") {
      params.set("cartera", filtros.cartera)
    }

    const queryString = params.toString()
    router.push(`/clientes${queryString ? `?${queryString}` : ""}`)
  }

  const limpiarFiltros = () => {
    setFiltros({
      search: "",
      ultimoDigito: "ALL",
      clasificacion: "ALL",
      cartera: "ALL",
    })
    router.push("/clientes")
  }

  const handleInputChange = (field: string, value: string) => {
    setFiltros((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Aplicar filtros automáticamente cuando se presiona Enter en el campo de búsqueda
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      aplicarFiltros()
    }
  }

  // Verificar si hay filtros activos
  const hayFiltrosActivos =
    filtros.search.trim() !== "" ||
    filtros.ultimoDigito !== "ALL" ||
    filtros.clasificacion !== "ALL" ||
    filtros.cartera !== "ALL"

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros de Búsqueda
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Campo de búsqueda */}
          <div>
            <label className="text-sm font-medium mb-2 block">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Razón social, RUC, contacto..."
                className="pl-10"
                value={filtros.search}
                onChange={(e) => handleInputChange("search", e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
          </div>

          {/* Último Dígito RUC */}
          <div>
            <label className="text-sm font-medium mb-2 block">Último Dígito RUC</label>
            <Select value={filtros.ultimoDigito} onValueChange={(value) => handleInputChange("ultimoDigito", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digito) => (
                  <SelectItem key={digito} value={digito.toString()}>
                    {digito}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clasificación */}
          <div>
            <label className="text-sm font-medium mb-2 block">Clasificación</label>
            <Select value={filtros.clasificacion} onValueChange={(value) => handleInputChange("clasificacion", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas</SelectItem>
                {catalogos.clasificaciones.map((clasificacion) => (
                  <SelectItem key={clasificacion.IdClasificacion} value={clasificacion.Codigo}>
                    {clasificacion.Codigo} - {clasificacion.Descripcion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cartera */}
          <div>
            <label className="text-sm font-medium mb-2 block">Cartera</label>
            <Select value={filtros.cartera} onValueChange={(value) => handleInputChange("cartera", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas</SelectItem>
                {catalogos.carteras.map((cartera) => (
                  <SelectItem key={cartera.IdCartera} value={cartera.IdCartera.toString()}>
                    {cartera.Nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3">
          <Button onClick={aplicarFiltros}>
            <Search className="h-4 w-4 mr-2" />
            Aplicar Filtros
          </Button>

          {hayFiltrosActivos && (
            <Button variant="outline" onClick={limpiarFiltros}>
              <X className="h-4 w-4 mr-2" />
              Limpiar Filtros
            </Button>
          )}
        </div>

        {/* Indicador de filtros activos */}
        {hayFiltrosActivos && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>Filtros activos:</strong>
              <div className="flex flex-wrap gap-2 mt-2">
                {filtros.search.trim() && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    Búsqueda: "{filtros.search}"
                  </span>
                )}
                {filtros.ultimoDigito !== "ALL" && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    Dígito RUC: {filtros.ultimoDigito}
                  </span>
                )}
                {filtros.clasificacion !== "ALL" && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    Clasificación: {filtros.clasificacion}
                  </span>
                )}
                {filtros.cartera !== "ALL" && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    Cartera: {catalogos.carteras.find((c) => c.IdCartera.toString() === filtros.cartera)?.Nombre}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
