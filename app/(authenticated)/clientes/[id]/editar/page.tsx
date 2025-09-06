import { getClienteById, getCatalogos } from "@/lib/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit } from "lucide-react"
import Link from "next/link"
import { ClienteForm } from "@/components/cliente-form"
import { notFound } from "next/navigation"

// Forzar que la página se revalide en cada carga
export const revalidate = 0

interface PageProps {
  params: {
    id: string
  }
}

export default async function EditarClientePage({ params }: PageProps) {
  const clienteId = Number.parseInt(params.id)

  if (isNaN(clienteId)) {
    notFound()
  }

  const [cliente, catalogos] = await Promise.all([getClienteById(clienteId), getCatalogos()])

  if (!cliente) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link href={`/clientes/${cliente.IdCliente}`}>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al Cliente
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Editar Cliente</h1>
                <p className="text-gray-600 mt-1">{cliente.RazonSocial}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editar Información del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ClienteForm catalogos={catalogos} cliente={cliente} isEditing={true} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
