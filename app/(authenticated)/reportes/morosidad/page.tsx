"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Download, AlertTriangle, TrendingDown, Calendar, Users, RefreshCw } from "lucide-react"
import Link from "next/link"

interface Cliente {
  IdCliente: number
  RazonSocial: string
  RucDni: string
  ClasificacionCodigo?: string
  ClasificacionColor?: string
  SaldoPendiente?: number
}

interface Pago {
  IdCliente: number
  Monto: number
  Fecha: string
}

interface Compromiso {
  IdCliente: number
  FechaCompromiso: string
  Estado: string
}

export default function AnalisisMorosidadPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [pagos, setPagos] = useState<Pago[]>([])
  const [compromisos, setCompromisos] = useState<Compromiso[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarDatos = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('🔄 Cargando datos para análisis de morosidad...')
      
      const response = await fetch('/api/reportes/morosidad')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar datos')
      }

      console.log('📊 Datos recibidos:', data)
      
      setClientes(data.clientes || [])
      setPagos(data.pagos || [])
      setCompromisos(data.compromisos || [])
      
      // Debug: Verificar datos obtenidos
      console.log('🔍 Datos procesados:', {
        totalClientes: data.clientes?.length || 0,
        totalPagos: data.pagos?.length || 0,
        totalCompromisos: data.compromisos?.length || 0,
        clasificaciones: (data.clientes || []).reduce((acc: Record<string, number>, c: Cliente) => {
          acc[c.ClasificacionCodigo || 'Sin clasificación'] = (acc[c.ClasificacionCodigo || 'Sin clasificación'] || 0) + 1
          return acc
        }, {})
      })
    } catch (error) {
      console.error('❌ Error cargando datos de morosidad:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  // Análisis de morosidad
  const clientesMorosos = clientes.filter((c) => c.ClasificacionCodigo === "C")
  const clientesRiesgo = clientes.filter((c) => c.ClasificacionCodigo === "B")
  
  console.log('📊 Clientes por clasificación:', {
    morosos: clientesMorosos.length,
    riesgo: clientesRiesgo.length,
    total: clientes.length
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Cargando análisis de morosidad...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={cargarDatos}>Reintentar</Button>
        </div>
      </div>
    )
  }

  const analisisDetallado = clientes
    .map((cliente) => {
      const pagosCliente = pagos.filter((p) => p.IdCliente === cliente.IdCliente)
      const compromisosCliente = compromisos.filter((c) => c.IdCliente === cliente.IdCliente)

      const totalPagado = pagosCliente.reduce((sum, p) => sum + Number(p.Monto || 0), 0)
      const ultimoPago =
        pagosCliente.length > 0 ? new Date(Math.max(...pagosCliente.map((p) => new Date(p.Fecha).getTime()))) : null
      const diasSinPago = ultimoPago ? Math.floor((Date.now() - ultimoPago.getTime()) / (1000 * 60 * 60 * 24)) : null

      const compromisosVencidos = compromisosCliente.filter(
        (c) => c.Estado === "PENDIENTE" && new Date(c.FechaCompromiso) < new Date(),
      ).length

      const mesesSinPago = diasSinPago ? Math.floor(diasSinPago / 30) : 0
      const riesgoMorosidad = calcularRiesgoMorosidad(cliente, diasSinPago, compromisosVencidos, totalPagado)

      return {
        ...cliente,
        totalPagado,
        ultimoPago,
        diasSinPago,
        mesesSinPago,
        compromisosVencidos,
        riesgoMorosidad,
      }
    })
    // Temporalmente mostrar todos los clientes para debug
    // .filter((c) => c.ClasificacionCodigo === "B" || c.ClasificacionCodigo === "C")
    .sort((a, b) => b.riesgoMorosidad.score - a.riesgoMorosidad.score)

  console.log('📈 Análisis detallado:', {
    totalAnalizados: analisisDetallado.length,
    clientesAnalizados: analisisDetallado.map(c => ({
      nombre: c.RazonSocial,
      clasificacion: c.ClasificacionCodigo,
      riesgo: c.riesgoMorosidad.nivel,
      score: c.riesgoMorosidad.score
    }))
  })

  const estadisticas = {
    totalMorosos: clientesMorosos.length,
    totalRiesgo: clientesRiesgo.length,
    deudaTotal: analisisDetallado.reduce((sum, c) => sum + Number(c.SaldoPendiente || 0), 0),
    promedioMesesSinPago:
      analisisDetallado.length > 0
        ? analisisDetallado.reduce((sum, c) => sum + c.mesesSinPago, 0) / analisisDetallado.length
        : 0,
    compromisosIncumplidos: analisisDetallado.reduce((sum, c) => sum + c.compromisosVencidos, 0),
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link href="/reportes">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a Reportes
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Análisis de Morosidad</h1>
                <p className="text-gray-600 mt-1">Evaluación del comportamiento de pago de clientes</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={cargarDatos} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar Análisis
              </Button>
              <Button>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Plan de Acción
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas Generales */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Morosos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{estadisticas.totalMorosos}</div>
              <p className="text-xs text-muted-foreground">Clasificación C</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Riesgo</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{estadisticas.totalRiesgo}</div>
              <p className="text-xs text-muted-foreground">Clasificación B</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deuda Total</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                S/ {estadisticas.deudaTotal.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Saldo pendiente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio Sin Pago</CardTitle>
              <Calendar className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{estadisticas.promedioMesesSinPago.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Meses promedio</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compromisos Rotos</CardTitle>
              <Users className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{estadisticas.compromisosIncumplidos}</div>
              <p className="text-xs text-muted-foreground">Incumplimientos</p>
            </CardContent>
          </Card>
        </div>

        {/* Análisis por Segmentos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-800">Clientes de Alto Riesgo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analisisDetallado
                  .filter((c) => c.riesgoMorosidad.nivel === "CRÍTICO")
                  .slice(0, 5)
                  .map((cliente) => (
                    <div
                      key={cliente.IdCliente}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                    >
                      <div>
                        <Link
                          href={`/clientes/${cliente.IdCliente}`}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          {cliente.RazonSocial}
                        </Link>
                        <div className="text-sm text-gray-500">
                          {cliente.mesesSinPago} meses sin pago • S/ {(cliente.SaldoPendiente || 0).toFixed(2)}
                        </div>
                      </div>
                      <Badge variant="destructive">{cliente.riesgoMorosidad.score}%</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-orange-800">Tendencias de Morosidad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">0-30 días sin pago</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: "60%" }} />
                    </div>
                    <span className="text-sm font-medium">
                      {analisisDetallado.filter((c) => c.diasSinPago !== null && c.diasSinPago <= 30).length}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">31-60 días sin pago</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: "40%" }} />
                    </div>
                    <span className="text-sm font-medium">
                      {
                        analisisDetallado.filter(
                          (c) => c.diasSinPago !== null && c.diasSinPago > 30 && c.diasSinPago <= 60,
                        ).length
                      }
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">+90 días sin pago</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: "80%" }} />
                    </div>
                    <span className="text-sm font-medium">
                      {analisisDetallado.filter((c) => c.diasSinPago !== null && c.diasSinPago > 90).length}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabla Detallada */}
        <Card>
          <CardHeader>
            <CardTitle>Análisis Detallado de Morosidad</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Clasificación</TableHead>
                  <TableHead>Saldo Pendiente</TableHead>
                  <TableHead>Días Sin Pago</TableHead>
                  <TableHead>Compromisos Rotos</TableHead>
                  <TableHead>Riesgo</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analisisDetallado.map((cliente) => (
                  <TableRow key={cliente.IdCliente}>
                    <TableCell>
                      <div>
                        <Link
                          href={`/clientes/${cliente.IdCliente}`}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          {cliente.RazonSocial}
                        </Link>
                        <div className="text-sm text-gray-500">{cliente.RucDni}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          cliente.ClasificacionColor === "orange"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {cliente.ClasificacionCodigo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-red-600 font-medium">
                      S/ {(cliente.SaldoPendiente || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {cliente.diasSinPago !== null ? (
                        <Badge variant={cliente.diasSinPago > 60 ? "destructive" : "secondary"}>
                          {cliente.diasSinPago} días
                        </Badge>
                      ) : (
                        "Sin pagos"
                      )}
                    </TableCell>
                    <TableCell>
                      {cliente.compromisosVencidos > 0 ? (
                        <Badge variant="destructive">{cliente.compromisosVencidos}</Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          cliente.riesgoMorosidad.nivel === "CRÍTICO"
                            ? "destructive"
                            : cliente.riesgoMorosidad.nivel === "ALTO"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {cliente.riesgoMorosidad.nivel}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{cliente.riesgoMorosidad.score}%</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/notificaciones/enviar?cliente=${cliente.IdCliente}`}>
                          <Button size="sm" variant="outline">
                            Notificar
                          </Button>
                        </Link>
                        <Link href={`/compromisos/nuevo?cliente=${cliente.IdCliente}`}>
                          <Button size="sm" variant="outline">
                            Compromiso
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

function calcularRiesgoMorosidad(
  cliente: Cliente,
  diasSinPago: number | null,
  compromisosVencidos: number,
  totalPagado: number,
) {
  let score = 0

  // Factor: Clasificación actual
  if (cliente.ClasificacionCodigo === "C") score += 40
  else if (cliente.ClasificacionCodigo === "B") score += 20

  // Factor: Días sin pago
  if (diasSinPago !== null) {
    if (diasSinPago > 90) score += 30
    else if (diasSinPago > 60) score += 20
    else if (diasSinPago > 30) score += 10
  }

  // Factor: Compromisos incumplidos
  score += compromisosVencidos * 10

  // Factor: Saldo pendiente vs capacidad de pago
  const saldoPendiente = cliente.SaldoPendiente || 0
  const montoMensual = cliente.MontoFijoMensual || 0
  if (montoMensual > 0) {
    const mesesDeuda = saldoPendiente / montoMensual
    if (mesesDeuda > 6) score += 20
    else if (mesesDeuda > 3) score += 10
  }

  // Factor: Historial de pagos
  if (totalPagado === 0) score += 15

  // Determinar nivel de riesgo
  let nivel = "BAJO"
  if (score >= 80) nivel = "CRÍTICO"
  else if (score >= 60) nivel = "ALTO"
  else if (score >= 40) nivel = "MEDIO"

  return {
    score: Math.min(score, 100),
    nivel,
  }
}
