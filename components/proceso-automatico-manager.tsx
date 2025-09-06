"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Play, RefreshCw, CheckCircle, AlertTriangle, Clock, FileText, Users, Mail } from "lucide-react"

interface ProcesoResult {
  fecha: string
  clientesProcesados: number
  serviciosGenerados: number
  recordatoriosEnviados: number
  errores: string[]
  resumen: string
}

interface HistorialItem {
  IdLog: number
  Fecha: string
  ClientesProcesados: number
  ServiciosGenerados: number
  RecordatoriosEnviados: number
  Errores: string[]
  Resumen: string
  Estado: string
  FechaEjecucion: string
}

export function ProcesoAutomaticoManager() {
  const [ejecutando, setEjecutando] = useState(false)
  const [ultimoResultado, setUltimoResultado] = useState<ProcesoResult | null>(null)
  const [historial, setHistorial] = useState<HistorialItem[]>([])
  const [cargandoHistorial, setCargandoHistorial] = useState(true)

  useEffect(() => {
    cargarHistorial()
  }, [])

  const cargarHistorial = async () => {
    try {
      setCargandoHistorial(true)
      const response = await fetch("/api/proceso-automatico")
      const data = await response.json()

      if (data.success) {
        setHistorial(data.historial)
      }
    } catch (error) {
      console.error("Error cargando historial:", error)
    } finally {
      setCargandoHistorial(false)
    }
  }

  const ejecutarProceso = async () => {
    try {
      setEjecutando(true)
      const response = await fetch("/api/proceso-automatico", {
        method: "POST",
      })
      const data = await response.json()

      if (data.success) {
        setUltimoResultado(data.resultado)
        await cargarHistorial() // Recargar historial
      } else {
        alert("Error ejecutando proceso: " + data.error)
      }
    } catch (error) {
      console.error("Error ejecutando proceso:", error)
      alert("Error ejecutando proceso automático")
    } finally {
      setEjecutando(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Control Manual */}
      <Card>
        <CardHeader>
          <CardTitle>Ejecución Manual</CardTitle>
          <CardDescription>Ejecutar el proceso automático manualmente para pruebas o casos especiales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Button onClick={ejecutarProceso} disabled={ejecutando} className="flex items-center space-x-2">
              {ejecutando ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              <span>{ejecutando ? "Ejecutando..." : "Ejecutar Ahora"}</span>
            </Button>
            <p className="text-sm text-gray-500">
              Esto ejecutará el mismo proceso que se ejecuta automáticamente cada día
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Último Resultado */}
      {ultimoResultado && (
        <Card>
          <CardHeader>
            <CardTitle>Último Resultado de Ejecución</CardTitle>
            <CardDescription>Resultado de la ejecución manual más reciente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Clientes Procesados</p>
                  <p className="font-semibold">{ultimoResultado.clientesProcesados}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500">Servicios Generados</p>
                  <p className="font-semibold">{ultimoResultado.serviciosGenerados}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-500">Recordatorios Enviados</p>
                  <p className="font-semibold">{ultimoResultado.recordatoriosEnviados}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-sm text-gray-500">Errores</p>
                  <p className="font-semibold">{ultimoResultado.errores.length}</p>
                </div>
              </div>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Resumen:</strong> {ultimoResultado.resumen}
              </AlertDescription>
            </Alert>

            {ultimoResultado.errores.length > 0 && (
              <Alert className="mt-4" variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Errores encontrados:</strong>
                  <ul className="mt-2 list-disc list-inside">
                    {ultimoResultado.errores.map((error, index) => (
                      <li key={index} className="text-sm">
                        {error}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Historial */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Ejecuciones</CardTitle>
          <CardDescription>Últimas 30 ejecuciones del proceso automático</CardDescription>
        </CardHeader>
        <CardContent>
          {cargandoHistorial ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Cargando historial...</span>
            </div>
          ) : historial.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay ejecuciones registradas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historial.map((item) => (
                <div key={item.IdLog} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-4">
                      <span className="font-medium">{new Date(item.Fecha).toLocaleDateString("es-PE")}</span>
                      <Badge variant={item.Estado === "EXITOSO" ? "default" : "destructive"}>{item.Estado}</Badge>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(item.FechaEjecucion).toLocaleString("es-PE")}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{item.Resumen}</p>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Clientes:</span>
                      <span className="ml-1 font-medium">{item.ClientesProcesados}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Servicios:</span>
                      <span className="ml-1 font-medium">{item.ServiciosGenerados}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Recordatorios:</span>
                      <span className="ml-1 font-medium">{item.RecordatoriosEnviados}</span>
                    </div>
                  </div>

                  {item.Errores && item.Errores.length > 0 && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm text-red-700 font-medium">Errores:</p>
                      <ul className="text-sm text-red-600 list-disc list-inside">
                        {item.Errores.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
