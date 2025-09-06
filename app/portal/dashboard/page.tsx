"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Calendar, CreditCard, FileText, AlertTriangle, Clock, DollarSign, TrendingUp, Bell } from "lucide-react"
import Link from "next/link"

interface DashboardData {
  cliente: {
    RazonSocial: string
    Clasificacion: string
    Email: string
    Telefono: string
  }
  resumen: {
    deudaTotal: number
    serviciosPendientes: number
    recibosEmitidos: number
    proximoVencimiento: string | null
  }
  servicios: Array<{
    IdServicioAdicional: number
    NombreServicio: string
    Monto: number
    Estado: string
    Fecha: string
    MesServicio: string
  }>
  pagosRecientes: Array<{
    IdPago: number
    Monto: number
    FechaPago: string
    Estado: string
    Concepto: string
  }>
  alertas: Array<{
    tipo: string
    mensaje: string
    fecha: string
  }>
}

export default function ClienteDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/portal/dashboard")

      if (!response.ok) {
        throw new Error("Error cargando datos del dashboard")
      }

      const result = await response.json()
      setData(result.data)
    } catch (error) {
      console.error("Error:", error)
      setError(error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p>No se encontraron datos</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getClasificacionColor = (clasificacion: string) => {
    switch (clasificacion) {
      case "A":
        return "bg-green-100 text-green-800"
      case "B":
        return "bg-yellow-100 text-yellow-800"
      case "C":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
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
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bienvenido, {data.cliente.RazonSocial}</h1>
          <p className="text-gray-600 mt-1">Resumen de su cuenta y servicios contratados</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Badge className={getClasificacionColor(data.cliente.Clasificacion)}>
            Cliente {data.cliente.Clasificacion}
          </Badge>
        </div>
      </div>

      {/* Alertas */}
      {data.alertas.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <Bell className="h-5 w-5" />
              <span>Alertas Importantes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.alertas.map((alerta, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-orange-800">{alerta.mensaje}</p>
                    <p className="text-xs text-orange-600">{alerta.fecha}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deuda Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {data.resumen.deudaTotal.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {data.resumen.deudaTotal > 0 ? "Pendiente de pago" : "Al día"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Servicios Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.resumen.serviciosPendientes}</div>
            <p className="text-xs text-muted-foreground">Por pagar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recibos Emitidos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.resumen.recibosEmitidos}</div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximo Vencimiento</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.resumen.proximoVencimiento
                ? new Date(data.resumen.proximoVencimiento).toLocaleDateString("es-PE")
                : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">Cronograma SUNAT</p>
          </CardContent>
        </Card>
      </div>

      {/* Servicios Recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Servicios Recientes</span>
            </CardTitle>
            <CardDescription>Últimos servicios contratados y su estado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.servicios.slice(0, 5).map((servicio) => (
                <div key={servicio.IdServicioAdicional} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{servicio.NombreServicio}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(servicio.MesServicio).toLocaleDateString("es-PE", {
                        year: "numeric",
                        month: "long",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">S/ {servicio.Monto.toFixed(2)}</p>
                    <Badge className={getEstadoColor(servicio.Estado)}>{servicio.Estado}</Badge>
                  </div>
                </div>
              ))}
              {data.servicios.length === 0 && (
                <p className="text-gray-500 text-center py-4">No hay servicios registrados</p>
              )}
            </div>
            <Separator className="my-4" />
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/portal/servicios">Ver Todos los Servicios</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Pagos Recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Pagos Recientes</span>
            </CardTitle>
            <CardDescription>Historial de pagos realizados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.pagosRecientes.slice(0, 5).map((pago) => (
                <div key={pago.IdPago} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{pago.Concepto}</p>
                    <p className="text-sm text-gray-600">{new Date(pago.FechaPago).toLocaleDateString("es-PE")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">S/ {pago.Monto.toFixed(2)}</p>
                    <Badge className={getEstadoColor(pago.Estado)}>{pago.Estado}</Badge>
                  </div>
                </div>
              ))}
              {data.pagosRecientes.length === 0 && (
                <p className="text-gray-500 text-center py-4">No hay pagos registrados</p>
              )}
            </div>
            <Separator className="my-4" />
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/portal/pagos">Ver Historial Completo</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Acciones Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Accesos directos a las funciones más utilizadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild variant="outline" className="h-20 flex-col bg-transparent">
              <Link href="/portal/servicios">
                <TrendingUp className="h-6 w-6 mb-2" />
                Ver Servicios
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col bg-transparent">
              <Link href="/portal/pagos">
                <CreditCard className="h-6 w-6 mb-2" />
                Historial de Pagos
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col bg-transparent">
              <Link href="/portal/recibos">
                <FileText className="h-6 w-6 mb-2" />
                Mis Recibos
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
