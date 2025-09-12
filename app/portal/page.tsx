import { getCurrentUser } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, CreditCard, DollarSign, User } from "lucide-react"
import { redirect } from "next/navigation"
import { ReloadButton } from "@/components/reload-button"

const sql = neon(process.env.DATABASE_URL!)

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic'

export default async function PortalPage() {
  const user = await getCurrentUser()

  if (!user || user.rol !== "CLIENTE") {
    redirect("/login")
  }

  // Verificar que el usuario tenga idCliente
  if (!user.idCliente) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error de Configuración</h1>
          <p className="text-gray-600 mb-4">Tu cuenta no tiene un cliente asociado. Contacta al administrador.</p>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Cerrar Sesión
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Obtener información del cliente
  let clienteResult, compromisosPago, pagos, compromisos, notificaciones, pagosPendientes
  
  try {
    clienteResult = await sql`
      SELECT c.*, cl."Descripcion" as "Clasificacion"
      FROM "Cliente" c
      LEFT JOIN "Clasificacion" cl ON c."IdClasificacion" = cl."IdClasificacion"
      WHERE c."IdCliente" = ${user.idCliente}
    `

    if (clienteResult.length === 0) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Cliente no encontrado</h1>
            <p className="text-gray-600 mb-4">No se encontró información del cliente asociado a tu cuenta.</p>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Cerrar Sesión
              </button>
            </form>
          </div>
        </div>
      )
    }

    const clienteData = clienteResult[0]

    // Obtener datos de forma paralela para mejorar performance
    const [
      compromisosPagoResult,
      pagosResult,
      compromisosResult,
      notificacionesResult,
      pagosPendientesResult
    ] = await Promise.all([
      // Compromisos de pago del cliente
      sql`
        SELECT cp.*, s."Nombre" as "ServicioNombre"
        FROM "CompromisoPago" cp
        LEFT JOIN "Servicio" s ON s."IdServicio" = (
          SELECT "IdServicio" FROM "Cliente" WHERE "IdCliente" = cp."IdCliente"
        )
        WHERE cp."IdCliente" = ${user.idCliente}
        ORDER BY cp."FechaCompromiso"
      `,
      // Pagos realizados
      sql`
        SELECT p.*, s."Nombre" as "ServicioNombre"
        FROM "Pago" p
        LEFT JOIN "Cliente" c ON p."IdCliente" = c."IdCliente"
        LEFT JOIN "Servicio" s ON c."IdServicio" = s."IdServicio"
        WHERE p."IdCliente" = ${user.idCliente}
        ORDER BY p."Fecha" DESC
        LIMIT 5
      `,
      // Compromisos pendientes
      sql`
        SELECT * FROM "CompromisoPago"
        WHERE "IdCliente" = ${user.idCliente} AND "Estado" = 'PENDIENTE'
        ORDER BY "FechaCompromiso"
      `,
      // Notificaciones del cliente
      sql`
        SELECT * FROM "Notificacion" 
        WHERE "IdCliente" = ${user.idCliente}
        ORDER BY "FechaEnvio" DESC
        LIMIT 5
      `,
      // Pagos pendientes
      sql`
        SELECT COUNT(*) as count FROM "CompromisoPago" 
        WHERE "IdCliente" = ${user.idCliente} AND "Estado" = 'PENDIENTE'
      `
    ])

    compromisosPago = compromisosPagoResult
    pagos = pagosResult
    compromisos = compromisosResult
    notificaciones = notificacionesResult
    pagosPendientes = pagosPendientesResult

  } catch (error) {
    console.error("Error al obtener datos del portal:", error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error de Base de Datos</h1>
          <p className="text-gray-600 mb-4">Hubo un problema al cargar tus datos. Intenta nuevamente.</p>
          <ReloadButton className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium mr-2">
            Recargar
          </ReloadButton>
          <form action="/api/auth/logout" method="POST" className="inline">
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Cerrar Sesión
            </button>
          </form>
        </div>
      </div>
    )
  }

  const clienteData = clienteResult[0]
  
  // Calcular estadísticas
  type PagoRow = { IdPago: number; Monto: string | number; Fecha: string; MedioPago: string }
  type NotifRow = { IdNotificacion: number; TipoNotificacion: string; FechaEnvio: string; Mensaje: string }
  const totalPagado = (pagos as PagoRow[]).reduce((sum, pago) => sum + Number.parseFloat(String(pago.Monto)), 0)
  const currentYear = new Date().getFullYear()
  const pagosEsteAno = (pagos as PagoRow[]).filter((pago) => new Date(pago.Fecha).getFullYear() === currentYear)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Portal del Cliente</h1>
              <p className="text-gray-600">Bienvenido, {user.nombre}</p>
            </div>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Cerrar Sesión
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">S/ {totalPagado.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{pagos.length} pagos realizados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cuotas Pendientes</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pagosPendientes[0].count}</div>
              <p className="text-xs text-muted-foreground">Por vencer próximamente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estado</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Badge variant={clienteData.Clasificacion === "NORMAL" ? "default" : "destructive"}>
                  {clienteData.Clasificacion}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Clasificación actual</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Este Año</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pagosEsteAno.length}</div>
              <p className="text-xs text-muted-foreground">Pagos en {currentYear}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Información Personal */}
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>Datos de tu cuenta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Nombre</label>
                <p className="text-lg">{clienteData.RazonSocial}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">RUC/DNI</label>
                <p className="text-lg font-mono">{clienteData.RucDni}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-lg">{clienteData.Email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Teléfono</label>
                <p className="text-lg">{clienteData.Telefono}</p>
              </div>
              {clienteData.NombreContacto && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Contacto</label>
                  <p className="text-lg">{clienteData.NombreContacto}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Últimos Pagos */}
          <Card>
            <CardHeader>
              <CardTitle>Últimos Pagos</CardTitle>
              <CardDescription>Historial de pagos recientes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(pagos as PagoRow[]).slice(0, 5).map((pago) => (
                  <div key={pago.IdPago} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">S/ {Number.parseFloat(pago.Monto).toFixed(2)}</p>
                      <p className="text-sm text-gray-500">{new Date(pago.Fecha).toLocaleDateString()}</p>
                    </div>
                    <Badge variant="outline">{pago.MedioPago}</Badge>
                  </div>
                ))}
                {pagos.length === 0 && <p className="text-center text-gray-500 py-4">No hay pagos registrados</p>}
              </div>
            </CardContent>
          </Card>

          {/* Notificaciones */}
          <Card>
            <CardHeader>
              <CardTitle>Notificaciones Recientes</CardTitle>
              <CardDescription>Últimas comunicaciones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(notificaciones as NotifRow[]).map((notif) => (
                  <div key={notif.IdNotificacion} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{notif.TipoNotificacion}</Badge>
                      <span className="text-xs text-gray-500">{new Date(notif.FechaEnvio).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm">{notif.Mensaje}</p>
                  </div>
                ))}
                {notificaciones.length === 0 && <p className="text-center text-gray-500 py-4">No hay notificaciones</p>}
              </div>
            </CardContent>
          </Card>

          {/* Calendario de Cuotas */}
          <Card>
            <CardHeader>
              <CardTitle>Estado de Cuotas {currentYear}</CardTitle>
              <CardDescription>Progreso de pagos mensuales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 12 }, (_, i) => {
                  const mes = i + 1
                  const nombreMes = new Date(currentYear, i, 1).toLocaleDateString("es-ES", { month: "long" })
                  const pagoMes = pagosEsteAno.find((pago) => new Date(pago.Fecha).getMonth() === i)

                  return (
                    <div key={mes} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{nombreMes}</span>
                      <div className="flex items-center space-x-2">
                        {pagoMes ? (
                          <>
                            <Badge variant="default">Pagado</Badge>
                            <span className="text-sm text-gray-500">
                              S/ {Number.parseFloat(pagoMes.Monto).toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <Badge variant="secondary">Pendiente</Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
