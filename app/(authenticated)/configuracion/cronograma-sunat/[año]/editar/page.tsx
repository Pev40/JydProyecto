import { getCronogramaSunatPorAño } from "@/lib/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { CronogramaForm } from "@/components/cronograma-form"
import { notFound } from "next/navigation"

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{
    año: string
  }>
}

export default async function EditarCronogramaPage({ params }: PageProps) {
  const { año } = await params
  const añoNum = Number.parseInt(año)

  if (isNaN(añoNum)) {
    notFound()
  }

  const cronograma = await getCronogramaSunatPorAño(añoNum)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link href="/configuracion/cronograma-sunat">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al Cronograma
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Editar Cronograma {año}</h1>
                <p className="text-gray-600 mt-1">Modificar fechas de vencimiento SUNAT</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Save className="h-5 w-5" />
              Cronograma de Vencimientos {año}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CronogramaForm año={añoNum} cronograma={cronograma} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
