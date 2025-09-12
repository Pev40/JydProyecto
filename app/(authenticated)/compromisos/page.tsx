import { getCompromisosPago, getClientes } from "@/lib/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Calendar, CheckCircle, Clock, AlertTriangle, DollarSign, Edit } from "lucide-react"
import Link from "next/link"

export default async function CompromisosPage() {
  const [compromisos] = await Promise.all([getCompromisosPago(), getClientes()])

  const compromisosHoy = compromisos.filter(
    (c) => new Date(c.FechaCompromiso).toDateString() === new Date().toDateString(),
  )

  const compromisosPendientes = compromisos.filter((c) => c.Estado === "PENDIENTE")
  const compromisosVencidos = compromisos.filter(
    (c) => c.Estado === "PENDIENTE" && new Date(c.FechaCompromiso) < new Date(),
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con colores corporativos */}
      <header className="jd-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white">Compromisos de Pago</h1>
                <p className="text-white/80 mt-1">{compromisos.length} compromiso(s) registrado(s)</p>
              </div>
            </div>
            <Link href="/compromisos/nuevo">
              <Button className="bg-white text-jd-primary hover:bg-white/90">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Compromiso
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards con colores corporativos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="jd-card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-jd-gray">Compromisos Hoy</CardTitle>
              <Calendar className="h-4 w-4 text-jd-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-jd-primary">{compromisosHoy.length}</div>
              <p className="text-xs text-jd-gray">Vencen hoy</p>
            </CardContent>
          </Card>

          <Card className="jd-card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-jd-gray">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{compromisosPendientes.length}</div>
              <p className="text-xs text-jd-gray">Por cumplir</p>
            </CardContent>
          </Card>

          <Card className="jd-card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-jd-gray">Vencidos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{compromisosVencidos.length}</div>
              <p className="text-xs text-jd-gray">Incumplidos</p>
            </CardContent>
          </Card>

          <Card className="jd-card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-jd-gray">Cumplidos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {compromisos.filter((c) => c.Estado === "CUMPLIDO").length}
              </div>
              <p className="text-xs text-jd-gray">Exitosos</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de compromisos con funcionalidad de pago directo */}
        <Card className="jd-card">
          <CardHeader>
            <CardTitle className="text-jd-primary">Lista de Compromisos de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            {compromisos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="jd-table">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Fecha Compromiso</th>
                      <th>Monto</th>
                      <th>Estado</th>
                      <th>Responsable</th>
                      <th>Observaciones</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compromisos.map((compromiso) => {
                      const fechaCompromiso = new Date(compromiso.FechaCompromiso)
                      const hoy = new Date()
                      const esVencido = compromiso.Estado === "PENDIENTE" && fechaCompromiso < hoy
                      const esHoy = fechaCompromiso.toDateString() === hoy.toDateString()

                      return (
                        <tr key={compromiso.IdCompromisoPago} className={esVencido ? "bg-red-50" : ""}>
                          <td>
                            <Link
                              href={`/clientes/${compromiso.IdCliente}`}
                              className="text-jd-primary hover:text-jd-primary-dark font-medium"
                            >
                              {compromiso.ClienteRazonSocial}
                            </Link>
                          </td>
                          <td>
                            <div className={esHoy ? "font-bold text-jd-primary" : ""}>
                              {fechaCompromiso.toLocaleDateString("es-PE")}
                              {esHoy && <span className="text-xs block text-jd-primary">HOY</span>}
                            </div>
                          </td>
                          <td className="font-medium">
                            S/{" "}
                            {Number(compromiso.MontoCompromiso).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
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
                            <div className="max-w-xs truncate text-jd-gray" title={compromiso.Observaciones || ""}>
                              {compromiso.Observaciones || "-"}
                            </div>
                          </td>
                          <td>
                            <div className="flex gap-2">
                              {compromiso.Estado === "PENDIENTE" && (
                                <>
                                  {/* Botón para registrar pago directo desde compromiso */}
                                  <Link
                                    href={`/pagos/nuevo?cliente=${compromiso.IdCliente}&compromiso=${compromiso.IdCompromisoPago}&monto=${compromiso.MontoCompromiso}&concepto=Cumplimiento de compromiso de pago`}
                                  >
                                    <Button size="sm" className="jd-button-primary text-xs">
                                      <DollarSign className="h-3 w-3 mr-1" />
                                      Registrar Pago
                                    </Button>
                                  </Link>

                                  {/* Botón para marcar como cumplido */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="jd-button-outline text-xs bg-transparent"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Cumplido
                                  </Button>
                                </>
                              )}

                              {/* Botón para editar */}
                              <Link href={`/compromisos/${compromiso.IdCompromisoPago}/editar`}>
                                <Button size="sm" variant="outline" className="text-xs bg-transparent">
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </Link>
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
                <Calendar className="mx-auto h-12 w-12 text-jd-gray" />
                <p className="text-jd-gray mt-4">No hay compromisos de pago registrados.</p>
                <Link href="/compromisos/nuevo" className="mt-4 inline-block">
                  <Button className="jd-button-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Primer Compromiso
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
