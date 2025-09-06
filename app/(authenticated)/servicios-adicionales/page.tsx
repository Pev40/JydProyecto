import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, DollarSign, FileText, TrendingUp, ArrowLeft } from "lucide-react"
import Link from "next/link"

// Mock data para servicios adicionales
const serviciosAdicionales = [
  {
    IdServicioAdicional: 1,
    IdCliente: 1,
    ClienteNombre: "EMPRESA DEMO SAC",
    NombreServicio: "Consultoría Tributaria",
    Descripcion: "Asesoría especializada en temas tributarios",
    Fecha: "2024-01-15",
    Monto: 500.0,
    Estado: "FACTURADO",
  },
  {
    IdServicioAdicional: 2,
    IdCliente: 2,
    ClienteNombre: "CONSULTORA ABC EIRL",
    NombreServicio: "Auditoría Interna",
    Descripcion: "Revisión de procesos contables internos",
    Fecha: "2024-01-20",
    Monto: 1200.0,
    Estado: "PENDIENTE",
  },
  {
    IdServicioAdicional: 3,
    IdCliente: 1,
    ClienteNombre: "EMPRESA DEMO SAC",
    NombreServicio: "Capacitación Contable",
    Descripcion: "Capacitación al personal en temas contables",
    Fecha: "2024-01-25",
    Monto: 800.0,
    Estado: "PAGADO",
  },
]

export default function ServiciosAdicionalesPage() {
  const estadisticas = {
    totalServicios: serviciosAdicionales.length,
    totalFacturado: serviciosAdicionales.reduce((sum, s) => sum + s.Monto, 0),
    serviciosPendientes: serviciosAdicionales.filter((s) => s.Estado === "PENDIENTE").length,
    promedioServicio: serviciosAdicionales.reduce((sum, s) => sum + s.Monto, 0) / serviciosAdicionales.length,
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "PENDIENTE":
        return <Badge variant="secondary">Pendiente</Badge>
      case "FACTURADO":
        return <Badge variant="outline">Facturado</Badge>
      case "PAGADO":
        return <Badge variant="default">Pagado</Badge>
      case "CANCELADO":
        return <Badge variant="destructive">Cancelado</Badge>
      default:
        return <Badge variant="secondary">{estado}</Badge>
    }
  }

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
                <h1 className="text-3xl font-bold text-gray-900">Servicios Adicionales</h1>
                <p className="text-gray-600 mt-1">Gestión de servicios extras facturados a clientes</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Link href="/servicios-adicionales/nuevo">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Servicio
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Servicios</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.totalServicios}</div>
              <p className="text-xs text-muted-foreground">Servicios registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Facturado</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                S/ {estadisticas.totalFacturado.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Ingresos por servicios extras</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Servicios Pendientes</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{estadisticas.serviciosPendientes}</div>
              <p className="text-xs text-muted-foreground">Por facturar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio por Servicio</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                S/ {estadisticas.promedioServicio.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Valor promedio</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de Servicios */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Servicios Adicionales</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviciosAdicionales.map((servicio) => (
                  <TableRow key={servicio.IdServicioAdicional}>
                    <TableCell>
                      <Link
                        href={`/clientes/${servicio.IdCliente}`}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {servicio.ClienteNombre}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">{servicio.NombreServicio}</TableCell>
                    <TableCell className="max-w-xs truncate">{servicio.Descripcion}</TableCell>
                    <TableCell>{new Date(servicio.Fecha).toLocaleDateString("es-PE")}</TableCell>
                    <TableCell className="font-medium text-green-600">
                      S/ {servicio.Monto.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{getEstadoBadge(servicio.Estado)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/servicios-adicionales/${servicio.IdServicioAdicional}/editar`}>
                          <Button size="sm" variant="outline">
                            Editar
                          </Button>
                        </Link>
                        {servicio.Estado === "PENDIENTE" && (
                          <Button size="sm" variant="default">
                            Facturar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Resumen por Estado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Servicios por Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {["PENDIENTE", "FACTURADO", "PAGADO", "CANCELADO"].map((estado) => {
                  const serviciosEstado = serviciosAdicionales.filter((s) => s.Estado === estado)
                  const montoEstado = serviciosEstado.reduce((sum, s) => sum + s.Monto, 0)

                  return (
                    <div key={estado} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getEstadoBadge(estado)}
                        <span className="font-medium">{serviciosEstado.length} servicios</span>
                      </div>
                      <span className="font-medium text-green-600">
                        S/ {montoEstado.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Servicios Más Solicitados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {["Consultoría Tributaria", "Auditoría Interna", "Capacitación Contable"].map((servicio, index) => (
                  <div key={servicio} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{servicio}</div>
                      <div className="text-sm text-gray-500">#{index + 1} más solicitado</div>
                    </div>
                    <Badge variant="outline">{Math.floor(Math.random() * 10) + 1} veces</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
