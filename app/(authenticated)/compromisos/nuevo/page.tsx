import { getClientes } from "@/lib/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar } from "lucide-react"
import Link from "next/link"
import { CompromisoForm } from "@/components/compromiso-form"

export default async function NuevoCompromisoPage() {
  const clientes = await getClientes()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link href="/compromisos">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a Compromisos
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Nuevo Compromiso de Pago</h1>
                <p className="text-gray-600 mt-1">Registrar compromiso de pago con cliente</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Información del Compromiso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CompromisoForm clientes={clientes} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
