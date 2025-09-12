import { getClientes } from "@/lib/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Target } from "lucide-react"
import Link from "next/link"
import { ServicioAdicionalForm } from "@/components/servicio-adicional-form"

export default async function NuevoServicioAdicionalPage() {
  const clientes = await getClientes()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link href="/servicios-adicionales">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a Servicios
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Registrar Servicio Adicional</h1>
                <p className="text-gray-600 mt-1">Complete la información del servicio adicional</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Información del Servicio Adicional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ServicioAdicionalForm clientes={clientes} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}


