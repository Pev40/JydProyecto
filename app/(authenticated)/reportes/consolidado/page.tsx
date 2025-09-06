import { getClientes, getPagos, getNotificaciones, getCompromisosPago, getCatalogos } from "@/lib/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileSpreadsheet, Printer, BarChart3 } from "lucide-react"
import Link from "next/link"

export default async function ReporteConsolidadoPage() {
  const [clientes, pagos, notificaciones, compromisos, catalogos] = await Promise.all([
    getClientes(),
    getPagos(),
    getNotificaciones(),
    getCompromisosPago(),
    getCatalogos(),
  ])

  // Generar datos consolidados
  const datosConsolidados = clientes.map((cliente) => {
    const pagosCliente = pagos.filter((p) => p.IdCliente === cliente.IdCliente)
    const notificacionesCliente = notificaciones.filter((n) => n.IdCliente === cliente.IdCliente)
    const compromisosCliente = compromisos.filter((c) => c.IdCliente === cliente.IdCliente)

    const totalPagado = pagosCliente.reduce((sum, p) => sum + Number(p.Monto), 0)
    const ultimoPago =
      pagosCliente.length > 0 ? new Date(Math.max(...pagosCliente.map((p) => new Date(p.Fecha).getTime()))) : null
    const ultimaNotificacion =
      notificacionesCliente.length > 0
        ? new Date(Math.max(...notificacionesCliente.map((n) => new Date(n.FechaEnvio).getTime())))
        : null
    const compromisosActivos = compromisosCliente.filter((c) => c.Estado === "PENDIENTE").length

    return {
      ...cliente,
      totalPagado,
      cantidadPagos: pagosCliente.length,
      ultimoPago,
      cantidadNotificaciones: notificacionesCliente.length,
      ultimaNotificacion,
      compromisosActivos,
      diasSinPago: ultimoPago ? Math.floor((Date.now() - ultimoPago.getTime()) / (1000 * 60 * 60 * 24)) : null,
    }
  })

  const resumenGeneral = {
    totalClientes: clientes.length,
    totalIngresos: datosConsolidados.reduce((sum, c) => sum + c.totalPagado, 0),
    totalPendiente: datosConsolidados.reduce((sum, c) => sum + (c.SaldoPendiente || 0), 0),
    clientesAlDia: datosConsolidados.filter((c) => c.ClasificacionCodigo === "A").length,
    clientesMorosos: datosConsolidados.filter((c) => c.ClasificacionCodigo === "C").length,
    totalNotificaciones: notificaciones.length,
    compromisosActivos: compromisos.filter((c) => c.Estado === "PENDIENTE").length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link href="/reportes">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a Reportes
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Reporte Consolidado</h1>
                <p className="text-gray-600 mt-1">Vista completa del estado de cobranza</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Ver Gráficos
              </Button>
              <Button>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Resumen Ejecutivo */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Resumen Ejecutivo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{resumenGeneral.totalClientes}</div>
                <div className="text-sm text-gray-600">Total Clientes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  S/ {resumenGeneral.totalIngresos.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-gray-600">Total Ingresos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">
                  S/ {resumenGeneral.totalPendiente.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-gray-600">Saldo Pendiente</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{resumenGeneral.clientesMorosos}</div>
                <div className="text-sm text-gray-600">Clientes Morosos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Distribución por Clasificación */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {catalogos.clasificaciones.map((clasificacion) => {
            const clientesClasif = datosConsolidados.filter((c) => c.ClasificacionCodigo === clasificacion.Codigo)
            const totalPagadoClasif = clientesClasif.reduce((sum, c) => sum + c.totalPagado, 0)
            const saldoPendienteClasif = clientesClasif.reduce((sum, c) => sum + (c.SaldoPendiente || 0), 0)

            return (
              <Card key={clasificacion.IdClasificacion}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={
                        clasificacion.Color === "green"
                          ? "bg-green-100 text-green-800"
                          : clasificacion.Color === "orange"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-red-100 text-red-800"
                      }
                    >
                      {clasificacion.Codigo}
                    </Badge>
                    {clasificacion.Descripcion}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Clientes:</span>
                      <span className="font-medium">{clientesClasif.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Pagado:</span>
                      <span className="font-medium text-green-600">
                        S/ {totalPagadoClasif.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Pendiente:</span>
                      <span className="font-medium text-orange-600">
                        S/ {saldoPendienteClasif.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Tabla Consolidada */}
        <Card>
          <CardHeader>
            <CardTitle>Detalle Consolidado por Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Clasificación</TableHead>
                    <TableHead>Total Pagado</TableHead>
                    <TableHead>Saldo Pendiente</TableHead>
                    <TableHead>Último Pago</TableHead>
                    <TableHead>Días sin Pago</TableHead>
                    <TableHead>Notificaciones</TableHead>
                    <TableHead>Compromisos</TableHead>
                    <TableHead>% Cumplimiento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datosConsolidados.map((cliente) => {
                    const totalEsperado = cliente.totalPagado + (cliente.SaldoPendiente || 0)
                    const porcentajeCumplimiento = totalEsperado > 0 ? (cliente.totalPagado / totalEsperado) * 100 : 0

                    return (
                      <TableRow key={cliente.IdCliente}>
                        <TableCell>
                          <div>
                            <Link
                              href={`/clientes/${cliente.IdCliente}`}
                              className="font-medium text-blue-600 hover:text-blue-800"
                            >
                              {cliente.RazonSocial}
                            </Link>
                            <div className="text-sm text-gray-500">{cliente.RucDni}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              cliente.ClasificacionColor === "green"
                                ? "bg-green-100 text-green-800"
                                : cliente.ClasificacionColor === "orange"
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-red-100 text-red-800"
                            }
                          >
                            {cliente.ClasificacionCodigo}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-green-600 font-medium">
                          S/ {cliente.totalPagado.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-orange-600 font-medium">
                          S/ {(cliente.SaldoPendiente || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          {cliente.ultimoPago ? cliente.ultimoPago.toLocaleDateString("es-PE") : "Sin pagos"}
                        </TableCell>
                        <TableCell>
                          {cliente.diasSinPago !== null ? (
                            <Badge variant={cliente.diasSinPago > 30 ? "destructive" : "secondary"}>
                              {cliente.diasSinPago} días
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>{cliente.cantidadNotificaciones}</TableCell>
                        <TableCell>
                          {cliente.compromisosActivos > 0 ? (
                            <Badge variant="outline">{cliente.compromisosActivos}</Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  porcentajeCumplimiento >= 80
                                    ? "bg-green-500"
                                    : porcentajeCumplimiento >= 50
                                      ? "bg-orange-500"
                                      : "bg-red-500"
                                }`}
                                style={{ width: `${Math.min(porcentajeCumplimiento, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm">{porcentajeCumplimiento.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
