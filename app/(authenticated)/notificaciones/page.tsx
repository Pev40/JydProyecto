import { getNotificaciones, getClientes, getCatalogos } from "@/lib/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Bell, Send, MessageSquare, Mail, Phone } from "lucide-react"
import Link from "next/link"

export default async function NotificacionesPage() {
  const [notificaciones] = await Promise.all([getNotificaciones(), getClientes(), getCatalogos()])

  const notificacionesHoy = notificaciones.filter(
    (n) => new Date(n.FechaEnvio).toDateString() === new Date().toDateString(),
  )

  const notificacionesPendientes = notificaciones.filter((n) => n.Estado === "PENDIENTE")

  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case "WhatsApp":
        return <MessageSquare className="h-4 w-4 text-green-600" />
      case "Email":
        return <Mail className="h-4 w-4 text-blue-600" />
      case "SMS":
        return <Phone className="h-4 w-4 text-purple-600" />
      default:
        return <Bell className="h-4 w-4" />
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
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Notificaciones</h1>
                <p className="text-gray-600 mt-1">{notificaciones.length} notificación(es) registrada(s)</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/notificaciones/enviar">
                <Button>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Notificación
                </Button>
              </Link>
              <Link href="/notificaciones/masivo">
                <Button variant="outline">
                  <Bell className="h-4 w-4 mr-2" />
                  Envío Masivo
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
              <CardTitle className="text-sm font-medium">Notificaciones Hoy</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{notificacionesHoy.length}</div>
              <p className="text-xs text-muted-foreground">Enviadas hoy</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Send className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{notificacionesPendientes.length}</div>
              <p className="text-xs text-muted-foreground">Por enviar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Enviadas</CardTitle>
              <MessageSquare className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {notificaciones.filter((n) => n.Estado === "ENVIADO").length}
              </div>
              <p className="text-xs text-muted-foreground">Exitosas</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de notificaciones */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Notificaciones</CardTitle>
          </CardHeader>
          <CardContent>
            {notificaciones.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha/Hora</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Contenido</TableHead>
                      <TableHead>Responsable</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notificaciones.map((notificacion) => (
                      <TableRow key={notificacion.IdNotificacion}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {new Date(notificacion.FechaEnvio).toLocaleDateString("es-PE")}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(notificacion.FechaEnvio).toLocaleTimeString("es-PE")}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/clientes/${notificacion.IdCliente}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {notificacion.ClienteRazonSocial}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getIconoTipo(notificacion.TipoNotificacion || "")}
                            <span>{notificacion.TipoNotificacion}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate" title={notificacion.Contenido}>
                            {notificacion.Contenido}
                          </div>
                        </TableCell>
                        <TableCell>{notificacion.ResponsableNombre}</TableCell>
                        <TableCell>
                          <Badge variant={notificacion.Estado === "ENVIADO" ? "default" : "secondary"}>
                            {notificacion.Estado}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {notificacion.Estado === "PENDIENTE" && (
                              <Button size="sm" variant="outline">
                                <Send className="h-3 w-3" />
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              Ver Detalles
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="mx-auto h-12 w-12 text-gray-400" />
                <p className="text-gray-500 mt-4">No hay notificaciones registradas.</p>
                <Link href="/notificaciones/enviar" className="mt-4 inline-block">
                  <Button>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Primera Notificación
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
