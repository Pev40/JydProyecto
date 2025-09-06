import { getClientes, getCatalogos } from "@/lib/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, DollarSign } from "lucide-react"
import Link from "next/link"
import { PagoForm } from "@/components/pago-form"

interface PageProps {
  searchParams: {
    cliente?: string
  }
}

export default async function NuevoPagoPage({ searchParams }: PageProps) {
  const [clientes, catalogos] = await Promise.all([getClientes(), getCatalogos()])

  const clienteSeleccionado = searchParams.cliente ? Number.parseInt(searchParams.cliente) : undefined

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link href="/pagos">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a Pagos
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Registrar Nuevo Pago</h1>
                <p className="text-gray-600 mt-1">Complete la información del pago recibido</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Información del Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PagoForm clientes={clientes} catalogos={catalogos} clienteSeleccionado={clienteSeleccionado} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
