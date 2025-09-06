"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react"
import Link from "next/link"

interface VerificacionData {
  verificacion: {
    cajaVariable: { total: number; muestra: any[] }
    cajaFija: { total: number; muestra: any[] }
    proyecciones: { total: number }
    clientesFijos: { total: number }
    pagosRecientes: { total: number }
  }
  estado: string
  timestamp: string
}

export default function VerificarReportesPage() {
  const [datos, setDatos] = useState<VerificacionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarDatos = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/reportes/verificar-datos")
      if (response.ok) {
        const result = await response.json()
        setDatos(result)
      } else {
        const errorResult = await response.json()
        setError(errorResult.error || "Error al cargar datos")
      }
    } catch (err) {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const getStatusIcon = (count: number) => {
    if (count > 0) return <CheckCircle className="h-5 w-5 text-green-500" />
    if (count === 0) return <AlertCircle className="h-5 w-5 text-yellow-500" />
    return <XCircle className="h-5 w-5 text-red-500" />
  }

  const getStatusBadge = (count: number) => {
    if (count > 0)
      return (
        <Badge variant="default" className="bg-green-500">
          OK
        </Badge>
      )
    if (count === 0) return <Badge variant="secondary">Sin datos</Badge>
    return <Badge variant="destructive">Error</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando datos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-6 w-6" />
              Error de Verificación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={cargarDatos} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link href="/reportes">
                <Button variant="outline" size="sm">
                  ← Reportes
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Verificación de Datos</h1>
                <p className="text-gray-600 mt-1">Estado de las vistas y datos para reportes</p>
              </div>
            </div>
            <Button onClick={cargarDatos} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {datos && (
          <>
            {/* Estado General */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {datos.estado === "OK" ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-500" />
                  )}
                  Estado General: {datos.estado}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Última verificación: {new Date(datos.timestamp).toLocaleString("es-PE")}
                </p>
              </CardContent>
            </Card>

            {/* Verificaciones Detalladas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Caja Variable</CardTitle>
                  {getStatusIcon(datos.verificacion.cajaVariable.total)}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{datos.verificacion.cajaVariable.total}</div>
                  <p className="text-xs text-muted-foreground">registros disponibles</p>
                  <div className="mt-2">{getStatusBadge(datos.verificacion.cajaVariable.total)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Caja Fija</CardTitle>
                  {getStatusIcon(datos.verificacion.cajaFija.total)}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{datos.verificacion.cajaFija.total}</div>
                  <p className="text-xs text-muted-foreground">clientes configurados</p>
                  <div className="mt-2">{getStatusBadge(datos.verificacion.cajaFija.total)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Proyecciones</CardTitle>
                  {getStatusIcon(datos.verificacion.proyecciones.total)}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{datos.verificacion.proyecciones.total}</div>
                  <p className="text-xs text-muted-foreground">proyecciones generadas</p>
                  <div className="mt-2">{getStatusBadge(datos.verificacion.proyecciones.total)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Clientes Fijos</CardTitle>
                  {getStatusIcon(datos.verificacion.clientesFijos.total)}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{datos.verificacion.clientesFijos.total}</div>
                  <p className="text-xs text-muted-foreground">con monto fijo</p>
                  <div className="mt-2">{getStatusBadge(datos.verificacion.clientesFijos.total)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pagos Recientes</CardTitle>
                  {getStatusIcon(datos.verificacion.pagosRecientes.total)}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{datos.verificacion.pagosRecientes.total}</div>
                  <p className="text-xs text-muted-foreground">últimos 30 días</p>
                  <div className="mt-2">{getStatusBadge(datos.verificacion.pagosRecientes.total)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Muestra de Datos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Muestra - Caja Variable</CardTitle>
                </CardHeader>
                <CardContent>
                  {datos.verificacion.cajaVariable.muestra.length > 0 ? (
                    <div className="space-y-2">
                      {datos.verificacion.cajaVariable.muestra.map((item, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded text-sm">
                          <div className="font-medium">{item.Cliente}</div>
                          <div className="text-gray-600">
                            {item.NombreMes} - S/ {Number.parseFloat(item.MontoPagado || 0).toLocaleString("es-PE")}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No hay datos disponibles</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Muestra - Caja Fija</CardTitle>
                </CardHeader>
                <CardContent>
                  {datos.verificacion.cajaFija.muestra.length > 0 ? (
                    <div className="space-y-2">
                      {datos.verificacion.cajaFija.muestra.map((item, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded text-sm">
                          <div className="font-medium">{item.Concepto}</div>
                          <div className="text-gray-600">
                            Servicio: S/ {Number.parseFloat(item.ImporteServicioFijo || 0).toLocaleString("es-PE")}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No hay datos disponibles</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Acciones */}
            <div className="mt-8 flex gap-4">
              <Link href="/reportes/ingreso-caja-variable">
                <Button>Ver Reporte Caja Variable</Button>
              </Link>
              <Link href="/reportes/ingreso-caja-fija-proyectado">
                <Button variant="outline">Ver Reporte Caja Fija</Button>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
