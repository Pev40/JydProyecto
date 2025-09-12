"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Loader2, CheckCircle, XCircle, Send, MessageSquare, Mail, Settings } from "lucide-react"

interface NotificacionConfig {
  whatsapp_activo: boolean
  email_activo: boolean
  whatsapp_token?: string
  email_config?: object
  whatsapp?: {
    active: boolean
  }
  evolution?: {
    baseUrl: string
    instanceKey: string
  }
  email?: {
    active: boolean
  }
  smtp?: {
    host: string
    port: number
    user: string
    secure: boolean
  }
}

export default function ConfiguracionNotificaciones() {
  const [loading, setLoading] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const [configuracion, setConfiguracion] = useState<NotificacionConfig | null>(null)
  const [testData, setTestData] = useState({
    telefono: "",
    email: "",
    mensaje: "Este es un mensaje de prueba del sistema de notificaciones.",
  })

  useEffect(() => {
    cargarConfiguracion()
  }, [])

  const cargarConfiguracion = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/configuracion/notificaciones")
      const result = await response.json()

      if (result.success) {
        setConfiguracion(result.data)
      } else {
        toast({
          title: "Error",
          description: "No se pudo cargar la configuración",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "Error al cargar la configuración",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const probarWhatsApp = async () => {
    if (!testData.telefono || !testData.mensaje) {
      toast({
        title: "Error",
        description: "Ingrese teléfono y mensaje para la prueba",
        variant: "destructive",
      })
      return
    }

    setTestLoading(true)
    try {
      const response = await fetch("/api/configuracion/notificaciones/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "whatsapp",
          destinatario: testData.telefono,
          mensaje: testData.mensaje,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "WhatsApp enviado",
          description: result.message,
        })
      } else {
        toast({
          title: "Error en WhatsApp",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "Error al probar WhatsApp",
        variant: "destructive",
      })
    } finally {
      setTestLoading(false)
    }
  }

  const probarEmail = async () => {
    if (!testData.email || !testData.mensaje) {
      toast({
        title: "Error",
        description: "Ingrese email y mensaje para la prueba",
        variant: "destructive",
      })
      return
    }

    setTestLoading(true)
    try {
      const response = await fetch("/api/configuracion/notificaciones/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "email",
          destinatario: testData.email,
          mensaje: testData.mensaje,
          asunto: "Prueba del Sistema de Notificaciones",
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Email enviado",
          description: result.message,
        })
      } else {
        toast({
          title: "Error en Email",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "Error al probar Email",
        variant: "destructive",
      })
    } finally {
      setTestLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Configuración de Notificaciones</h1>
      </div>

      {/* Estado de Servicios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              WhatsApp (Evolution API)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Estado:</span>
              {configuracion?.whatsapp ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Configurado
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  No configurado
                </Badge>
              )}
            </div>

            {configuracion?.whatsapp && (
              <div className="space-y-2 text-sm">
                <div>
                  <strong>URL:</strong> {configuracion.evolution?.baseUrl}
                </div>
                <div>
                  <strong>Instancia:</strong> {configuracion.evolution?.instanceKey}
                </div>
                <div>
                  <strong>Estado:</strong> <span className="text-green-600">Activo</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Email (SMTP)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Estado:</span>
              {configuracion?.email ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Configurado
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  No configurado
                </Badge>
              )}
            </div>

            {configuracion?.email && (
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Servidor:</strong> {configuracion.smtp?.host}:{configuracion.smtp?.port}
                </div>
                <div>
                  <strong>Usuario:</strong> {configuracion.smtp?.user}
                </div>
                <div>
                  <strong>Seguridad:</strong> {configuracion.smtp?.secure ? "SSL/TLS" : "STARTTLS"}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pruebas de Envío */}
      <Card>
        <CardHeader>
          <CardTitle>Pruebas de Envío</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="mensaje">Mensaje de Prueba</Label>
            <Textarea
              id="mensaje"
              value={testData.mensaje}
              onChange={(e) => setTestData((prev) => ({ ...prev, mensaje: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Prueba WhatsApp */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-green-600" />
                Probar WhatsApp
              </h3>
              <div className="space-y-2">
                <Label htmlFor="telefono">Número de Teléfono</Label>
                <Input
                  id="telefono"
                  placeholder="Ej: 987654321"
                  value={testData.telefono}
                  onChange={(e) => setTestData((prev) => ({ ...prev, telefono: e.target.value }))}
                />
              </div>
              <Button onClick={probarWhatsApp} disabled={testLoading || !configuracion?.whatsapp} className="w-full">
                {testLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Enviar WhatsApp
              </Button>
            </div>

            {/* Prueba Email */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                Probar Email
              </h3>
              <div className="space-y-2">
                <Label htmlFor="email">Dirección de Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={testData.email}
                  onChange={(e) => setTestData((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <Button onClick={probarEmail} disabled={testLoading || !configuracion?.email} className="w-full">
                {testLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Enviar Email
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
