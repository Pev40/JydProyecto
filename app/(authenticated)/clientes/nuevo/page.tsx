import { getCatalogos } from "@/lib/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users } from "lucide-react"
import Link from "next/link"
import { ClienteForm } from "@/components/cliente-form"

export default async function NuevoClientePage() {
  const catalogos = await getCatalogos()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link href="/clientes">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a Clientes
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Registrar Nuevo Cliente</h1>
                <p className="text-gray-600 mt-1">Complete la información del cliente</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Información del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ClienteForm catalogos={catalogos} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
