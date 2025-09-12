"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Play, Calendar, DollarSign, Users, AlertCircle } from "lucide-react"
import Link from "next/link"

interface ClienteParaGenerar {
  IdCliente: number
  RazonSocial: string
  MontoFijoMensual: number
  UltimoPago: string | null
  MesesSinPago: number
  seleccionado: boolean
}

interface ResultadoGeneracion {
  exito: boolean
  mensaje: string
  pagosGenerados?: number
  montoTotal?: number
  detalles?: Record<string, unknown>
}

export default function GenerarAutomaticosPage() {
  const [clientes, setClientes] = useState<ClienteParaGenerar[]>([])
  const [mesGeneracion, setMesGeneracion] = useState(new Date().toISOString().slice(0, 7))
  const [loading, setLoading] = useState(false)
  const [generando, setGenerando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoGeneracion | null>(null)

  const cargarClientes = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/pagos/generar-automaticos/preview?mes=${mesGeneracion}`)
      const data = await response.json()
      setClientes(data.map((c: ClienteParaGenerar) => ({ ...c, seleccionado: true })))
    } catch (error) {
      console.error("Error cargando clientes:", error)
    } finally {
      setLoading(false)
    }
  }, [mesGeneracion])

  useEffect(() => {
    cargarClientes()
  }, [cargarClientes])

  const toggleCliente = (idCliente: number) => {
    setClientes((prev) => prev.map((c) => (c.IdCliente === idCliente ? { ...c, seleccionado: !c.seleccionado } : c)))
  }

  const toggleTodos = () => {
    const todosSeleccionados = clientes.every((c) => c.seleccionado)
    setClientes((prev) => prev.map((c) => ({ ...c, seleccionado: !todosSeleccionados })))
  }

  const generarPagos = async () => {
    const clientesSeleccionados = clientes.filter((c) => c.seleccionado)

    if (clientesSeleccionados.length === 0) {
      alert("Debe seleccionar al menos un cliente")
      return
    }

    if (!confirm(`¿Está seguro de generar ${clientesSeleccionados.length} pagos automáticos para ${mesGeneracion}?`)) {
      return
    }

    setGenerando(true)
    try {
      const response = await fetch("/api/pagos/generar-automaticos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mes: mesGeneracion,
          clientes: clientesSeleccionados.map((c) => c.IdCliente),
        }),
      })

      const resultado = await response.json()
      setResultado(resultado)

      if (resultado.exito) {
        // Recargar la lista
        await cargarClientes()
      }
    } catch (error) {
      console.error("Error generando pagos:", error)
      alert("Error al generar los pagos automáticos")
    } finally {
      setGenerando(false)
    }
  }

  const clientesSeleccionados = clientes.filter((c) => c.seleccionado)
  const totalMonto = clientesSeleccionados.reduce((sum, c) => sum + c.MontoFijoMensual, 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link href="/pagos">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Pagos
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Generación Automática de Pagos</h1>
                <p className="text-gray-600 mt-1">Generar pagos automáticos basados en montos fijos mensuales</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Configuración */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Configuración de Generación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div>
                <Label htmlFor="mes">Mes de Generación</Label>
                <Input
                  id="mes"
                  type="month"
                  value={mesGeneracion}
                  onChange={(e) => setMesGeneracion(e.target.value)}
                  className="w-40"
                />
              </div>
              <Button onClick={cargarClientes} disabled={loading}>
                {loading ? "Cargando..." : "Actualizar Lista"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resumen */}
        {clientes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Clientes Seleccionados</p>
                    <p className="text-2xl font-bold text-blue-600">{clientesSeleccionados.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Monto Total</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalMonto)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Clientes</p>
                    <p className="text-2xl font-bold text-gray-600">{clientes.length}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Resultado de generación */}
        {resultado && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${resultado.exito ? "text-green-600" : "text-red-600"}`}>
                <AlertCircle className="h-5 w-5" />
                Resultado de la Generación
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resultado.exito ? (
                <div className="text-green-600">
                  <p className="font-medium">✅ Generación exitosa</p>
                  <p>
                    Se generaron {resultado.pagosGenerados} pagos por un total de {formatCurrency(resultado.montoTotal ?? 0)}
                  </p>
                </div>
              ) : (
                <div className="text-red-600">
                  <p className="font-medium">❌ Error en la generación</p>
                  <p>{resultado.mensaje}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Lista de clientes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Clientes para Generación -{" "}
                {new Date(mesGeneracion + "-01").toLocaleDateString("es-PE", { year: "numeric", month: "long" })}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={toggleTodos} disabled={loading}>
                  {clientes.every((c) => c.seleccionado) ? "Deseleccionar Todos" : "Seleccionar Todos"}
                </Button>
                <Button onClick={generarPagos} disabled={generando || clientesSeleccionados.length === 0}>
                  <Play className="h-4 w-4 mr-2" />
                  {generando ? "Generando..." : `Generar ${clientesSeleccionados.length} Pagos`}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Cargando clientes...</div>
            ) : clientes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay clientes disponibles para generar pagos automáticos en este mes
              </div>
            ) : (
              <div className="space-y-4">
                {clientes.map((cliente) => (
                  <div key={cliente.IdCliente} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={cliente.seleccionado}
                        onCheckedChange={() => toggleCliente(cliente.IdCliente)}
                      />
                      <div>
                        <div className="font-medium">{cliente.RazonSocial}</div>
                        <div className="text-sm text-gray-500">
                          {cliente.MesesSinPago > 0 ? (
                            <span className="text-orange-600">{cliente.MesesSinPago} meses sin pago</span>
                          ) : (
                            <span className="text-green-600">
                              Último pago:{" "}
                              {cliente.UltimoPago
                                ? new Date(cliente.UltimoPago).toLocaleDateString("es-PE")
                                : "Sin pagos"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">{formatCurrency(cliente.MontoFijoMensual)}</div>
                      <div className="text-sm text-gray-500">Monto mensual</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
