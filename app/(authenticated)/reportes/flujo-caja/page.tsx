import { getClientes, getPagos, getCatalogos } from "@/lib/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Download, BarChart3, TrendingUp, Calendar } from "lucide-react"
import Link from "next/link"

interface PageProps {
  searchParams: {
    tipo?: string
    periodo?: string
    digito?: string
    cartera?: string
  }
}

export default async function FlujoCajaPage({ searchParams }: PageProps) {
  const [clientes, pagos, catalogos] = await Promise.all([getClientes(), getPagos(), getCatalogos()])

  const tipo = searchParams.tipo || "digito"
  const periodo = searchParams.periodo || "mes"

  // Generar reporte según el tipo seleccionado
  let reporteData: any[] = []

  if (tipo === "digito") {
    // Flujo de caja por dígito RUC
    reporteData = generarReportePorDigito(clientes, pagos)
  } else if (tipo === "cartera") {
    // Flujo de caja por cartera
    reporteData = generarReportePorCartera(clientes, pagos, catalogos.carteras)
  }

  const totalIngresos = reporteData.reduce((sum, item) => sum + item.totalPagado, 0)
  const totalPendiente = reporteData.reduce((sum, item) => sum + item.saldoPendiente, 0)

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
                <h1 className="text-3xl font-bold text-gray-900">Flujo de Caja</h1>
                <p className="text-gray-600 mt-1">
                  Análisis de ingresos por {tipo === "digito" ? "dígito RUC" : "cartera"}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Ver Gráfico
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros de Reporte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Análisis</label>
                <Select value={tipo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="digito">Por Dígito RUC</SelectItem>
                    <SelectItem value="cartera">Por Cartera</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Período</label>
                <Select value={periodo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mes">Este Mes</SelectItem>
                    <SelectItem value="trimestre">Este Trimestre</SelectItem>
                    <SelectItem value="año">Este Año</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  Aplicar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ingresos</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                S/ {totalIngresos.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Pagos confirmados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Pendiente</CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                S/ {totalPendiente.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Por cobrar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eficiencia de Cobranza</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {totalIngresos + totalPendiente > 0
                  ? Math.round((totalIngresos / (totalIngresos + totalPendiente)) * 100)
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">Tasa de cobranza</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de resultados */}
        <Card>
          <CardHeader>
            <CardTitle>Flujo de Caja por {tipo === "digito" ? "Dígito RUC" : "Cartera"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tipo === "digito" ? "Dígito RUC" : "Cartera"}</TableHead>
                  <TableHead>Clientes</TableHead>
                  <TableHead>Total Pagado</TableHead>
                  <TableHead>Saldo Pendiente</TableHead>
                  <TableHead>% Cobranza</TableHead>
                  <TableHead>Promedio por Cliente</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reporteData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.categoria}</TableCell>
                    <TableCell>{item.cantidadClientes}</TableCell>
                    <TableCell className="text-green-600 font-medium">
                      S/ {item.totalPagado.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-orange-600 font-medium">
                      S/ {item.saldoPendiente.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              item.porcentajeCobranza >= 80
                                ? "bg-green-500"
                                : item.porcentajeCobranza >= 50
                                  ? "bg-orange-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${Math.min(item.porcentajeCobranza, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm">{item.porcentajeCobranza.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      S/ {item.promedioPorCliente.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
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

function generarReportePorDigito(clientes: any[], pagos: any[]) {
  const reporte = []

  for (let digito = 0; digito <= 9; digito++) {
    const clientesDigito = clientes.filter((c) => c.UltimoDigitoRUC === digito)
    const pagosDigito = pagos.filter((p) => clientesDigito.some((c) => c.IdCliente === p.IdCliente))

    const totalPagado = pagosDigito.reduce((sum, p) => sum + Number(p.Monto), 0)
    const saldoPendiente = clientesDigito.reduce((sum, c) => sum + (c.SaldoPendiente || 0), 0)
    const totalEsperado = totalPagado + saldoPendiente
    const porcentajeCobranza = totalEsperado > 0 ? (totalPagado / totalEsperado) * 100 : 0
    const promedioPorCliente = clientesDigito.length > 0 ? totalPagado / clientesDigito.length : 0

    reporte.push({
      categoria: digito.toString(),
      cantidadClientes: clientesDigito.length,
      totalPagado,
      saldoPendiente,
      porcentajeCobranza,
      promedioPorCliente,
    })
  }

  return reporte.sort((a, b) => b.totalPagado - a.totalPagado)
}

function generarReportePorCartera(clientes: any[], pagos: any[], carteras: any[]) {
  const reporte = []

  for (const cartera of carteras) {
    const clientesCartera = clientes.filter((c) => c.IdCartera === cartera.IdCartera)
    const pagosCartera = pagos.filter((p) => clientesCartera.some((c) => c.IdCliente === p.IdCliente))

    const totalPagado = pagosCartera.reduce((sum, p) => sum + Number(p.Monto), 0)
    const saldoPendiente = clientesCartera.reduce((sum, c) => sum + (c.SaldoPendiente || 0), 0)
    const totalEsperado = totalPagado + saldoPendiente
    const porcentajeCobranza = totalEsperado > 0 ? (totalPagado / totalEsperado) * 100 : 0
    const promedioPorCliente = clientesCartera.length > 0 ? totalPagado / clientesCartera.length : 0

    reporte.push({
      categoria: cartera.Nombre,
      cantidadClientes: clientesCartera.length,
      totalPagado,
      saldoPendiente,
      porcentajeCobranza,
      promedioPorCliente,
    })
  }

  return reporte.sort((a, b) => b.totalPagado - a.totalPagado)
}
