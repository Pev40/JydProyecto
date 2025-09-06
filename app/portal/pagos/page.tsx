"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Download, CreditCard, Calendar, DollarSign, FileText } from "lucide-react"

interface Pago {
  IdPago: number
  Monto: number
  FechaPago: string
  Estado: string
  Concepto: string
  MetodoPago: string
  NumeroOperacion: string | null
  Observaciones: string | null
  servicios: Array<{
    NombreServicio: string
    Monto: number
    MesServicio: string
  }>
}

export default function ClientePagos() {
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtros, setFiltros] = useState({
    busqueda: "",
    estado: "all", // Updated default value to 'all'
    fechaDesde: "",
    fechaHasta: "",
  })

  useEffect(() => {
    fetchPagos()
  }, [])

  const fetchPagos = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await fetch(`/api/portal/pagos?${params}`)

      if (!response.ok) {
        throw new Error("Error cargando pagos")
      }

      const result = await response.json()
      setPagos(result.pagos)
    } catch (error) {
      console.error("Error:", error)
      setError(error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const handleFiltroChange = (key: string, value: string) => {
    setFiltros((prev) => ({ ...prev, [key]: value }))
  }

  const aplicarFiltros = () => {
    fetchPagos()
  }

  const limpiarFiltros = () => {
    setFiltros({
      busqueda: "",
      estado: "all", // Updated default value to 'all'
      fechaDesde: "",
      fechaHasta: "",
    })
    setTimeout(fetchPagos, 100)
  }

  const exportarPagos = async () => {
    try {
      const params = new URLSearchParams()
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await fetch(`/api/portal/pagos/exportar?${params}`)

      if (!response.ok) {
        throw new Error("Error exportando pagos")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `pagos_${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exportando:", error)
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "PAGADO":
        return "bg-green-100 text-green-800"
      case "PENDIENTE":
        return "bg-yellow-100 text-yellow-800"
      case "CANCELADO":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const calcularTotalPagos = () => {
    return pagos.reduce((total, pago) => total + pago.Monto, 0)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Historial de Pagos</h1>
          <p className="text-gray-600 mt-1">Consulte todos sus pagos realizados</p>
        </div>
        <Button onClick={exportarPagos} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar Excel
        </Button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {calcularTotalPagos().toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{pagos.length} pagos registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Este Mes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                pagos.filter((p) => {
                  const fechaPago = new Date(p.FechaPago)
                  const hoy = new Date()
                  return fechaPago.getMonth() === hoy.getMonth() && fechaPago.getFullYear() === hoy.getFullYear()
                }).length
              }
            </div>
            <p className="text-xs text-muted-foreground">Pagos realizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Último Pago</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pagos.length > 0 ? new Date(pagos[0].FechaPago).toLocaleDateString("es-PE") : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">Fecha del último pago</p>
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
                placeholder="Buscar por concepto..."
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
                <SelectItem value="all">Todos los estados</SelectItem> {/* Updated value to 'all' */}
                <SelectItem value="PAGADO">Pagado</SelectItem>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                <SelectItem value="CANCELADO">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Fecha desde"
              value={filtros.fechaDesde}
              onChange={(e) => handleFiltroChange("fechaDesde", e.target.value)}
            />

            <Input
              type="date"
              placeholder="Fecha hasta"
              value={filtros.fechaHasta}
              onChange={(e) => handleFiltroChange("fechaHasta", e.target.value)}
            />

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

      {/* Lista de Pagos */}
      <div className="space-y-4">
        {error && (
          <Card className="border-red-200">
            <CardContent className="p-6">
              <p className="text-red-600">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        {pagos.length === 0 && !loading && !error && (
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron pagos</p>
            </CardContent>
          </Card>
        )}

        {pagos.map((pago) => (
          <Card key={pago.IdPago}>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-lg">{pago.Concepto}</h3>
                    <Badge className={getEstadoColor(pago.Estado)}>{pago.Estado}</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p>
                        <strong>Fecha:</strong> {new Date(pago.FechaPago).toLocaleDateString("es-PE")}
                      </p>
                      <p>
                        <strong>Método:</strong> {pago.MetodoPago}
                      </p>
                      {pago.NumeroOperacion && (
                        <p>
                          <strong>N° Operación:</strong> {pago.NumeroOperacion}
                        </p>
                      )}
                    </div>

                    {pago.servicios.length > 0 && (
                      <div>
                        <p>
                          <strong>Servicios incluidos:</strong>
                        </p>
                        <ul className="list-disc list-inside ml-2">
                          {pago.servicios.map((servicio, index) => (
                            <li key={index}>
                              {servicio.NombreServicio} -{" "}
                              {new Date(servicio.MesServicio).toLocaleDateString("es-PE", {
                                year: "numeric",
                                month: "long",
                              })}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {pago.Observaciones && (
                    <div className="mt-3 p-3 bg-gray-50 rounded">
                      <p className="text-sm">
                        <strong>Observaciones:</strong> {pago.Observaciones}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 md:mt-0 md:ml-6 text-right">
                  <div className="text-2xl font-bold text-green-600">S/ {pago.Monto.toFixed(2)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
