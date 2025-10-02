import { getClientes, getCatalogos, getObtenerSaldoPendientePorCliente } from "@/lib/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Send } from "lucide-react"
import Link from "next/link"
import { NotificacionForm } from "@/components/notificacion-form"

export const revalidate = 0

export default async function EnviarNotificacionPage() {
  const [clientesBase, catalogos] = await Promise.all([getClientes(), getCatalogos()])
  console.log(clientesBase)
  // Enriquecer cada cliente con su SaldoPendiente calculado
  const clientes = await Promise.all(
    clientesBase.map(async (c) => ({
      ...c,
      SaldoPendiente: await getObtenerSaldoPendientePorCliente(c.IdCliente),
    }))
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link href="/notificaciones">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a Notificaciones
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Enviar Notificación</h1>
                <p className="text-gray-600 mt-1">Enviar recordatorio de pago a cliente</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Nueva Notificación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NotificacionForm clientes={clientes} catalogos={catalogos} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
