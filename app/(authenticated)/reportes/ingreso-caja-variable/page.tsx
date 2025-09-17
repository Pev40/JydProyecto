"use client"

import React from "react"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Download, FileSpreadsheet, Filter } from "lucide-react"
import Link from "next/link"

interface DatoCajaVariable {
  mes: string
  cliente: string
  fecha: string
  detalleServicio: string
  numeroRecibo: string
  medio: string
  banco: string
  devengado: number
  pagado: number
  saldoPendiente: number
  observaciones: string
  estado: string
}

interface Totales {
  devengado: number
  pagado: number
  saldoPendiente: number
}

export default function IngresoCajaVariablePage() {
  const [anoSeleccionado, setAnoSeleccionado] = useState(new Date().getFullYear().toString())
  const [mesSeleccionado, setMesSeleccionado] = useState("0")
  const [clienteFiltro, setClienteFiltro] = useState("")
  const [datos, setDatos] = useState<Record<string, DatoCajaVariable[]>>({})
  const [totales, setTotales] = useState<Totales>({ devengado: 0, pagado: 0, saldoPendiente: 0 })
  const [loading, setLoading] = useState(true)

  const meses = [
    { valor: "0", nombre: "Todos los meses" },
    { valor: "1", nombre: "Enero" },
    { valor: "2", nombre: "Febrero" },
    { valor: "3", nombre: "Marzo" },
    { valor: "4", nombre: "Abril" },
    { valor: "5", nombre: "Mayo" },
    { valor: "6", nombre: "Junio" },
    { valor: "7", nombre: "Julio" },
    { valor: "8", nombre: "Agosto" },
    { valor: "9", nombre: "Septiembre" },
    { valor: "10", nombre: "Octubre" },
    { valor: "11", nombre: "Noviembre" },
    { valor: "12", nombre: "Diciembre" },
  ]

  const cargarDatos = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        año: anoSeleccionado,
        ...(mesSeleccionado && mesSeleccionado !== "0" && { mes: mesSeleccionado }),
        ...(clienteFiltro && { cliente: clienteFiltro }),
      })

      const response = await fetch(`/api/reportes/ingreso-caja-variable?${params}`)
      if (response.ok) {
        const result = await response.json()
        setDatos(result.datos)
        setTotales(result.totales)
      }
    } catch (error) {
      console.error("Error cargando datos:", error)
    } finally {
      setLoading(false)
    }
  }, [anoSeleccionado, mesSeleccionado, clienteFiltro])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const exportarExcel = async () => {
    try {
      const response = await fetch("/api/reportes/ingreso-caja-variable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datos,
          totales,
          filtros: { 
            año: anoSeleccionado, 
            mes: mesSeleccionado === "0" ? "" : mesSeleccionado, 
            cliente: clienteFiltro 
          },
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `ingreso-caja-variable-${anoSeleccionado}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error al exportar:", error)
    }
  }

  const obtenerColorFondo = (estado: string) => {
    switch (estado) {
      case "COMPLETADO":
        return "bg-green-50"
      case "PENDIENTE":
        return "bg-yellow-50"
      case "PARCIAL":
        return "bg-orange-50"
      default:
        return ""
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

  const mesesOrdenados = [
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

  const mesesConDatos = mesesOrdenados.filter((mes) => datos[mes] && datos[mes].length > 0)

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
                  Reportes
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Ingreso de Caja Variable</h1>
                <p className="text-gray-600 mt-1">Reporte detallado de ingresos variables por mes</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={exportarExcel} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Año</label>
                <Select value={anoSeleccionado} onValueChange={setAnoSeleccionado}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Mes</label>
                <Select value={mesSeleccionado} onValueChange={setMesSeleccionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {meses.map((mes) => (
                      <SelectItem key={mes.valor} value={mes.valor}>
                        {mes.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Cliente</label>
                <Input
                  placeholder="Buscar cliente..."
                  value={clienteFiltro}
                  onChange={(e) => setClienteFiltro(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button onClick={cargarDatos} className="w-full">
                  Aplicar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-600">S/ {totales.devengado.toLocaleString("es-PE")}</div>
              <p className="text-sm text-gray-600">Total Devengado</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">S/ {totales.pagado.toLocaleString("es-PE")}</div>
              <p className="text-sm text-gray-600">Total Pagado</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-red-600">S/ {totales.saldoPendiente.toLocaleString("es-PE")}</div>
              <p className="text-sm text-gray-600">Saldo Pendiente</p>
            </CardContent>
          </Card>
        </div>

        {/* Reporte Principal */}
        <Card>
          <CardHeader className="bg-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-6 w-6" />
                <div>
                  <CardTitle className="text-xl">J&D CONSULTORES DE NEGOCIOS</CardTitle>
                  <p className="text-blue-100">INGRESO DE CAJA VARIABLE</p>
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
                    <TableHead className="border font-bold text-center">MES</TableHead>
                    <TableHead className="border font-bold text-center">CLIENTE</TableHead>
                    <TableHead className="border font-bold text-center">FECHA</TableHead>
                    <TableHead className="border font-bold text-center">DETALLE DEL SERVICIO</TableHead>
                    <TableHead className="border font-bold text-center">NRO RECIBO</TableHead>
                    <TableHead className="border font-bold text-center">MEDIO</TableHead>
                    <TableHead className="border font-bold text-center">BANCO</TableHead>
                    <TableHead className="border font-bold text-center bg-yellow-200">DEVENGADO</TableHead>
                    <TableHead className="border font-bold text-center bg-yellow-200">PAGADO</TableHead>
                    <TableHead className="border font-bold text-center bg-yellow-200">SALDO PENDIENTE</TableHead>
                    <TableHead className="border font-bold text-center">OBSERVACIÓN</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mesesConDatos.map((mes) => (
                    <React.Fragment key={mes}>
                      {/* Encabezado del mes */}
                      <TableRow className="bg-blue-100">
                        <TableCell colSpan={11} className="border font-bold text-center py-3">
                          {mes}
                        </TableCell>
                      </TableRow>

                      {/* Datos del mes */}
                      {datos[mes].map((item, index) => (
                        <TableRow
                          key={`${mes}-${index}`}
                          className={`hover:bg-gray-50 ${obtenerColorFondo(item.estado)}`}
                        >
                          <TableCell className="border text-center">{mes}</TableCell>
                          <TableCell className="border">{item.cliente}</TableCell>
                          <TableCell className="border text-center">{item.fecha}</TableCell>
                          <TableCell className="border">{item.detalleServicio}</TableCell>
                          <TableCell className="border text-center">{item.numeroRecibo}</TableCell>
                          <TableCell className="border text-center">{item.medio}</TableCell>
                          <TableCell className="border text-center">{item.banco}</TableCell>
                          <TableCell className="border text-right bg-yellow-50">
                            {item.devengado.toLocaleString("es-PE")}
                          </TableCell>
                          <TableCell className="border text-right bg-yellow-50">
                            {item.pagado.toLocaleString("es-PE")}
                          </TableCell>
                          <TableCell className="border text-right bg-yellow-50">
                            {item.saldoPendiente.toLocaleString("es-PE")}
                          </TableCell>
                          <TableCell className="border">{item.observaciones}</TableCell>
                        </TableRow>
                      ))}

                      {/* Subtotal del mes */}
                      <TableRow className="bg-gray-200 font-semibold">
                        <TableCell colSpan={7} className="border text-center">
                          TOTAL {mes}
                        </TableCell>
                        <TableCell className="border text-right">
                          {datos[mes].reduce((sum, item) => sum + item.devengado, 0).toLocaleString("es-PE")}
                        </TableCell>
                        <TableCell className="border text-right">
                          {datos[mes].reduce((sum, item) => sum + item.pagado, 0).toLocaleString("es-PE")}
                        </TableCell>
                        <TableCell className="border text-right">
                          {datos[mes].reduce((sum, item) => sum + item.saldoPendiente, 0).toLocaleString("es-PE")}
                        </TableCell>
                        <TableCell className="border"></TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}

                  {/* Total general */}
                  <TableRow className="bg-blue-600 text-white font-bold">
                    <TableCell colSpan={7} className="border text-center">
                      TOTAL GENERAL
                    </TableCell>
                    <TableCell className="border text-right">{totales.devengado.toLocaleString("es-PE")}</TableCell>
                    <TableCell className="border text-right">{totales.pagado.toLocaleString("es-PE")}</TableCell>
                    <TableCell className="border text-right">
                      {totales.saldoPendiente.toLocaleString("es-PE")}
                    </TableCell>
                    <TableCell className="border"></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
