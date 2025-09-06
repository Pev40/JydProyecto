import { getPagos } from "@/lib/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Plus, DollarSign, FileText } from "lucide-react"
import { PagoActions } from "@/components/pago-actions"
import Link from "next/link"

export default async function PagosPage() {
  const pagos = await getPagos()

  const totalPagos = pagos.reduce((sum, pago) => sum + Number(pago.Monto), 0)
  const pagosPendientes = pagos.filter((pago) => pago.Estado === "PENDIENTE").length
  const pagosConfirmados = pagos.filter((pago) => pago.Estado === "CONFIRMADO").length

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
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Pagos</h1>
                <p className="text-gray-600 mt-1">{pagos.length} pago(s) registrado(s)</p>
              </div>
            </div>
            <Link href="/pagos/nuevo">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Pago
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recaudado</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                S/ {totalPagos.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">{pagos.length} pagos registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagos Confirmados</CardTitle>
              <FileText className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{pagosConfirmados}</div>
              <p className="text-xs text-muted-foreground">Pagos procesados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
              <FileText className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pagosPendientes}</div>
              <p className="text-xs text-muted-foreground">Por confirmar</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de pagos */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Pagos</CardTitle>
          </CardHeader>
          <CardContent>
            {pagos.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Banco</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Mes Servicio</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagos.map((pago) => (
                      <TableRow key={pago.IdPago}>
                        <TableCell>{new Date(pago.Fecha).toLocaleDateString("es-PE")}</TableCell>
                        <TableCell>
                          <Link href={`/clientes/${pago.IdCliente}`} className="text-blue-600 hover:text-blue-800">
                            {pago.ClienteRazonSocial}
                          </Link>
                        </TableCell>
                        <TableCell className="font-medium">
                          S/ {Number(pago.Monto).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>{pago.BancoNombre}</TableCell>
                        <TableCell>{pago.Concepto}</TableCell>
                        <TableCell>
                          {new Date(pago.MesServicio).toLocaleDateString("es-PE", { year: "numeric", month: "long" })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={pago.Estado === "CONFIRMADO" ? "default" : "secondary"}>{pago.Estado}</Badge>
                        </TableCell>
                        <TableCell>
                          <PagoActions pago={{ IdPago: pago.IdPago, Estado: pago.Estado, UrlComprobante: pago.UrlComprobante }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay pagos registrados.</p>
                <Link href="/pagos/nuevo" className="mt-4 inline-block">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Primer Pago
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
