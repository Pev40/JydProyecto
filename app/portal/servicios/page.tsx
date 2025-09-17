"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, TrendingUp, Calendar, Package, Clock, CheckCircle } from "lucide-react"

interface Servicio {
  IdServicioAdicional: number
  NombreServicio: string
  Descripcion: string
  Monto: number
  Fecha: string
  Estado: string
  Tipo: string
  MesServicio: string
}

interface ServicioFijo {
  IdServicio: number
  Nombre: string
  Descripcion: string
  MontoFijo: number
  Estado: string
}

export default function ClienteServicios() {
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [servicioFijo, setServicioFijo] = useState<ServicioFijo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtros, setFiltros] = useState({
    busqueda: "",
    estado: "Todos los estados",
    tipo: "Todos los tipos",
    año: new Date().getFullYear().toString(),
  })

  useEffect(() => {
    fetchServicios()
  }, [fetchServicios])

  const fetchServicios = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await fetch(`/api/portal/servicios?${params}`)

      if (!response.ok) {
        throw new Error("Error cargando servicios")
      }

      const result = await response.json()
      setServicios(result.servicios)
      setServicioFijo(result.servicioFijo)
    } catch (error) {
      console.error("Error:", error)
      setError(error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }, [filtros])

  const handleFiltroChange = (key: string, value: string) => {
    setFiltros((prev) => ({ ...prev, [key]: value }))
  }

  const aplicarFiltros = () => {
    fetchServicios()
  }

  const limpiarFiltros = () => {
    setFiltros({
      busqueda: "",
      estado: "Todos los estados",
      tipo: "Todos los tipos",
      año: new Date().getFullYear().toString(),
    })
    setTimeout(fetchServicios, 100)
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "PAGADO":
        return "bg-green-100 text-green-800"
      case "PENDIENTE":
        return "bg-yellow-100 text-yellow-800"
      case "FACTURADO":
        return "bg-blue-100 text-blue-800"
      case "VENCIDO":
        return "bg-red-100 text-red-800"
      case "ACTIVO":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "MENSUAL":
        return "bg-blue-100 text-blue-800"
      case "ADICIONAL":
        return "bg-purple-100 text-purple-800"
      case "ESPECIAL":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const calcularTotalServicios = () => {
    return servicios.reduce((total, servicio) => total + servicio.Monto, 0)
  }

  const serviciosPendientes = servicios.filter((s) => s.Estado === "FACTURADO" || s.Estado === "PENDIENTE")
  const serviciosPagados = servicios.filter((s) => s.Estado === "PAGADO")

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Servicios Contratados</h1>
        <p className="text-gray-600 mt-1">Gestione y consulte todos sus servicios contables</p>
      </div>

      {/* Servicio Fijo */}
      {servicioFijo && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Package className="h-5 w-5" />
              <span>Servicio Principal Contratado</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="font-semibold text-lg text-blue-900">{servicioFijo.Nombre}</h3>
                <p className="text-blue-700">{servicioFijo.Descripcion}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-900">S/ {servicioFijo.MontoFijo.toFixed(2)}</p>
                <p className="text-blue-700">Mensual</p>
              </div>
              <div className="text-right">
                <Badge className={getEstadoColor(servicioFijo.Estado)}>{servicioFijo.Estado}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Servicios</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {calcularTotalServicios().toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{servicios.length} servicios</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{serviciosPendientes.length}</div>
            <p className="text-xs text-muted-foreground">Por pagar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{serviciosPagados.length}</div>
            <p className="text-xs text-muted-foreground">Completados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                servicios.filter((s) => {
                  const fechaServicio = new Date(s.MesServicio)
                  const hoy = new Date()
                  return (
                    fechaServicio.getMonth() === hoy.getMonth() && fechaServicio.getFullYear() === hoy.getFullYear()
                  )
                }).length
              }
            </div>
            <p className="text-xs text-muted-foreground">Servicios</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros de Búsqueda</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar servicio..."
                value={filtros.busqueda}
                onChange={(e) => handleFiltroChange("busqueda", e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filtros.estado} onValueChange={(value) => handleFiltroChange("estado", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos los estados">Todos los estados</SelectItem>
                <SelectItem value="PAGADO">Pagado</SelectItem>
                <SelectItem value="FACTURADO">Facturado</SelectItem>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                <SelectItem value="VENCIDO">Vencido</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtros.tipo} onValueChange={(value) => handleFiltroChange("tipo", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos los tipos">Todos los tipos</SelectItem>
                <SelectItem value="MENSUAL">Mensual</SelectItem>
                <SelectItem value="ADICIONAL">Adicional</SelectItem>
                <SelectItem value="ESPECIAL">Especial</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtros.año} onValueChange={(value) => handleFiltroChange("año", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex space-x-2">
              <Button onClick={aplicarFiltros} className="flex-1">
                Aplicar
              </Button>
              <Button onClick={limpiarFiltros} variant="outline">
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Servicios */}
      <div className="space-y-4">
        {error && (
          <Card className="border-red-200">
            <CardContent className="p-6">
              <p className="text-red-600">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        {servicios.length === 0 && !loading && !error && (
          <Card>
            <CardContent className="p-6 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron servicios</p>
            </CardContent>
          </Card>
        )}

        {servicios.map((servicio) => (
          <Card key={servicio.IdServicioAdicional}>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-lg">{servicio.NombreServicio}</h3>
                    <Badge className={getEstadoColor(servicio.Estado)}>{servicio.Estado}</Badge>
                    <Badge className={getTipoColor(servicio.Tipo)}>{servicio.Tipo}</Badge>
                  </div>

                  <p className="text-gray-600 mb-3">{servicio.Descripcion}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p>
                        <strong>Fecha de servicio:</strong> {new Date(servicio.Fecha).toLocaleDateString("es-PE")}
                      </p>
                      <p>
                        <strong>Período:</strong>{" "}
                        {new Date(servicio.MesServicio).toLocaleDateString("es-PE", { year: "numeric", month: "long" })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 md:mt-0 md:ml-6 text-right">
                  <div className="text-2xl font-bold text-blue-600">S/ {servicio.Monto.toFixed(2)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
