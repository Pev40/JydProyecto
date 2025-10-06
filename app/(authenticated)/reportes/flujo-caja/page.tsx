"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Download, BarChart3, TrendingUp, Calendar, RefreshCw } from "lucide-react"
import Link from "next/link"

interface ReporteItem {
  categoria: string
  cantidadClientes: number
  totalPagado: number
  saldoPendiente: number
  porcentajeCobranza: number
  promedioPorCliente: number
}

export default function FlujoCajaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [tipo, setTipo] = useState(searchParams.get("tipo") || "digito")
  const [periodo, setPeriodo] = useState(searchParams.get("periodo") || "mes")
  const [año, setAño] = useState(searchParams.get("año") ? Number.parseInt(searchParams.get("año")!) : new Date().getFullYear())
  const [mes, setMes] = useState(searchParams.get("mes") ? Number.parseInt(searchParams.get("mes")!) : new Date().getMonth() + 1)
  
  const [reporteData, setReporteData] = useState<ReporteItem[]>([])
  const [loading, setLoading] = useState(true)

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        tipo,
        periodo,
        ...(periodo === "mes" && { año: año.toString(), mes: mes.toString() })
      })

      const response = await fetch(`/api/reportes/flujo-caja?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setReporteData(data.reporteData)
      }
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [tipo, periodo, año, mes])

  const aplicarFiltros = () => {
    const params = new URLSearchParams({
      tipo,
      periodo,
      ...(periodo === "mes" && { año: año.toString(), mes: mes.toString() })
    })
    router.push(`/reportes/flujo-caja?${params}`)
  }

  const totalClientes = reporteData.reduce((sum, item) => sum + item.cantidadClientes, 0)
  const totalPagado = reporteData.reduce((sum, item) => sum + item.totalPagado, 0)
  const totalSaldoPendiente = reporteData.reduce((sum, item) => sum + item.saldoPendiente, 0)
  const totalEsperado = totalPagado + totalSaldoPendiente
  const porcentajeCobranzaGeneral = totalEsperado > 0 ? (totalPagado / totalEsperado) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/reportes">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a Reportes
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Flujo de Caja</h1>
                <p className="text-sm text-gray-600">
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Análisis</label>
                <Select value={tipo} onValueChange={setTipo}>
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
                <Select value={periodo} onValueChange={setPeriodo}>
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
              {periodo === "mes" && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Mes</label>
                    <Select value={mes.toString()} onValueChange={(value) => setMes(Number.parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Enero</SelectItem>
                        <SelectItem value="2">Febrero</SelectItem>
                        <SelectItem value="3">Marzo</SelectItem>
                        <SelectItem value="4">Abril</SelectItem>
                        <SelectItem value="5">Mayo</SelectItem>
                        <SelectItem value="6">Junio</SelectItem>
                        <SelectItem value="7">Julio</SelectItem>
                        <SelectItem value="8">Agosto</SelectItem>
                        <SelectItem value="9">Septiembre</SelectItem>
                        <SelectItem value="10">Octubre</SelectItem>
                        <SelectItem value="11">Noviembre</SelectItem>
                        <SelectItem value="12">Diciembre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Año</label>
                    <Select value={año.toString()} onValueChange={(value) => setAño(Number.parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2023">2023</SelectItem>
                        <SelectItem value="2022">2022</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <div className="flex items-end">
                <Button className="w-full" onClick={aplicarFiltros}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Aplicar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{totalClientes}</p>
                  <p className="text-xs text-muted-foreground">Total Clientes</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    S/ {totalPagado.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Pagado</p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-orange-600">
                    S/ {totalSaldoPendiente.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground">Saldo Pendiente</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {porcentajeCobranzaGeneral.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Tasa de cobranza</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de resultados */}
        <Card>
          <CardHeader>
            <CardTitle>Flujo de Caja por {tipo === "digito" ? "Dígito RUC" : "Cartera"}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span>Cargando datos...</span>
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}