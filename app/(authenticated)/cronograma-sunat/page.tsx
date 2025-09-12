"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CronogramaSunatManager } from "@/components/cronograma-sunat-manager"
import {
  Calendar,
  Plus,
  Copy,
  Edit,
  Trash2,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  Building,
} from "lucide-react"

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

export default function CronogramaSunatPage() {
  const [años, setAños] = useState<AñoCronograma[]>([])
  const [añoSeleccionado, setAñoSeleccionado] = useState<number | null>(null)
  const [estadisticas, setEstadisticas] = useState<EstadisticasAño | null>(null)
  const [loading, setLoading] = useState(true)
  const [showManager, setShowManager] = useState(false)
  const [accionManager, setAccionManager] = useState<"crear" | "copiar" | "editar">("crear")

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

  const handleAñoSeleccionado = (año: number) => {
    setAñoSeleccionado(año)
    cargarEstadisticas(año)
  }

  const handleAccion = (accion: "crear" | "copiar" | "editar") => {
    setAccionManager(accion)
    setShowManager(true)
  }

  const handleManagerClose = () => {
    setShowManager(false)
    cargarAños()
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
      {/* Header principal */}
      <div className="jd-header shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Cronograma SUNAT</h1>
                  <p className="text-white/80 mt-1">Gestión de cronogramas de vencimientos anuales</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={() => handleAccion("crear")} className="jd-button-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Año
                </Button>
                <Button
                  onClick={() => handleAccion("copiar")}
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Año
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Imagen oficial SUNAT 2025 */}
        <Card className="jd-card mb-8">
          <CardHeader className="jd-header rounded-t-lg">
            <CardTitle className="text-white flex items-center gap-2">
              <Building className="h-5 w-5" />
              Cronograma Oficial SUNAT 2025
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-ek0me4yqMoRlqe7OdmsOzjkhrTmB48.png"
                alt="Cronograma SUNAT 2025"
                width={800}
                height={600}
                className="mx-auto max-w-full h-auto rounded-lg shadow-lg"
              />
              <p className="text-sm text-gray-600 mt-4">
                Cronograma oficial de vencimientos para registros electrónicos - SUNAT 2025
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas generales */}
        {estadisticas && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="jd-card jd-hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Registros</p>
                    <p className="text-2xl font-bold jd-text-primary mt-2">{estadisticas.totalRegistros}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="jd-card jd-hover-lift">
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

            <Card className="jd-card jd-hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Dígitos RUC</p>
                    <p className="text-2xl font-bold text-purple-600 mt-2">{estadisticas.digitosConfigurados}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="jd-card jd-hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Última Actualización</p>
                    <p className="text-sm font-bold text-gray-900 mt-2">
                      {new Date(estadisticas.fechaUltimaModificacion).toLocaleDateString("es-PE")}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lista de años disponibles */}
        <Card className="jd-card">
          <CardHeader className="jd-header rounded-t-lg">
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Cronogramas Disponibles por Año
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {años.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay cronogramas configurados</h3>
                <p className="text-gray-600 mb-6">Comience creando un cronograma para el año actual</p>
                <Button onClick={() => handleAccion("crear")} className="jd-button-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Cronograma
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {años.map((año) => (
                  <Card
                    key={año.Año}
                    className={`jd-card cursor-pointer transition-all duration-200 ${
                      añoSeleccionado === año.Año ? "ring-2 ring-blue-500 bg-blue-50" : "hover:shadow-lg"
                    }`}
                    onClick={() => handleAñoSeleccionado(año.Año)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Calendar className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold jd-text-primary">{año.Año}</h3>
                            <p className="text-sm text-gray-600">Cronograma SUNAT</p>
                          </div>
                        </div>
                        <Badge className={`jd-badge-${año.Estado === "ACTIVO" ? "success" : "secondary"}`}>
                          {año.Estado}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Registros:</span>
                          <span className="font-medium">{año.totalRegistros}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Creado:</span>
                          <span className="font-medium">{new Date(año.fechaCreacion).toLocaleDateString("es-PE")}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            setAñoSeleccionado(año.Año)
                            handleAccion("editar")
                          }}
                          className="flex-1"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Lógica para eliminar/desactivar
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Información adicional */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <Card className="jd-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 jd-text-primary">
                <AlertTriangle className="h-5 w-5" />
                Información Importante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <p>• El cronograma SUNAT se actualiza anualmente según las disposiciones oficiales</p>
                <p>• Las fechas de vencimiento corresponden al mes siguiente del período declarado</p>
                <p>• Los Buenos Contribuyentes y UESP tienen fechas especiales de vencimiento</p>
                <p>• Puede copiar cronogramas de años anteriores como base para nuevos años</p>
              </div>
            </CardContent>
          </Card>

          <Card className="jd-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 jd-text-primary">
                <CheckCircle className="h-5 w-5" />
                Funcionalidades Disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  • <strong>Crear Año:</strong> Generar cronograma base para un nuevo año
                </p>
                <p>
                  • <strong>Copiar Año:</strong> Duplicar cronograma existente a otro año
                </p>
                <p>
                  • <strong>Editar:</strong> Modificar fechas específicas del cronograma
                </p>
                <p>
                  • <strong>Consultar:</strong> Ver cronograma completo por año seleccionado
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Manager Modal */}
      {showManager && (
        <CronogramaSunatManager
          accion={accionManager}
          añoSeleccionado={añoSeleccionado}
          años={años}
          onClose={handleManagerClose}
        />
      )}
    </div>
  )
}
