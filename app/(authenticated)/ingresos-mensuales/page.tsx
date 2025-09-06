"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, TrendingUp, DollarSign, Calendar, Users } from "lucide-react"
import Link from "next/link"

interface IngresoMensual {
  mes: string
  ingresos: number
  pagos_count: number
  clientes_activos: number
  promedio_por_cliente: number
}

interface LedgerCliente {
  IdCliente: number
  RazonSocial: string
  MontoFijoMensual: number
  TotalPagado: number
  SaldoPendiente: number
  UltimoPago: string | null
  MesesDeuda: number
}

export default function IngresosMensualesPage() {
  const [ingresosMensuales, setIngresosMensuales] = useState<IngresoMensual[]>([])
  const [ledgerClientes, setLedgerClientes] = useState<LedgerCliente[]>([])
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().toISOString().slice(0, 7))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [mesSeleccionado])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const [ingresosRes, ledgerRes] = await Promise.all([
        fetch("/api/ingresos-mensuales"),
        fetch(`/api/ingresos-mensuales/ledger?mes=${mesSeleccionado}`),
      ])

      const ingresos = await ingresosRes.json()
      const ledger = await ledgerRes.json()

      setIngresosMensuales(ingresos)
      setLedgerClientes(ledger)
    } catch (error) {
      console.error("Error cargando datos:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(amount)
  }

  const mesActual = ingresosMensuales.find((i) => i.mes === mesSeleccionado)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Ingresos Mensuales</h1>
                <p className="text-gray-600 mt-1">Análisis de ingresos y ledger de clientes</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Input
                type="month"
                value={mesSeleccionado}
                onChange={(e) => setMesSeleccionado(e.target.value)}
                className="w-40"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Métricas del mes seleccionado */}
        {mesActual && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ingresos del Mes</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(mesActual.ingresos)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pagos Recibidos</p>
                    <p className="text-2xl font-bold text-blue-600">{mesActual.pagos_count}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Clientes Activos</p>
                    <p className="text-2xl font-bold text-purple-600">{mesActual.clientes_activos}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Promedio por Cliente</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(mesActual.promedio_por_cliente)}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Histórico de ingresos */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Histórico de Ingresos (Últimos 12 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ingresosMensuales.map((ingreso) => (
                <div key={ingreso.mes} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="font-medium">
                      {new Date(ingreso.mes + "-01").toLocaleDateString("es-PE", {
                        year: "numeric",
                        month: "long",
                      })}
                    </div>
                    <div className="text-sm text-gray-500">
                      {ingreso.pagos_count} pagos • {ingreso.clientes_activos} clientes
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">{formatCurrency(ingreso.ingresos)}</div>
                    <div className="text-sm text-gray-500">
                      Promedio: {formatCurrency(ingreso.promedio_por_cliente)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ledger de clientes */}
        <Card>
          <CardHeader>
            <CardTitle>
              Ledger de Clientes -{" "}
              {new Date(mesSeleccionado + "-01").toLocaleDateString("es-PE", { year: "numeric", month: "long" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Cliente</th>
                    <th className="text-right p-2">Monto Mensual</th>
                    <th className="text-right p-2">Total Pagado</th>
                    <th className="text-right p-2">Saldo Pendiente</th>
                    <th className="text-center p-2">Meses Deuda</th>
                    <th className="text-center p-2">Último Pago</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerClientes.map((cliente) => (
                    <tr key={cliente.IdCliente} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <Link href={`/clientes/${cliente.IdCliente}`} className="text-blue-600 hover:underline">
                          {cliente.RazonSocial}
                        </Link>
                      </td>
                      <td className="text-right p-2">{formatCurrency(cliente.MontoFijoMensual)}</td>
                      <td className="text-right p-2 text-green-600">{formatCurrency(cliente.TotalPagado)}</td>
                      <td className="text-right p-2">
                        <span className={cliente.SaldoPendiente > 0 ? "text-red-600" : "text-green-600"}>
                          {formatCurrency(cliente.SaldoPendiente)}
                        </span>
                      </td>
                      <td className="text-center p-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            cliente.MesesDeuda === 0
                              ? "bg-green-100 text-green-800"
                              : cliente.MesesDeuda <= 2
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {cliente.MesesDeuda}
                        </span>
                      </td>
                      <td className="text-center p-2 text-sm">
                        {cliente.UltimoPago ? new Date(cliente.UltimoPago).toLocaleDateString("es-PE") : "Sin pagos"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
