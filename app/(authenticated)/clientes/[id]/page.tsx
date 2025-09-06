import { getClienteById, getPagosByClienteId, getNotificaciones, getCompromisosPago } from "@/lib/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Edit, DollarSign, Bell, Calendar, Phone, Mail, Building, CheckCircle, LinkIcon } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

interface PageProps {
  params: {
    id: string
  }
}

export default async function ClienteDetallePage({ params }: PageProps) {
  const clienteId = Number.parseInt(params.id)

  if (isNaN(clienteId)) {
    notFound()
  }

  const [cliente, pagos, notificaciones, compromisos] = await Promise.all([
    getClienteById(clienteId),
    getPagosByClienteId(clienteId),
    getNotificaciones(clienteId),
    getCompromisosPago(clienteId),
  ])

  if (!cliente) {
    notFound()
  }

  const getClasificacionBadge = (codigo: string | undefined, color: string | undefined) => {
    if (!codigo) return null

    const colorClass =
      color === "green"
        ? "jd-badge-success"
        : color === "orange"
          ? "jd-badge-warning"
          : color === "red"
            ? "jd-badge-danger"
            : "jd-badge-info"

    return (
      <Badge className={colorClass}>
        {codigo} - {cliente.ClasificacionDescripcion}
      </Badge>
    )
  }

  const totalPagado = pagos.reduce((sum, pago) => sum + Number(pago.Monto), 0)
  const saldoPendiente = cliente.MontoFijoMensual * 12 - totalPagado // Simplificado

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con colores corporativos */}
      <header className="jd-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link href="/clientes">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white">{cliente.RazonSocial}</h1>
                <p className="text-white/80 mt-1">RUC/DNI: {cliente.RucDni}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href={`/clientes/${cliente.IdCliente}/editar`}>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </Link>
              <Link href={`/pagos/nuevo?cliente=${cliente.IdCliente}`}>
                <Button className="bg-white text-jd-primary hover:bg-white/90">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Registrar Pago
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Información del Cliente */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 jd-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-jd-primary">
                <Building className="h-5 w-5" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-jd-gray">Razón Social</label>
                  <p className="font-medium text-jd-primary">{cliente.RazonSocial}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-jd-gray">RUC/DNI</label>
                  <p className="font-medium">{cliente.RucDni}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-jd-gray">Contacto</label>
                  <p className="font-medium">{cliente.NombreContacto || "No especificado"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-jd-gray">Último Dígito RUC</label>
                  <p className="font-medium">{cliente.UltimoDigitoRUC}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-jd-gray">Cartera</label>
                  <p className="font-medium">{cliente.CarteraNombre || "No asignada"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-jd-gray">Servicio</label>
                  <p className="font-medium">{cliente.ServicioNombre || "No especificado"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-jd-gray">Categoría Empresa</label>
                  <p className="font-medium">{cliente.CategoriaEmpresaNombre || "No especificada"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-jd-gray">Monto Fijo Mensual</label>
                  <p className="font-medium text-jd-primary">
                    S/ {cliente.MontoFijoMensual.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {(cliente.Email || cliente.Telefono) && (
                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-jd-gray block mb-2">Contacto</label>
                  <div className="flex gap-4">
                    {cliente.Email && (
                      <a
                        href={`mailto:${cliente.Email}`}
                        className="flex items-center gap-2 text-jd-primary hover:text-jd-primary-dark"
                      >
                        <Mail className="h-4 w-4" />
                        {cliente.Email}
                      </a>
                    )}
                    {cliente.Telefono && (
                      <a
                        href={`tel:${cliente.Telefono}`}
                        className="flex items-center gap-2 text-green-600 hover:text-green-800"
                      >
                        <Phone className="h-4 w-4" />
                        {cliente.Telefono}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="jd-card">
            <CardHeader>
              <CardTitle className="text-jd-primary">Estado Financiero</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-jd-gray">Clasificación</label>
                <div className="mt-1">
                  {getClasificacionBadge(cliente.ClasificacionCodigo, cliente.ClasificacionColor)}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-jd-gray">Total Pagado</label>
                <p className="text-2xl font-bold text-green-600">
                  S/ {totalPagado.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-jd-gray">Saldo Pendiente</label>
                <p className={`text-2xl font-bold ${saldoPendiente > 0 ? "text-red-600" : "text-green-600"}`}>
                  S/ {saldoPendiente.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="pt-4 border-t">
                <Button className="w-full jd-button-outline">
                  <Bell className="h-4 w-4 mr-2" />
                  Enviar Recordatorio
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs con información detallada */}
        <Tabs defaultValue="pagos" className="space-y-6">
          <TabsList className="bg-jd-primary/10">
            <TabsTrigger value="pagos" className="data-[state=active]:bg-jd-primary data-[state=active]:text-white">
              Historial de Pagos
            </TabsTrigger>
            <TabsTrigger
              value="compromisos"
              className="data-[state=active]:bg-jd-primary data-[state=active]:text-white"
            >
              Compromisos de Pago
            </TabsTrigger>
            <TabsTrigger
              value="notificaciones"
              className="data-[state=active]:bg-jd-primary data-[state=active]:text-white"
            >
              Notificaciones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pagos">
            <Card className="jd-card">
              <CardHeader>
                <CardTitle className="text-jd-primary">Historial de Pagos</CardTitle>
              </CardHeader>
              <CardContent>
                {pagos.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="jd-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Monto</th>
                          <th>Banco</th>
                          <th>Concepto</th>
                          <th>Mes Servicio</th>
                          <th>Estado</th>
                          <th>Compromiso</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagos.map((pago) => {
                          // Buscar si este pago está vinculado a un compromiso
                          const compromisoVinculado = compromisos.find((c) => c.IdPagoVinculado === pago.IdPago)

                          return (
                            <tr key={pago.IdPago}>
                              <td>{new Date(pago.Fecha).toLocaleDateString("es-PE")}</td>
                              <td className="font-medium text-jd-primary">
                                S/ {Number(pago.Monto).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                              </td>
                              <td>{pago.BancoNombre}</td>
                              <td>{pago.Concepto}</td>
                              <td>
                                {new Date(pago.MesServicio).toLocaleDateString("es-PE", {
                                  year: "numeric",
                                  month: "long",
                                })}
                              </td>
                              <td>
                                <Badge
                                  className={pago.Estado === "CONFIRMADO" ? "jd-badge-success" : "jd-badge-warning"}
                                >
                                  {pago.Estado}
                                </Badge>
                              </td>
                              <td>
                                {compromisoVinculado ? (
                                  <div className="flex items-center gap-1 text-xs">
                                    <LinkIcon className="h-3 w-3 text-jd-primary" />
                                    <span className="text-jd-primary">Vinculado</span>
                                  </div>
                                ) : (
                                  <span className="text-jd-gray text-xs">-</span>
                                )}
                              </td>
                              <td>
                                {pago.Estado !== "CONFIRMADO" && (
                                  <Link href={`/pagos/nuevo?cliente=${cliente.IdCliente}&monto=${cliente.MontoFijoMensual}&concepto=Servicio mensual - ${cliente.ServicioNombre || 'Servicio contable'}`}>
                                    <Button size="sm" className="jd-button-primary text-xs">
                                      <DollarSign className="h-3 w-3 mr-1" />
                                      Pagar
                                    </Button>
                                  </Link>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    
                    {/* Botón para agregar nuevo pago al final de la tabla */}
                    <div className="mt-4 pt-4 border-t">
                      <Link href={`/pagos/nuevo?cliente=${cliente.IdCliente}&monto=${cliente.MontoFijoMensual}&concepto=Servicio mensual - ${cliente.ServicioNombre || 'Servicio contable'}`}>
                        <Button className="jd-button-primary">
                          <DollarSign className="h-4 w-4 mr-2" />
                          Registrar Nuevo Pago
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-jd-gray">No hay pagos registrados para este cliente.</p>
                    <Link href={`/pagos/nuevo?cliente=${cliente.IdCliente}`} className="mt-4 inline-block">
                      <Button className="jd-button-primary">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Registrar Primer Pago
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compromisos">
            <Card className="jd-card">
              <CardHeader>
                <CardTitle className="text-jd-primary">Compromisos de Pago</CardTitle>
              </CardHeader>
              <CardContent>
                {compromisos.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="jd-table">
                      <thead>
                        <tr>
                          <th>Fecha Compromiso</th>
                          <th>Monto</th>
                          <th>Estado</th>
                          <th>Responsable</th>
                          <th>Pago Vinculado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {compromisos.map((compromiso) => {
                          const pagoVinculado = pagos.find((p) => p.IdPago === compromiso.IdPagoVinculado)
                          const fechaCompromiso = new Date(compromiso.FechaCompromiso)
                          const esVencido = compromiso.Estado === "PENDIENTE" && fechaCompromiso < new Date()

                          return (
                            <tr key={compromiso.IdCompromisoPago}>
                              <td>{fechaCompromiso.toLocaleDateString("es-PE")}</td>
                              <td className="font-medium text-jd-primary">
                                S/{" "}
                                {Number(compromiso.MontoCompromiso).toLocaleString("es-PE", {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                              <td>
                                <Badge
                                  className={
                                    compromiso.Estado === "CUMPLIDO"
                                      ? "jd-badge-success"
                                      : esVencido
                                        ? "jd-badge-danger"
                                        : "jd-badge-warning"
                                  }
                                >
                                  {esVencido ? "VENCIDO" : compromiso.Estado}
                                </Badge>
                              </td>
                              <td className="text-jd-gray">{compromiso.ResponsableNombre}</td>
                              <td>
                                {pagoVinculado ? (
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span className="text-sm text-green-600">
                                      S/{" "}
                                      {Number(pagoVinculado.Monto).toLocaleString("es-PE", {
                                        minimumFractionDigits: 2,
                                      })}
                                    </span>
                                  </div>
                                ) : compromiso.Estado === "PENDIENTE" ? (
                                  <Link
                                    href={`/pagos/nuevo?cliente=${cliente.IdCliente}&compromiso=${compromiso.IdCompromisoPago}&monto=${compromiso.MontoCompromiso}&concepto=Cumplimiento de compromiso de pago`}
                                  >
                                    <Button size="sm" className="jd-button-primary text-xs">
                                      <DollarSign className="h-3 w-3 mr-1" />
                                      Registrar
                                    </Button>
                                  </Link>
                                ) : (
                                  <span className="text-jd-gray text-xs">-</span>
                                )}
                              </td>
                              <td>
                                <div className="flex gap-1">
                                  {compromiso.Estado === "PENDIENTE" && !pagoVinculado && (
                                    <Link href={`/clientes/${cliente.IdCliente}/compromisos/${compromiso.IdCompromisoPago}/editar`}>
                                      <Button size="sm" variant="outline" className="text-xs bg-transparent">
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                    </Link>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-jd-gray">No hay compromisos de pago registrados.</p>
                    <Link href={`/clientes/${cliente.IdCliente}/compromisos/nuevo`}>
                      <Button className="mt-4 jd-button-primary">
                        <Calendar className="h-4 w-4 mr-2" />
                        Registrar Compromiso
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notificaciones">
            <Card className="jd-card">
              <CardHeader>
                <CardTitle className="text-jd-primary">Historial de Notificaciones</CardTitle>
              </CardHeader>
              <CardContent>
                {notificaciones.length > 0 ? (
                  <div className="space-y-4">
                    {notificaciones.map((notificacion) => (
                      <div key={notificacion.IdNotificacion} className="border rounded-lg p-4 hover:bg-jd-primary/5">
                        <div className="flex justify-between items-start mb-2">
                          <Badge className="jd-badge-info">{notificacion.TipoNotificacionNombre}</Badge>
                          <span className="text-sm text-jd-gray">
                            {new Date(notificacion.FechaEnvio).toLocaleString("es-PE")}
                          </span>
                        </div>
                        <p className="text-sm">{notificacion.Contenido}</p>
                        {notificacion.ResponsableNombre && (
                          <p className="text-xs text-jd-gray mt-2">Enviado por: {notificacion.ResponsableNombre}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-jd-gray">No hay notificaciones enviadas a este cliente.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
