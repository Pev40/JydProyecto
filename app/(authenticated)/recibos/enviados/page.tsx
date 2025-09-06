"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Mail, Search, RefreshCw, CheckCircle, XCircle, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ReciboEnviado {
  id: number
  numero_recibo: string
  cliente_nombre: string
  email_destinatario: string
  pago_monto: number
  pago_concepto: string
  estado: "ENVIADO" | "ERROR"
  fecha_envio: string
  error_mensaje?: string
  message_id?: string
}

interface EstadisticasRecibos {
  total: number
  enviados: number
  errores: number
  hoy: number
}

export default function RecibosEnviadosPage() {
  const [recibos, setRecibos] = useState<ReciboEnviado[]>([])
  const [estadisticas, setEstadisticas] = useState<EstadisticasRecibos>({
    total: 0,
    enviados: 0,
    errores: 0,
    hoy: 0,
  })
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({
    busqueda: "",
    estado: "todos",
    fecha: "",
  })
  const [paginacion, setPaginacion] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
  })

  const { toast } = useToast()

  useEffect(() => {
    cargarRecibos()
    cargarEstadisticas()
  }, [paginacion.page, filtros])

  const cargarRecibos = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: paginacion.page.toString(),
        limit: paginacion.limit.toString(),
        ...(filtros.busqueda && { busqueda: filtros.busqueda }),
        ...(filtros.estado !== "todos" && { estado: filtros.estado }),
        ...(filtros.fecha && { fecha: filtros.fecha }),
      })

      const response = await fetch(`/api/recibos/enviados?${params}`)
      const data = await response.json()

      if (response.ok) {
        setRecibos(data.recibos)
        setPaginacion((prev) => ({
          ...prev,
          total: data.total,
          hasMore: data.hasMore,
        }))
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Error al cargar recibos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los recibos enviados",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const cargarEstadisticas = async () => {
    try {
      const response = await fetch("/api/recibos/enviados/estadisticas")
      const data = await response.json()

      if (response.ok) {
        setEstadisticas(data)
      }
    } catch (error) {
      console.error("Error al cargar estadísticas:", error)
    }
  }

  const handleFiltroChange = (campo: string, valor: string) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }))
    setPaginacion((prev) => ({ ...prev, page: 1 }))
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString("es-PE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(monto)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Recibos Enviados</h1>
          <p className="text-muted-foreground">Historial de recibos enviados por email a los clientes</p>
        </div>
        <Button onClick={cargarRecibos} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recibos</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enviados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{estadisticas.enviados}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errores</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{estadisticas.errores}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{estadisticas.hoy}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cliente, email o número de recibo..."
                  value={filtros.busqueda}
                  onChange={(e) => handleFiltroChange("busqueda", e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={filtros.estado} onValueChange={(value) => handleFiltroChange("estado", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ENVIADO">Enviados</SelectItem>
                  <SelectItem value="ERROR">Con Error</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha</label>
              <Input type="date" value={filtros.fecha} onChange={(e) => handleFiltroChange("fecha", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de recibos */}
      <Card>
        <CardHeader>
          <CardTitle>Recibos Enviados</CardTitle>
          <CardDescription>{paginacion.total} recibos encontrados</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Recibo</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Envío</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recibos.map((recibo) => (
                    <TableRow key={recibo.id}>
                      <TableCell className="font-mono">{recibo.numero_recibo}</TableCell>
                      <TableCell>{recibo.cliente_nombre}</TableCell>
                      <TableCell>{recibo.email_destinatario}</TableCell>
                      <TableCell>{recibo.pago_monto ? formatearMonto(recibo.pago_monto) : "-"}</TableCell>
                      <TableCell>{recibo.pago_concepto || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={recibo.estado === "ENVIADO" ? "default" : "destructive"}>
                          {recibo.estado === "ENVIADO" ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Enviado
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Error
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatearFecha(recibo.fecha_envio)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {recibos.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No se encontraron recibos enviados</div>
              )}

              {/* Paginación */}
              {paginacion.total > paginacion.limit && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {(paginacion.page - 1) * paginacion.limit + 1} a{" "}
                    {Math.min(paginacion.page * paginacion.limit, paginacion.total)} de {paginacion.total} recibos
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={paginacion.page === 1}
                      onClick={() => setPaginacion((prev) => ({ ...prev, page: prev.page - 1 }))}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!paginacion.hasMore}
                      onClick={() => setPaginacion((prev) => ({ ...prev, page: prev.page + 1 }))}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
