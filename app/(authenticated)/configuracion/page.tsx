import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Settings, Database, Bell, Mail, MessageSquare, Save } from "lucide-react"
import Link from "next/link"

export default function ConfiguracionPage() {
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
                <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
                <p className="text-gray-600 mt-1">Configurar parámetros y integraciones</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Configuración General */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="empresa">Nombre de la Empresa</Label>
                  <Input id="empresa" defaultValue="J & D CONSULTORES DE NEGOCIOS S.A.C." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ruc">RUC</Label>
                  <Input id="ruc" defaultValue="20123456789" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono Principal</Label>
                  <Input id="telefono" defaultValue="999-999-999" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Principal</Label>
                  <Input id="email" type="email" defaultValue="contacto@jdconsultores.com" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuración de Base de Datos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Base de Datos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Estado de Conexión</div>
                  <div className="text-sm text-gray-500">
                    {process.env.DATABASE_URL ? "Conectado a Neon PostgreSQL" : "No configurado"}
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    process.env.DATABASE_URL ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {process.env.DATABASE_URL ? "Activo" : "Inactivo"}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backup">Respaldo Automático</Label>
                <div className="flex items-center space-x-2">
                  <Switch id="backup" />
                  <span className="text-sm text-gray-600">Realizar respaldo diario automático</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuración de Cronograma SUNAT */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Cronograma SUNAT
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Configuración de Fechas de Vencimiento</div>
                  <div className="text-sm text-gray-500">
                    Gestionar cronograma oficial SUNAT por dígitos RUC
                  </div>
                </div>
                <Link href="/configuracion/cronograma-sunat">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar
                  </Button>
                </Link>
              </div>

              <div className="text-sm text-gray-600 p-3 bg-blue-50 rounded-lg">
                <strong>Información:</strong> El cronograma SUNAT determina las fechas de corte mensual 
                según el último dígito del RUC de cada cliente. Esta configuración es esencial para 
                el proceso automático de generación de servicios.
              </div>
            </CardContent>
          </Card>

          {/* Configuración de Notificaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* WhatsApp */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-green-600" />
                  <h4 className="font-medium">WhatsApp Business API</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp-token">Token de API</Label>
                    <Input id="whatsapp-token" type="password" placeholder="Ingrese token de WhatsApp" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp-phone">Número de Teléfono</Label>
                    <Input id="whatsapp-phone" placeholder="+51999999999" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="whatsapp-enabled" />
                  <span className="text-sm text-gray-600">Habilitar notificaciones por WhatsApp</span>
                </div>
              </div>

              <Separator />

              {/* Email */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <h4 className="font-medium">Configuración de Email</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-host">Servidor SMTP</Label>
                    <Input id="smtp-host" defaultValue="smtp.gmail.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-port">Puerto</Label>
                    <Input id="smtp-port" defaultValue="587" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-user">Usuario</Label>
                    <Input id="smtp-user" type="email" placeholder="email@empresa.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-pass">Contraseña</Label>
                    <Input id="smtp-pass" type="password" placeholder="Contraseña de aplicación" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="email-enabled" />
                  <span className="text-sm text-gray-600">Habilitar notificaciones por email</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuración de Recordatorios */}
          <Card>
            <CardHeader>
              <CardTitle>Recordatorios Automáticos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recordatorio-dias">Días antes del vencimiento</Label>
                  <Input id="recordatorio-dias" type="number" defaultValue="3" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recordatorio-hora">Hora de envío</Label>
                  <Input id="recordatorio-hora" type="time" defaultValue="09:00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recordatorio-frecuencia">Frecuencia (días)</Label>
                  <Input id="recordatorio-frecuencia" type="number" defaultValue="7" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch id="auto-recordatorios" />
                  <span className="text-sm text-gray-600">Enviar recordatorios automáticos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="recordatorio-morosos" />
                  <span className="text-sm text-gray-600">Recordatorios especiales para clientes morosos</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botón Guardar */}
          <div className="flex justify-end">
            <Button size="lg">
              <Save className="h-4 w-4 mr-2" />
              Guardar Configuración
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
