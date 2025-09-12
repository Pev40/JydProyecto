"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CronogramaSunatManager } from "@/components/cronograma-sunat-manager"
import {
  Calendar,
  Plus,
  Copy,
  Edit,
  ArrowLeft,
  Building,
  Clock,
  Users,
  FileText,
  CheckCircle,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic'

interface AñoCronograma {
  Año: number
  totalRegistros: number
  fechaCreacion: string
  Estado: string
}

interface EstadisticasAño {
  totalRegistros: number
  mesesCompletos: number
  digitosConfigurados: number
  fechaCreacion: string
  fechaUltimaModificacion: string
}

interface CronogramaDetalle {
  Mes: number
  DigitoRUC: number
  Dia: number
  MesVencimiento: number
  AñoVencimiento: number  // Añadimos el año de vencimiento calculado
  NombreMes: string
}

interface CronogramaItem {
  Mes: number
  DigitoRUC: number
  Dia: number
  MesVencimiento: number
}

export default function CronogramaSunatConfigPage() {
  const [años, setAños] = useState<AñoCronograma[]>([])
  const [añoSeleccionado, setAñoSeleccionado] = useState<number | null>(null)
  const [estadisticas, setEstadisticas] = useState<EstadisticasAño | null>(null)
  const [cronogramaDetalle, setCronogramaDetalle] = useState<CronogramaDetalle[]>([])
  const [loading, setLoading] = useState(true)
  const [showManager, setShowManager] = useState(false)
  const [accionManager, setAccionManager] = useState<"crear" | "copiar" | "editar">("crear")

  const mesesNombres = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ]

  const digitosInfo = [
    { digitos: "0", descripcion: "RUC terminado en 0" },
    { digitos: "1", descripcion: "RUC terminado en 1" },
    { digitos: "2,3", descripcion: "RUC terminado en 2 ó 3" },
    { digitos: "4,5", descripcion: "RUC terminado en 4 ó 5" },
    { digitos: "6,7", descripcion: "RUC terminado en 6 ó 7" },
    { digitos: "8,9", descripcion: "RUC terminado en 8 ó 9" },
    { digitos: "BC", descripcion: "Buenos Contribuyentes" },
  ]

  const cargarAños = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/cronograma-sunat?accion=años")
      if (response.ok) {
        const result = await response.json()
        setAños(result.años || [])
        // Seleccionar el año más reciente por defecto
        if (result.años && result.años.length > 0) {
          const añoReciente = result.años[0].Año
          setAñoSeleccionado(añoReciente)
          cargarEstadisticas(añoReciente)
          cargarCronogramaDetalle(añoReciente)
        }
      }
    } catch (error) {
      console.error("Error cargando años:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarAños()
  }, [cargarAños])

  const cargarEstadisticas = async (año: number) => {
    try {
      const response = await fetch(`/api/cronograma-sunat?accion=estadisticas&año=${año}`)
      if (response.ok) {
        const result = await response.json()
        setEstadisticas(result.estadisticas)
      }
    } catch (error) {
      console.error("Error cargando estadísticas:", error)
    }
  }

  const cargarCronogramaDetalle = async (año: number) => {
    try {
      const response = await fetch(`/api/cronograma-sunat?accion=consultar&año=${año}`)
      if (response.ok) {
        const result = await response.json()
        // Convertir el objeto agrupado por mes a array
        const detalle: CronogramaDetalle[] = []
        Object.entries(result.cronograma).forEach(([mes, items]) => {
          if (Array.isArray(items)) {
            (items as CronogramaItem[]).forEach(item => {
              // Calcular el año de vencimiento: diciembre (mes 12) vence en enero del año siguiente
              const añoVencimiento = item.Mes === 12 ? año + 1 : año
              
              detalle.push({
                Mes: item.Mes,
                DigitoRUC: item.DigitoRUC,
                Dia: item.Dia,
                MesVencimiento: item.MesVencimiento,
                AñoVencimiento: añoVencimiento,
                NombreMes: mes
              })
            })
          }
        })
        setCronogramaDetalle(detalle)
      }
    } catch (error) {
      console.error("Error cargando cronograma detalle:", error)
    }
  }

  const handleAñoSeleccionado = (año: number) => {
    setAñoSeleccionado(año)
    cargarEstadisticas(año)
    cargarCronogramaDetalle(año)
  }

  const handleAccion = (accion: "crear" | "copiar" | "editar") => {
    setAccionManager(accion)
    setShowManager(true)
  }

  const handleManagerClose = () => {
    setShowManager(false)
    cargarAños()
  }

  const getDigitoLabel = (digito: number) => {
    if (digito === 99) return "BC"
    if (digito === 2) return "2,3"
    if (digito === 4) return "4,5"
    if (digito === 6) return "6,7"
    if (digito === 8) return "8,9"
    return digito.toString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando cronograma SUNAT...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link href="/configuracion">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Configuración
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Cronograma SUNAT</h1>
                <p className="text-gray-600 mt-1">Configuración de fechas de vencimiento por dígito RUC</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Selección de año y acciones */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {años.map((año) => (
              <Button
                key={año.Año}
                variant={añoSeleccionado === año.Año ? "default" : "outline"}
                onClick={() => handleAñoSeleccionado(año.Año)}
              >
                {año.Año}
                <Badge variant="secondary" className="ml-2">
                  {año.totalRegistros}
                </Badge>
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={() => handleAccion("crear")} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Crear Año
            </Button>
            <Button onClick={() => handleAccion("copiar")} variant="outline">
              <Copy className="h-4 w-4 mr-2" />
              Copiar Año
            </Button>
            {añoSeleccionado && (
              <Link href={`/configuracion/cronograma-sunat/${añoSeleccionado}/editar`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Estadísticas */}
        {estadisticas && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Registros</p>
                    <p className="text-2xl font-bold text-blue-600 mt-2">{estadisticas.totalRegistros}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Meses Completos</p>
                    <p className="text-2xl font-bold text-green-600 mt-2">{estadisticas.mesesCompletos}/12</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Dígitos Configurados</p>
                    <p className="text-2xl font-bold text-purple-600 mt-2">{estadisticas.digitosConfigurados}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Última Actualización</p>
                    <p className="text-sm font-bold text-gray-700 mt-2">
                      {new Date(estadisticas.fechaUltimaModificacion).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <Clock className="h-6 w-6 text-gray-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="cronograma" className="space-y-6">
          <TabsList>
            <TabsTrigger value="cronograma">Cronograma Detallado</TabsTrigger>
            <TabsTrigger value="referencia">Guía de Dígitos RUC</TabsTrigger>
          </TabsList>

          <TabsContent value="cronograma">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Cronograma de Vencimientos {añoSeleccionado}
                  {añoSeleccionado && (
                    <Badge variant="outline" className="ml-2">
                      Vence: {añoSeleccionado} - {añoSeleccionado + 1}
                    </Badge>
                  )}
                </CardTitle>
                {añoSeleccionado && (
                  <p className="text-sm text-gray-600 mt-2">
                    Las obligaciones de diciembre {añoSeleccionado} vencen en enero {añoSeleccionado + 1}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mes</TableHead>
                        <TableHead>Dígito RUC</TableHead>
                        <TableHead>Día de Corte</TableHead>
                        <TableHead>Mes de Vencimiento</TableHead>
                        <TableHead>Año de Vencimiento</TableHead>
                        <TableHead>Fecha Vencimiento</TableHead>
                        <TableHead>Descripción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cronogramaDetalle.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.NombreMes}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {getDigitoLabel(item.DigitoRUC)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              Día {item.Dia}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {mesesNombres[item.MesVencimiento - 1]}
                          </TableCell>
                          <TableCell>
                            <Badge variant={añoSeleccionado && item.AñoVencimiento > añoSeleccionado ? "destructive" : "default"}>
                              {item.AñoVencimiento}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {item.Dia} {mesesNombres[item.MesVencimiento - 1]} {item.AñoVencimiento}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {item.DigitoRUC === 99 ? "Buenos Contribuyentes" : 
                             item.DigitoRUC === 2 ? "RUC terminados en 2 ó 3" :
                             item.DigitoRUC === 4 ? "RUC terminados en 4 ó 5" :
                             item.DigitoRUC === 6 ? "RUC terminados en 6 ó 7" :
                             item.DigitoRUC === 8 ? "RUC terminados en 8 ó 9" :
                             `RUC terminados en ${item.DigitoRUC}`}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {cronogramaDetalle.length === 0 && (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay cronograma configurado</h3>
                    <p className="text-gray-600 mb-4">
                      No se encontró cronograma para el año {añoSeleccionado}
                    </p>
                    <Button onClick={() => handleAccion("crear")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Cronograma
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referencia">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Guía de Dígitos RUC
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {digitosInfo.map((info, index) => (
                    <div key={index} className="flex items-center p-4 border rounded-lg">
                      <Badge variant="outline" className="font-mono mr-4 min-w-[60px] justify-center">
                        {info.digitos}
                      </Badge>
                      <span className="text-sm">{info.descripcion}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">📋 Información importante:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Los dígitos se agrupan según las disposiciones de SUNAT</li>
                    <li>• &quot;BC&quot; corresponde a Buenos Contribuyentes</li>
                    <li>• El día de corte determina cuándo se genera el servicio mensual</li>
                    <li>• El mes de vencimiento es cuando vence la obligación tributaria</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Manager Modal */}
        {showManager && (
          <CronogramaSunatManager
            accion={accionManager}
            añoSeleccionado={añoSeleccionado}
            años={años}
            onClose={handleManagerClose}
          />
        )}
      </main>
    </div>
  )
}
