"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Download, FileSpreadsheet, TrendingUp } from "lucide-react"
import Link from "next/link"

interface ClienteProyeccion {
  concepto: string
  codigoCliente: string
  fechaInicio: string
  fechaCorte: string
  saldoAnterior: number
  importeServicio: number
  importeVariable: number
  importeAcumulado: number
  tipoComprobante: string
  medioDoc: string
  variableDescripcion: string
  fechaConsulta: string
  fechaPago: string
  estadoDeuda: string
  mesesProyectados: Record<string, number>
}

const mesesAbreviados = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"]

const mesesCompletos = [
  "ENERO",
  "FEBRERO",
  "MARZO",
  "ABRIL",
  "MAYO",
  "JUNIO",
  "JULIO",
  "AGOSTO",
  "SEPTIEMBRE",
  "OCTUBRE",
  "NOVIEMBRE",
  "DICIEMBRE",
]

export default function IngresoCajaFijaProyectadoPage() {
  const [anoSeleccionado, setAnoSeleccionado] = useState(new Date().getFullYear().toString())
  const [datos, setDatos] = useState<ClienteProyeccion[]>([])
  const [totalesPorMes, setTotalesPorMes] = useState<Record<string, number>>({})
  const [resumenIngresos, setResumenIngresos] = useState<{ mes: string; total: number }[]>([])
  const [loading, setLoading] = useState(true)

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/reportes/ingreso-caja-fija-proyectado?año=${anoSeleccionado}`)
      if (response.ok) {
        const result = await response.json()
        setDatos(result.datos)
        setTotalesPorMes(result.totalesPorMes)
        setResumenIngresos(result.resumenIngresos)
      }
    } catch (error) {
      console.error("Error cargando datos:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [anoSeleccionado])

  const totalAnual = Object.values(totalesPorMes).reduce((sum, val) => sum + val, 0)

  // Función para obtener el color de fondo según el estado de deuda
  const obtenerColorFondo = (estadoDeuda: string, mes: string, valor: number) => {
    if (valor <= 0) return ""

    switch (estadoDeuda) {
      case "AL_DIA":
        return "bg-green-200"
      case "UN_MES":
        return "bg-orange-200"
      case "DOS_MESES":
        return "bg-yellow-200"
      case "TRES_MAS_MESES":
        return "bg-red-200"
      default:
        return "bg-blue-200"
    }
  }

  const exportarExcel = async () => {
    try {
      const response = await fetch("/api/reportes/ingreso-caja-fija-proyectado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datos,
          ano: anoSeleccionado,
          totalesPorMes,
          resumenIngresos,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `ingreso-caja-fija-proyectado-${anoSeleccionado}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error al exportar:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando reporte...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link href="/reportes">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Reportes
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Ingreso de Caja Fija Proyectado</h1>
                <p className="text-gray-600 mt-1">Proyección de ingresos fijos por cliente</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Select value={anoSeleccionado} onValueChange={setAnoSeleccionado}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportarExcel} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-600">S/ {totalAnual.toLocaleString("es-PE")}</div>
              <p className="text-sm text-gray-600">Total Proyectado {anoSeleccionado}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">{datos.length}</div>
              <p className="text-sm text-gray-600">Clientes Activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-purple-600">
                S/ {Math.round(totalAnual / 12).toLocaleString("es-PE")}
              </div>
              <p className="text-sm text-gray-600">Promedio Mensual</p>
            </CardContent>
          </Card>
        </div>

        {/* Reporte Principal */}
        <Card className="mb-6">
          <CardHeader className="bg-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-6 w-6" />
                <div>
                  <CardTitle className="text-xl">J&D CONSULTORES DE NEGOCIOS</CardTitle>
                  <p className="text-blue-100">INGRESO DE CAJA FIJA PROYECTADO</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-blue-100">Año: {anoSeleccionado}</p>
                <p className="text-blue-100">Generado: {new Date().toLocaleDateString("es-PE")}</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="border font-bold text-center min-w-[120px]">CONCEPTO</TableHead>
                    <TableHead className="border font-bold text-center min-w-[80px]">CODIGO CLIENTE</TableHead>
                    <TableHead className="border font-bold text-center min-w-[100px]">FECHA INICIO</TableHead>
                    <TableHead className="border font-bold text-center min-w-[80px]">FECHA CORTE</TableHead>
                    <TableHead className="border font-bold text-center min-w-[100px]">SALDO ANTERIOR</TableHead>
                    <TableHead className="border font-bold text-center min-w-[100px]">IMPORTE SERVICIO</TableHead>
                    <TableHead className="border font-bold text-center min-w-[100px]">IMPORTE VARIABLE</TableHead>
                    <TableHead className="border font-bold text-center min-w-[100px]">IMPORTE ACUMULADO</TableHead>
                    <TableHead className="border font-bold text-center min-w-[80px]">TIPO COMPROBANTE</TableHead>
                    <TableHead className="border font-bold text-center min-w-[80px]">MEDIO DOC</TableHead>
                    <TableHead className="border font-bold text-center min-w-[120px]">VARIABLE DESCRIPCION</TableHead>
                    <TableHead className="border font-bold text-center min-w-[100px]">FECHA CONSULTA</TableHead>
                    <TableHead className="border font-bold text-center min-w-[100px]">FECHA PAGO</TableHead>

                    {/* Columnas de meses */}
                    {mesesAbreviados.map((mes) => (
                      <TableHead key={mes} className="border font-bold text-center min-w-[100px] bg-blue-200">
                        {mes}-{anoSeleccionado.slice(-2)}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datos.map((cliente, index) => (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell className="border font-medium">{cliente.concepto}</TableCell>
                      <TableCell className="border text-center">{cliente.codigoCliente}</TableCell>
                      <TableCell className="border text-center">{cliente.fechaInicio}</TableCell>
                      <TableCell className="border text-center">{cliente.fechaCorte}</TableCell>
                      <TableCell className="border text-right">
                        {cliente.saldoAnterior.toLocaleString("es-PE")}
                      </TableCell>
                      <TableCell className="border text-right">
                        {cliente.importeServicio.toLocaleString("es-PE")}
                      </TableCell>
                      <TableCell className="border text-right">
                        {cliente.importeVariable.toLocaleString("es-PE")}
                      </TableCell>
                      <TableCell className="border text-right">
                        {cliente.importeAcumulado.toLocaleString("es-PE")}
                      </TableCell>
                      <TableCell className="border text-center">{cliente.tipoComprobante}</TableCell>
                      <TableCell className="border text-center">{cliente.medioDoc}</TableCell>
                      <TableCell className="border">{cliente.variableDescripcion}</TableCell>
                      <TableCell className="border text-center">{cliente.fechaConsulta}</TableCell>
                      <TableCell className="border text-center">{cliente.fechaPago}</TableCell>

                      {/* Columnas de meses con valores */}
                      {mesesAbreviados.map((mes) => {
                        const claveMes = `${mes}-${anoSeleccionado.slice(-2)}`
                        const valor = cliente.mesesProyectados[claveMes] || 0
                        return (
                          <TableCell
                            key={mes}
                            className={`border text-right ${obtenerColorFondo(cliente.estadoDeuda, claveMes, valor)}`}
                          >
                            {valor > 0 ? valor.toLocaleString("es-PE") : "0.00"}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}

                  {/* Fila de totales */}
                  <TableRow className="bg-blue-600 text-white font-bold">
                    <TableCell className="border text-center" colSpan={13}>
                      TOTAL CLIENTES FIJOS
                    </TableCell>
                    {mesesAbreviados.map((mes) => {
                      const claveMes = `${mes}-${anoSeleccionado.slice(-2)}`
                      return (
                        <TableCell key={mes} className="border text-right">
                          {totalesPorMes[claveMes]?.toLocaleString("es-PE") || "0.00"}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Resumen de Ingresos del Mes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Resumen Ingresos del Mes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="border font-bold">MES</TableHead>
                    <TableHead className="border font-bold text-right">TOTAL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resumenIngresos.map((item, index) => (
                    <TableRow key={index} className={item.total > 0 ? "bg-green-50" : ""}>
                      <TableCell className="border font-medium">{item.mes}</TableCell>
                      <TableCell className="border text-right font-medium">
                        {item.total.toLocaleString("es-PE")}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-blue-600 text-white font-bold">
                    <TableCell className="border">TOTAL ANUAL</TableCell>
                    <TableCell className="border text-right">{totalAnual.toLocaleString("es-PE")}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Leyenda */}
          <Card>
            <CardHeader>
              <CardTitle>Leyenda según Deuda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-200 border rounded"></div>
                  <span className="text-sm">AL DÍA</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-orange-200 border rounded"></div>
                  <span className="text-sm">DEBE UN MES</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-yellow-200 border rounded"></div>
                  <span className="text-sm">DEBE DOS MESES</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-red-200 border rounded"></div>
                  <span className="text-sm">DEBE TRES A MÁS MESES</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
