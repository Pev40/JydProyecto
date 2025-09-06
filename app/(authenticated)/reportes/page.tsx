import { getDashboardStats, getClientes, getPagos } from "@/lib/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Download,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  FileSpreadsheet,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"

export default async function ReportesPage() {
  const [stats, clientes, pagos] = await Promise.all([getDashboardStats(), getClientes(), getPagos()])
  const reporteData = [
    { mes: "Enero", totalMes: 1000 },
    { mes: "Febrero", totalMes: 1500 },
    { mes: "Marzo", totalMes: 2000 },
    { mes: "Abril", totalMes: 2500 },
    { mes: "Mayo", totalMes: 3000 },
    { mes: "Junio", totalMes: 3500 },
  ]

  // Análisis por clasificación
  const clientesPorClasificacion = {
    A: clientes.filter((c) => c.ClasificacionCodigo === "A"),
    B: clientes.filter((c) => c.ClasificacionCodigo === "B"),
    C: clientes.filter((c) => c.ClasificacionCodigo === "C"),
  }

  // Análisis de pagos por mes
  const pagosPorMes = pagos.reduce(
    (acc, pago) => {
      const mes = new Date(pago.Fecha).toLocaleDateString("es-PE", { year: "numeric", month: "long" })
      if (!acc[mes]) {
        acc[mes] = { cantidad: 0, monto: 0 }
      }
      acc[mes].cantidad += 1
      acc[mes].monto += Number(pago.Monto)
      return acc
    },
    {} as Record<string, { cantidad: number; monto: number }>,
  )

  // Top clientes por monto pagado
  const clientesPorMonto = clientes
    .map((cliente) => {
      const pagosCliente = pagos.filter((p) => p.IdCliente === cliente.IdCliente)
      const totalPagado = pagosCliente.reduce((sum, p) => sum + Number(p.Monto), 0)
      return { ...cliente, totalPagado }
    })
    .sort((a, b) => b.totalPagado - a.totalPagado)
    .slice(0, 10)

  const reportesDisponibles = [
    {
      titulo: "Reporte Consolidado",
      descripcion: "Vista completa del estado de todos los clientes",
      href: "/reportes/consolidado",
      icon: FileSpreadsheet,
      color: "blue",
      stats: `${clientes.length} clientes`,
    },
    {
      titulo: "Flujo de Caja",
      descripcion: "Análisis de ingresos por dígito RUC y cartera",
      href: "/reportes/flujo-caja",
      icon: TrendingUp,
      color: "green",
      stats: `S/ ${pagos.reduce((sum, p) => sum + Number(p.Monto), 0).toLocaleString("es-PE")}`,
    },
    {
      titulo: "Análisis de Morosidad",
      descripcion: "Evaluación del comportamiento de pago",
      href: "/reportes/morosidad",
      icon: AlertTriangle,
      color: "red",
      stats: `${stats.clientes.morosos} clientes morosos`,
    },
    {
      titulo: "Ingreso de Caja Variable",
      descripcion: "Reporte detallado mensual de ingresos por servicios",
      href: "/reportes/ingreso-caja-variable",
      icon: FileSpreadsheet,
      color: "emerald",
      stats: `${reporteData.reduce((sum, mes) => sum + mes.totalMes, 0).toLocaleString("es-PE")} ingresos`,
    },
    {
      titulo: "Ingreso de Caja Fija Proyectado",
      descripcion: "Proyección horizontal de ingresos fijos por cliente",
      href: "/reportes/ingreso-caja-fija-proyectado",
      icon: TrendingUp,
      color: "indigo",
      stats: `Proyección ${new Date().getFullYear() + 1}`,
    },
    {
      titulo: "Gestión de Comprobantes",
      descripcion: "Administración de comprobantes de pago",
      href: "/comprobantes",
      icon: FileSpreadsheet,
      color: "purple",
      stats: `${pagos.filter((p) => p.UrlComprobante).length} con comprobante`,
    },
    {
      titulo: "Generación de Recibos",
      descripcion: "Crear recibos personalizados para clientes",
      href: "/recibos",
      icon: FileSpreadsheet,
      color: "indigo",
      stats: `${pagos.filter((p) => p.Estado === "CONFIRMADO").length} listos`,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
                <h1 className="text-3xl font-bold text-gray-900">Reportes y Análisis</h1>
                <p className="text-gray-600 mt-1">Análisis detallado de cobranza y pagos</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar Todo
              </Button>
              <Button>
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard Ejecutivo
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Resumen General */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clientes.length}</div>
              <p className="text-xs text-muted-foreground">Clientes registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                S/{" "}
                {pagos
                  .reduce((sum, p) => sum + Number(p.Monto), 0)
                  .toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">{pagos.length} pagos registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Cobranza</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {clientes.length > 0 ? Math.round((stats.clientes.al_dia / clientes.length) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Clientes al día</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Riesgo de Cartera</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {clientes.length > 0 ? Math.round((stats.clientes.morosos / clientes.length) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Clientes morosos</p>
            </CardContent>
          </Card>
        </div>

        {/* Reportes Disponibles */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Reportes Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reportesDisponibles.map((reporte, index) => (
                <Link key={index} href={reporte.href}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-${reporte.color}-100`}>
                          <reporte.icon className={`h-5 w-5 text-${reporte.color}-600`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{reporte.titulo}</CardTitle>
                          <p className="text-sm text-gray-600">{reporte.descripcion}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-500">{reporte.stats}</span>
                        <Button size="sm" variant="outline">
                          Ver Reporte
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Acciones Rápidas de Exportación */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Exportación Rápida</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent">
                <FileSpreadsheet className="h-6 w-6 text-green-600" />
                <div className="text-center">
                  <div className="font-medium">Clientes Excel</div>
                  <div className="text-xs text-gray-500">Lista completa</div>
                </div>
              </Button>

              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent">
                <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                <div className="text-center">
                  <div className="font-medium">Pagos Excel</div>
                  <div className="text-xs text-gray-500">Historial completo</div>
                </div>
              </Button>

              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <div className="text-center">
                  <div className="font-medium">Morosos Excel</div>
                  <div className="text-xs text-gray-500">Solo clasificación C</div>
                </div>
              </Button>

              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent">
                <TrendingUp className="h-6 w-6 text-purple-600" />
                <div className="text-center">
                  <div className="font-medium">Flujo de Caja</div>
                  <div className="text-xs text-gray-500">Por período</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Análisis por Clasificación */}
          <Card>
            <CardHeader>
              <CardTitle>Análisis por Clasificación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(clientesPorClasificacion).map(([clasificacion, clientesClasif]) => {
                  const totalSaldo = clientesClasif.reduce((sum, c) => sum + (c.SaldoPendiente || 0), 0)
                  const porcentaje = clientes.length > 0 ? (clientesClasif.length / clientes.length) * 100 : 0

                  return (
                    <div key={clasificacion} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="secondary"
                          className={
                            clasificacion === "A"
                              ? "bg-green-100 text-green-800"
                              : clasificacion === "B"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-red-100 text-red-800"
                          }
                        >
                          {clasificacion}
                        </Badge>
                        <div>
                          <div className="font-medium">{clientesClasif.length} clientes</div>
                          <div className="text-sm text-gray-500">{porcentaje.toFixed(1)}% del total</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          S/ {totalSaldo.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-sm text-gray-500">Saldo pendiente</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Pagos por Mes */}
          <Card>
            <CardHeader>
              <CardTitle>Ingresos por Mes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(pagosPorMes)
                  .slice(-6)
                  .map(([mes, datos]) => (
                    <div key={mes} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{mes}</div>
                        <div className="text-sm text-gray-500">{datos.cantidad} pagos</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          S/ {datos.monto.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Clientes */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Top 10 Clientes por Monto Pagado</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Posición</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Clasificación</TableHead>
                  <TableHead>Total Pagado</TableHead>
                  <TableHead>Saldo Pendiente</TableHead>
                  <TableHead>% Cumplimiento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientesPorMonto.map((cliente, index) => {
                  const totalEsperado = cliente.totalPagado + (cliente.SaldoPendiente || 0)
                  const cumplimiento = totalEsperado > 0 ? (cliente.totalPagado / totalEsperado) * 100 : 0

                  return (
                    <TableRow key={cliente.IdCliente}>
                      <TableCell className="font-medium">#{index + 1}</TableCell>
                      <TableCell>
                        <Link href={`/clientes/${cliente.IdCliente}`} className="text-blue-600 hover:text-blue-800">
                          {cliente.RazonSocial}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            cliente.ClasificacionCodigo === "A"
                              ? "bg-green-100 text-green-800"
                              : cliente.ClasificacionCodigo === "B"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-red-100 text-red-800"
                          }
                        >
                          {cliente.ClasificacionCodigo}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        S/ {cliente.totalPagado.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className={cliente.SaldoPendiente && cliente.SaldoPendiente > 0 ? "text-red-600" : ""}>
                        S/ {(cliente.SaldoPendiente || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                cumplimiento >= 80
                                  ? "bg-green-500"
                                  : cumplimiento >= 50
                                    ? "bg-orange-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${Math.min(cumplimiento, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm">{cumplimiento.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
