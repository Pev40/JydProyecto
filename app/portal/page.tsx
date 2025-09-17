"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, CreditCard, DollarSign, User, Loader2 } from "lucide-react"
import { ReloadButton } from "@/components/reload-button"

interface Cliente {
  IdCliente: number
  RazonSocial: string
  RucDni: string
  Email: string
  Estado: string
  Clasificacion: string
  MontoFijoMensual: number
}

interface Pago {
  IdPago: number
  Monto: string | number
  Fecha: string
  ServicioNombre: string
}

interface Notificacion {
  IdNotificacion: number
  TipoNotificacion: string
  FechaEnvio: string
  Mensaje: string
}

interface Compromiso {
  IdCompromiso: number
  FechaCompromiso: string
  Monto: number
  Estado: string
}

export default function PortalPage() {
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [pagos, setPagos] = useState<Pago[]>([])
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [compromisos, setCompromisos] = useState<Compromiso[]>([])
  const [pagosPendientesCount, setPagosPendientesCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      setError(null)

      // Verificar autenticación primero
      const authResponse = await fetch('/api/auth/me')
      if (!authResponse.ok) {
        window.location.href = '/login'
        return
      }

      const user = await authResponse.json()
  if (!user || user.rol !== "CLIENTE") {
        window.location.href = '/login'
        return
      }

      if (!user.idCliente) {
        setError("Tu cuenta no tiene un cliente asociado. Contacta al administrador.")
        return
      }

      // Cargar datos de forma paralela
      const [clienteResponse, pagosResponse, notificacionesResponse, estadisticasResponse] = await Promise.all([
        fetch('/api/portal/cliente'),
        fetch('/api/portal/pagos'),
        fetch('/api/portal/notificaciones'),
        fetch('/api/portal/estadisticas')
      ])

      if (!clienteResponse.ok) {
        if (clienteResponse.status === 404) {
          setError("Cliente no encontrado. Contacta al administrador.")
          return
        }
        throw new Error('Error cargando cliente')
      }

      if (!pagosResponse.ok || !notificacionesResponse.ok || !estadisticasResponse.ok) {
        throw new Error('Error cargando datos')
      }

      const clienteData = await clienteResponse.json()
      const pagosData = await pagosResponse.json()
      const notificacionesData = await notificacionesResponse.json()
      const estadisticasData = await estadisticasResponse.json()

      setCliente(clienteData.cliente)
      setPagos(pagosData.pagos)
      setNotificaciones(notificacionesData.notificaciones)
      setCompromisos(estadisticasData.estadisticas.compromisosPendientes)
      setPagosPendientesCount(estadisticasData.estadisticas.pagosPendientesCount)

    } catch (error) {
      console.error('Error cargando datos del portal:', error)
      setError("Error al cargar los datos. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando tu información...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <button
              onClick={cargarDatos}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Reintentar
            </button>
            <form action="/api/auth/logout" method="POST" className="inline">
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Cerrar Sesión
            </button>
          </form>
          </div>
        </div>
      </div>
    )
  }

  if (!cliente) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Cliente no encontrado</h1>
            <p className="text-gray-600 mb-4">No se encontró información del cliente asociado a tu cuenta.</p>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Cerrar Sesión
              </button>
            </form>
          </div>
        </div>
      )
    }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  ¡Bienvenido, {cliente.RazonSocial}!
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Tu portal de cliente - Sistema de Cobranza J&D
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <ReloadButton onReload={cargarDatos} />
                <form action="/api/auth/logout" method="POST">
                  <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Cerrar Sesión
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Información del Cliente */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Razón Social</h3>
                  <p className="mt-1 text-sm text-gray-900">{cliente.RazonSocial}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">RUC/DNI</h3>
                  <p className="mt-1 text-sm text-gray-900">{cliente.RucDni}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Clasificación</h3>
                  <p className="mt-1 text-sm text-gray-900">{cliente.Clasificacion || 'No clasificado'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Estado</h3>
                  <Badge variant={cliente.Estado === 'ACTIVO' ? 'default' : 'secondary'}>
                    {cliente.Estado}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Monto Fijo Mensual</h3>
                  <p className="mt-1 text-sm text-gray-900">S/ {cliente.MontoFijoMensual?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Pagos Pendientes</h3>
                  <Badge variant={pagosPendientesCount > 0 ? 'destructive' : 'default'}>
                    {pagosPendientesCount}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">S/ {totalPagado.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {pagosEsteAno.length} pagos este año
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compromisos Pendientes</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{compromisos.length}</div>
              <p className="text-xs text-muted-foreground">
                Próximo: {compromisos.length > 0 ? new Date(compromisos[0].FechaCompromiso).toLocaleDateString() : 'Ninguno'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagos Realizados</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pagos.length}</div>
              <p className="text-xs text-muted-foreground">
                Último: {pagos.length > 0 ? new Date(pagos[0].Fecha).toLocaleDateString() : 'Ninguno'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pagos Recientes */}
          <Card>
            <CardHeader>
              <CardTitle>Últimos Pagos</CardTitle>
              <CardDescription>Tus pagos más recientes</CardDescription>
            </CardHeader>
            <CardContent>
              {pagos.length === 0 ? (
                <p className="text-sm text-gray-500">No hay pagos registrados</p>
              ) : (
                <div className="space-y-4">
                  {pagos.slice(0, 5).map((pago) => (
                    <div key={pago.IdPago} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{pago.ServicioNombre || 'Servicio'}</p>
                        <p className="text-xs text-gray-500">{new Date(pago.Fecha).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">S/ {Number(pago.Monto).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notificaciones */}
          <Card>
            <CardHeader>
              <CardTitle>Notificaciones</CardTitle>
              <CardDescription>Últimas comunicaciones</CardDescription>
            </CardHeader>
            <CardContent>
              {notificaciones.length === 0 ? (
                <p className="text-sm text-gray-500">No hay notificaciones</p>
              ) : (
                <div className="space-y-4">
                  {notificaciones.slice(0, 5).map((notif) => (
                    <div key={notif.IdNotificacion} className="flex items-start space-x-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{notif.TipoNotificacion}</p>
                        <p className="text-xs text-gray-500">{new Date(notif.FechaEnvio).toLocaleDateString()}</p>
                        {notif.Mensaje && (
                          <p className="text-sm text-gray-700 mt-1">{notif.Mensaje}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Compromisos Pendientes */}
        {compromisos.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-red-600">Compromisos de Pago Pendientes</CardTitle>
              <CardDescription>Fechas importantes que requieren tu atención</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {compromisos.map((compromiso) => (
                  <div key={compromiso.IdCompromiso} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Fecha: {new Date(compromiso.FechaCompromiso).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-500">Monto: S/ {compromiso.Monto.toFixed(2)}</p>
                    </div>
                    <Badge variant="destructive">
                      Pendiente
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
