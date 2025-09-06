import { getPlantillasMensajes, getCatalogos } from "@/lib/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Plus, Edit, MessageSquare, Copy } from "lucide-react"
import Link from "next/link"

export default async function PlantillasPage() {
  const [plantillas, catalogos] = await Promise.all([getPlantillasMensajes(), getCatalogos()])

  const getClasificacionBadge = (codigo: string, color: string) => {
    const colorClass =
      color === "green"
        ? "bg-green-100 text-green-800"
        : color === "orange"
          ? "bg-orange-100 text-orange-800"
          : "bg-red-100 text-red-800"

    return (
      <Badge variant="secondary" className={colorClass}>
        {codigo}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link href="/configuracion">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Configuración
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Plantillas de Mensajes</h1>
                <p className="text-gray-600 mt-1">Gestionar plantillas para recordatorios automáticos</p>
              </div>
            </div>
            <Link href="/plantillas/nueva">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Plantilla
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Información sobre variables */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Variables Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-700">
              <div>
                <code className="bg-blue-100 px-2 py-1 rounded">{"{cliente}"}</code>
                <p>Razón social del cliente</p>
              </div>
              <div>
                <code className="bg-blue-100 px-2 py-1 rounded">{"{contacto}"}</code>
                <p>Nombre de la persona de contacto</p>
              </div>
              <div>
                <code className="bg-blue-100 px-2 py-1 rounded">{"{monto}"}</code>
                <p>Monto de la deuda pendiente</p>
              </div>
              <div>
                <code className="bg-blue-100 px-2 py-1 rounded">{"{fecha}"}</code>
                <p>Fecha de vencimiento</p>
              </div>
              <div>
                <code className="bg-blue-100 px-2 py-1 rounded">{"{empresa}"}</code>
                <p>Nombre de nuestra empresa</p>
              </div>
              <div>
                <code className="bg-blue-100 px-2 py-1 rounded">{"{telefono}"}</code>
                <p>Teléfono de contacto</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de plantillas */}
        <Card>
          <CardHeader>
            <CardTitle>Plantillas Configuradas</CardTitle>
          </CardHeader>
          <CardContent>
            {plantillas.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clasificación</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Contenido</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plantillas.map((plantilla) => (
                    <TableRow key={plantilla.IdPlantillaMensaje}>
                      <TableCell>
                        {getClasificacionBadge(plantilla.ClasificacionCodigo, plantilla.ClasificacionColor)}
                      </TableCell>
                      <TableCell className="font-medium">{plantilla.Nombre}</TableCell>
                      <TableCell>
                        <div className="max-w-md truncate" title={plantilla.Contenido}>
                          {plantilla.Contenido}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/plantillas/${plantilla.IdPlantillaMensaje}/editar`}>
                            <Button size="sm" variant="outline">
                              <Edit className="h-3 w-3" />
                            </Button>
                          </Link>
                          <Button size="sm" variant="outline">
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                <p className="text-gray-500 mt-4">No hay plantillas configuradas.</p>
                <Link href="/plantillas/nueva" className="mt-4 inline-block">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primera Plantilla
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plantillas por defecto */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Plantillas Sugeridas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-100 text-orange-800">B</Badge>
                    <span className="font-medium">Cliente con Deuda Leve</span>
                  </div>
                  <Button size="sm" variant="outline">
                    Usar Plantilla
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  Estimado {"{cliente}"}, le recordamos que tiene un pago pendiente de S/ {"{monto}"}. Por favor
                  regularice su situación a la brevedad. Gracias por su atención.
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-100 text-red-800">C</Badge>
                    <span className="font-medium">Cliente Moroso</span>
                  </div>
                  <Button size="sm" variant="outline">
                    Usar Plantilla
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  Estimado {"{cliente}"}, su cuenta presenta una deuda vencida de S/ {"{monto}"}. Comuníquese
                  urgentemente al {"{telefono}"} para regularizar su situación y evitar acciones legales.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
