import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Send, Bell } from "lucide-react"
import Link from "next/link"
import { AlertasCompromisos } from "@/components/alertas-compromisos"

export default async function AlertasPage() {
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
                <h1 className="text-3xl font-bold text-gray-900">Centro de Alertas</h1>
                <p className="text-gray-600 mt-1">Monitoreo de compromisos y recordatorios</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <Bell className="h-4 w-4 mr-2" />
                Configurar Alertas
              </Button>
              <Button>
                <Send className="h-4 w-4 mr-2" />
                Enviar Recordatorios
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Componente de alertas de compromisos */}
        <AlertasCompromisos />

        {/* Configuración de Alertas Automáticas */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Configuración de Alertas Automáticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Recordatorios de Pago</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Clientes Clasificación B</div>
                      <div className="text-sm text-gray-500">Cada 7 días</div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Activo</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Clientes Clasificación C</div>
                      <div className="text-sm text-gray-500">Cada 3 días</div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Activo</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Alertas de Compromisos</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Compromisos Vencidos</div>
                      <div className="text-sm text-gray-500">Diario a las 9:00 AM</div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Activo</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Compromisos del Día</div>
                      <div className="text-sm text-gray-500">Diario a las 8:00 AM</div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Activo</Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <div className="flex gap-3">
                <Button>Configurar Horarios</Button>
                <Button variant="outline">Probar Alertas</Button>
                <Button variant="outline">Ver Historial</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
