import { getPagos, getClientes } from "@/lib/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Upload, Download, Eye, FileText, ImageIcon, CheckCircle, X } from "lucide-react"
import Link from "next/link"

export default async function ComprobantesPage() {
  const [pagos] = await Promise.all([getPagos(), getClientes()])

  const pagosConComprobante = pagos.filter((p) => p.UrlComprobante)
  const pagosSinComprobante = pagos.filter((p) => !p.UrlComprobante)

  const getIconoTipoArchivo = (url: string | null) => {
    if (!url) return <FileText className="h-4 w-4 text-gray-400" />

    const extension = url.split(".").pop()?.toLowerCase()
    switch (extension) {
      case "pdf":
        return <FileText className="h-4 w-4 text-red-500" />
      case "jpg":
      case "jpeg":
      case "png":
        return <ImageIcon className="h-4 w-4 text-blue-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

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
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Comprobantes</h1>
                <p className="text-gray-600 mt-1">Administrar comprobantes de pago</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar Lista
              </Button>
              <Link href="/pagos/nuevo">
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Comprobante
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pagos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pagos.length}</div>
              <p className="text-xs text-muted-foreground">Pagos registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Con Comprobante</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{pagosConComprobante.length}</div>
              <p className="text-xs text-muted-foreground">
                {pagos.length > 0 ? Math.round((pagosConComprobante.length / pagos.length) * 100) : 0}% del total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sin Comprobante</CardTitle>
              <X className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{pagosSinComprobante.length}</div>
              <p className="text-xs text-muted-foreground">Requieren comprobante</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de comprobantes */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Comprobantes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Comprobante</TableHead>
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
                    <TableCell>{pago.Concepto}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getIconoTipoArchivo(pago.UrlComprobante)}
                        {pago.UrlComprobante ? (
                          <span className="text-sm text-green-600">Adjunto</span>
                        ) : (
                          <span className="text-sm text-red-600">Sin comprobante</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={pago.Estado === "CONFIRMADO" ? "default" : "secondary"}>{pago.Estado}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {pago.UrlComprobante ? (
                          <>
                            <Button size="sm" variant="outline" asChild>
                              <a href={pago.UrlComprobante} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-3 w-3" />
                              </a>
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                              <a href={pago.UrlComprobante} download>
                                <Download className="h-3 w-3" />
                              </a>
                            </Button>
                          </>
                        ) : (
                          <Link href={`/pagos/${pago.IdPago}/comprobante`}>
                            <Button size="sm" variant="outline">
                              <Upload className="h-3 w-3" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagos sin comprobante */}
        {pagosSinComprobante.length > 0 && (
          <Card className="mt-6 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-800 flex items-center gap-2">
                <X className="h-5 w-5" />
                Pagos Sin Comprobante - Acción Requerida
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pagosSinComprobante.slice(0, 5).map((pago) => (
                  <div key={pago.IdPago} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div>
                      <div className="font-medium">{pago.ClienteRazonSocial}</div>
                      <div className="text-sm text-gray-500">
                        S/ {Number(pago.Monto).toLocaleString("es-PE", { minimumFractionDigits: 2 })} -{" "}
                        {new Date(pago.Fecha).toLocaleDateString("es-PE")}
                      </div>
                    </div>
                    <Link href={`/pagos/${pago.IdPago}/comprobante`}>
                      <Button size="sm">
                        <Upload className="h-3 w-3 mr-1" />
                        Subir
                      </Button>
                    </Link>
                  </div>
                ))}
                {pagosSinComprobante.length > 5 && (
                  <div className="text-center text-sm text-gray-500">
                    Y {pagosSinComprobante.length - 5} pagos más sin comprobante...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
