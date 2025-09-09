"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, Calendar, Clock, Send, CheckCircle, Phone, Mail } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"

interface Compromiso {
  IdCompromisoPago: number
  IdCliente: number
  FechaCompromiso: string
  MontoCompromiso: number
  RazonSocial: string
  NombreContacto: string
  Email: string
  Telefono: string
  ResponsableNombre: string
}

interface AlertasData {
  vencidos: Compromiso[]
  hoy: Compromiso[]
  proximos: Compromiso[]
}

export function AlertasCompromisos() {
  const [alertas, setAlertas] = useState<AlertasData>({
    vencidos: [],
    hoy: [],
    proximos: [],
  })
  const [loading, setLoading] = useState(true)
  const [enviandoAlertas, setEnviandoAlertas] = useState(false)

  useEffect(() => {
    cargarAlertas()
  }, [])

  const cargarAlertas = async () => {
    try {
      const response = await fetch("/api/alertas/compromisos")
      const result = await response.json()

      if (result.success) {
        setAlertas(result.alertas)
      }
    } catch (error) {
      console.error("Error loading alerts:", error)
    } finally {
      setLoading(false)
    }
  }

  const enviarAlertas = async (tipo: string) => {
    setEnviandoAlertas(true)
    try {
      const response = await fetch("/api/alertas/compromisos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tipo }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Alertas enviadas",
          description: result.message,
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al enviar alertas",
        variant: "destructive",
      })
    } finally {
      setEnviandoAlertas(false)
    }
  }

  const marcarComoCumplido = async (compromisoId: number) => {
    try {
      const response = await fetch(`/api/compromisos/${compromisoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          estado: "CUMPLIDO",
          observaciones: "Marcado como cumplido desde el centro de alertas",
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Compromiso actualizado",
          description: "El compromiso ha sido marcado como cumplido",
        })
        cargarAlertas() // Recargar alertas
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar compromiso",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards - Una fila horizontal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200 bg-red-50 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Compromisos Vencidos</CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{alertas.vencidos.length}</div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-red-600">Requieren acción inmediata</p>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => enviarAlertas("vencidos")}
                disabled={enviandoAlertas || alertas.vencidos.length === 0}
              >
                <Send className="h-3 w-3 mr-1" />
                Alertar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Compromisos Hoy</CardTitle>
            <Calendar className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{alertas.hoy.length}</div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-orange-600">Vencen hoy</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => enviarAlertas("hoy")}
                disabled={enviandoAlertas || alertas.hoy.length === 0}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <Send className="h-3 w-3 mr-1" />
                Recordar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Próximos 3 Días</CardTitle>
            <Clock className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{alertas.proximos.length}</div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-blue-600">Próximos a vencer</p>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => enviarAlertas("proximos")}
                disabled={enviandoAlertas || alertas.proximos.length === 0}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Clock className="h-3 w-3 mr-1" />
                Monitorear
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compromisos Vencidos */}
      {alertas.vencidos.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Compromisos Vencidos - Acción Requerida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha Compromiso</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Días Vencido</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alertas.vencidos.map((compromiso) => {
                  const diasVencido = Math.floor(
                    (Date.now() - new Date(compromiso.FechaCompromiso).getTime()) / (1000 * 60 * 60 * 24),
                  )

                  return (
                    <TableRow key={compromiso.IdCompromisoPago} className="bg-red-50">
                      <TableCell>
                        <div>
                          <Link
                            href={`/clientes/${compromiso.IdCliente}`}
                            className="font-medium text-blue-600 hover:text-blue-800"
                          >
                            {compromiso.RazonSocial}
                          </Link>
                          <div className="text-sm text-gray-500">{compromiso.NombreContacto}</div>
                          <div className="flex gap-2 mt-1">
                            {compromiso.Email && (
                              <a href={`mailto:${compromiso.Email}`} className="text-blue-600 hover:text-blue-800">
                                <Mail className="h-3 w-3" />
                              </a>
                            )}
                            {compromiso.Telefono && (
                              <a href={`tel:${compromiso.Telefono}`} className="text-green-600 hover:text-green-800">
                                <Phone className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-red-600">
                          {new Date(compromiso.FechaCompromiso).toLocaleDateString("es-PE")}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        S/ {Number(compromiso.MontoCompromiso).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">{diasVencido} días</Badge>
                      </TableCell>
                      <TableCell>{compromiso.ResponsableNombre}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => marcarComoCumplido(compromiso.IdCompromisoPago)}
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                          <Link href={`/notificaciones/enviar?cliente=${compromiso.IdCliente}`}>
                            <Button size="sm" variant="outline">
                              <Send className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Compromisos de Hoy */}
      {alertas.hoy.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Compromisos de Hoy - Seguimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alertas.hoy.map((compromiso) => (
                  <TableRow key={compromiso.IdCompromisoPago} className="bg-orange-50">
                    <TableCell>
                      <div>
                        <Link
                          href={`/clientes/${compromiso.IdCliente}`}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          {compromiso.RazonSocial}
                        </Link>
                        <div className="text-sm text-gray-500">{compromiso.NombreContacto}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      S/ {Number(compromiso.MontoCompromiso).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{compromiso.ResponsableNombre}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => marcarComoCumplido(compromiso.IdCompromisoPago)}
                        >
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                        <Link href={`/notificaciones/enviar?cliente=${compromiso.IdCliente}`}>
                          <Button size="sm" variant="outline">
                            <Send className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
