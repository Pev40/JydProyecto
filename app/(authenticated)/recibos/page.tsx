import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

async function getRecibos() {
  const res = await fetch(`/api/recibos`, { cache: "no-store" })
  const data = await res.json()
  return data.recibos || []
}

import { getPagos } from "@/lib/queries"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText, Download, Printer } from "lucide-react"
import { GenerateButtons } from "@/components/recibos-generate-buttons"
import Link from "next/link"

export default async function RecibosPage() {
  const [pagos] = await Promise.all([getPagos()])

  const pagosConfirmados = pagos.filter((p) => p.Estado === "CONFIRMADO")

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
                <h1 className="text-3xl font-bold text-gray-900">Generación de Recibos</h1>
                <p className="text-gray-600 mt-1">Generar recibos personalizados para pagos</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Plantilla Recibo
              </Button>
              <Link href="/recibos/configurar">
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
                  Configurar Plantilla
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagos Confirmados</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pagosConfirmados.length}</div>
              <p className="text-xs text-muted-foreground">Listos para recibo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recaudado</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                S/{" "}
                {pagosConfirmados
                  .reduce((sum, p) => sum + Number(p.Monto), 0)
                  .toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Este mes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recibos Generados</CardTitle>
              <Printer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.floor(pagosConfirmados.length * 0.8)}</div>
              <p className="text-xs text-muted-foreground">80% de los pagos</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de pagos para generar recibos */}
        <Card>
          <CardHeader>
            <CardTitle>Pagos Disponibles para Recibo</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Mes Servicio</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagosConfirmados.map((pago) => (
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
                    <TableCell>{pago.Concepto}</TableCell>
                    <TableCell>
                      {new Date(pago.MesServicio).toLocaleDateString("es-PE", { year: "numeric", month: "long" })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <GenerateButtons pagoId={pago.IdPago} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

// botones movidos a componente cliente `components/recibos-generate-buttons.tsx`
