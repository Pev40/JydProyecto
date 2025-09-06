"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Download, FileText, Calendar, Eye, Mail } from "lucide-react"

interface Recibo {
  IdRecibo: number
  NumeroRecibo: string
  FechaEmision: string
  MontoTotal: number
  Estado: string
  FechaEnvio: string | null
  MetodoEnvio: string | null
  servicios: Array<{
    NombreServicio: string
    Descripcion: string
    Monto: number
    MesServicio: string
  }>
}

export default function ClienteRecibos() {
  const [recibos, setRecibos] = useState<Recibo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtros, setFiltros] = useState({
    busqueda: "",
    estado: "all", // Updated default value to 'all'
    fechaDesde: "",
    fechaHasta: "",
  })

  useEffect(() => {
    fetchRecibos()
  }, [])

  const fetchRecibos = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await fetch(`/api/portal/recibos?${params}`)

      if (!response.ok) {
        throw new Error("Error cargando recibos")
      }

      const result = await response.json()
      setRecibos(result.recibos)
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
    fetchRecibos()
  }

  const limpiarFiltros = () => {
    setFiltros({
      busqueda: "",
      estado: "all", // Updated default value to 'all'
      fechaDesde: "",
      fechaHasta: "",
    })
    setTimeout(fetchRecibos, 100)
  }

  const descargarRecibo = async (reciboId: number, numeroRecibo: string) => {
    try {
      const response = await fetch(`/api/portal/recibos/${reciboId}/descargar`)

      if (!response.ok) {
        throw new Error("Error descargando recibo")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `${numeroRecibo}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error descargando recibo:", error)
    }
  }

  const verRecibo = async (reciboId: number) => {
    window.open(`/api/portal/recibos/${reciboId}/ver`, "_blank")
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "ENVIADO":
        return "bg-green-100 text-green-800"
      case "GENERADO":
        return "bg-blue-100 text-blue-800"
      case "ERROR":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const calcularTotalRecibos = () => {
    return recibos.reduce((total, recibo) => total + recibo.MontoTotal, 0)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="space-y-4">
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
        <h1 className="text-3xl font-bold text-gray-900">Mis Recibos</h1>
        <p className="text-gray-600 mt-1">Consulte y descargue todos sus recibos emitidos</p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facturado</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {calcularTotalRecibos().toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{recibos.length} recibos emitidos</p>
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
                recibos.filter((r) => {
                  const fechaRecibo = new Date(r.FechaEmision)
                  const hoy = new Date()
                  return fechaRecibo.getMonth() === hoy.getMonth() && fechaRecibo.getFullYear() === hoy.getFullYear()
                }).length
              }
            </div>
            <p className="text-xs text-muted-foreground">Recibos emitidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Último Recibo</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recibos.length > 0 ? new Date(recibos[0].FechaEmision).toLocaleDateString("es-PE") : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">Fecha de emisión</p>
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
                placeholder="Buscar por número..."
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
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="ENVIADO">Enviado</SelectItem>
                <SelectItem value="GENERADO">Generado</SelectItem>
                <SelectItem value="ERROR">Error</SelectItem>
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

      {/* Lista de Recibos */}
      <div className="space-y-4">
        {error && (
          <Card className="border-red-200">
            <CardContent className="p-6">
              <p className="text-red-600">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        {recibos.length === 0 && !loading && !error && (
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron recibos</p>
            </CardContent>
          </Card>
        )}

        {recibos.map((recibo) => (
          <Card key={recibo.IdRecibo}>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="font-semibold text-lg">{recibo.NumeroRecibo}</h3>
                    <Badge className={getEstadoColor(recibo.Estado)}>{recibo.Estado}</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                    <div>
                      <p>
                        <strong>Fecha de emisión:</strong> {new Date(recibo.FechaEmision).toLocaleDateString("es-PE")}
                      </p>
                      {recibo.FechaEnvio && (
                        <p>
                          <strong>Fecha de envío:</strong> {new Date(recibo.FechaEnvio).toLocaleDateString("es-PE")}
                        </p>
                      )}
                      {recibo.MetodoEnvio && (
                        <p>
                          <strong>Método de envío:</strong> {recibo.MetodoEnvio}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Servicios incluidos */}
                  {recibo.servicios.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Servicios incluidos:</h4>
                      <div className="space-y-2">
                        {recibo.servicios.map((servicio, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <div>
                              <p className="font-medium">{servicio.NombreServicio}</p>
                              <p className="text-gray-600">
                                {new Date(servicio.MesServicio).toLocaleDateString("es-PE", {
                                  year: "numeric",
                                  month: "long",
                                })}
                              </p>
                            </div>
                            <p className="font-medium">S/ {servicio.Monto.toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 md:mt-0 md:ml-6">
                  <div className="text-right mb-4">
                    <div className="text-2xl font-bold text-blue-600">S/ {recibo.MontoTotal.toFixed(2)}</div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <Button onClick={() => verRecibo(recibo.IdRecibo)} variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver
                    </Button>
                    <Button
                      onClick={() => descargarRecibo(recibo.IdRecibo, recibo.NumeroRecibo)}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
