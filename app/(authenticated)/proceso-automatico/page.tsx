import { requireRole } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProcesoAutomaticoManager } from "@/components/proceso-automatico-manager"
import { Bot, Calendar, CheckCircle, Clock, Users, FileText, Mail } from "lucide-react"

export default async function ProcesoAutomaticoPage() {
  // Solo administradores pueden acceder
  await requireRole(["ADMIN"])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Bot className="h-8 w-8 mr-3 text-blue-600" />
            Proceso Automático
          </h1>
          <p className="text-gray-600 mt-2">
            Sistema automatizado de generación de servicios y recordatorios según cronograma SUNAT
          </p>
        </div>
      </div>

      {/* Información del Sistema */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estado del Sistema</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Activo</div>
            <p className="text-xs text-muted-foreground">Proceso automático habilitado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próxima Ejecución</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">06:00</div>
            <p className="text-xs text-muted-foreground">Mañana (diario)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Ejecución</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Hoy</div>
            <p className="text-xs text-muted-foreground">06:00 AM - Exitoso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modo</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Automático</div>
            <p className="text-xs text-muted-foreground">Cron job configurado</p>
          </CardContent>
        </Card>
      </div>

      {/* Descripción del Proceso */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>¿Cómo Funciona el Proceso Automático?</CardTitle>
          <CardDescription>
            El sistema ejecuta diariamente las siguientes tareas basadas en el cronograma SUNAT
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">1. Verificación de Cronograma SUNAT</h3>
                  <p className="text-sm text-gray-600">
                    Revisa si hoy es día de corte SUNAT para algún cliente según su último dígito RUC
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <FileText className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">2. Generación de Servicios</h3>
                  <p className="text-sm text-gray-600">
                    Para clientes con corte hoy, genera automáticamente el cargo mensual del servicio contratado
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Mail className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold">3. Recordatorios Preventivos</h3>
                  <p className="text-sm text-gray-600">Envía recordatorios a clientes que tienen vencimiento mañana</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">4. Clasificación Automática</h3>
                  <p className="text-sm text-gray-600">
                    Actualiza la clasificación de clientes (A/B/C) según su estado de pagos
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Componente de Gestión */}
      <ProcesoAutomaticoManager />
    </div>
  )
}
