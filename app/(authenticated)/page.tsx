import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DashboardCharts } from "@/components/dashboard-charts"
import { AlertasCompromisos } from "@/components/alertas-compromisos"
import { DatabaseStatus } from "@/components/database-status"
import {
  Users,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  FileText,
  Target,
  Activity,
  CheckCircle,
  Clock,
  ArrowUpRight,
} from "lucide-react"
import Link from "next/link"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getDashboardStats, getActividadesRecientes } from "@/lib/queries"

export default async function Dashboard() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.rol === "CLIENTE") {
    redirect("/portal/dashboard")
  }

  // Obtener datos reales del dashboard
  const [dashboardStats, actividadesRecientes] = await Promise.all([
    getDashboardStats(),
    getActividadesRecientes()
  ])

  // Formatear números para mostrar
  const formatearNumero = (numero: number): string => {
    return numero.toLocaleString('es-PE')
  }

  const formatearMoneda = (numero: number): string => {
    return `S/ ${numero.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatearVariacion = (variacion: number): { texto: string, tipo: 'positive' | 'negative' } => {
    const signo = variacion >= 0 ? '+' : ''
    return {
      texto: `${signo}${variacion}%`,
      tipo: variacion >= 0 ? 'positive' : 'negative'
    }
  }

  // Estadísticas del dashboard con datos reales
  const stats = [
    {
      title: "Clientes Activos",
      value: formatearNumero(dashboardStats.clientesActivos),
      change: formatearVariacion(dashboardStats.variacionClientesActivos).texto,
      changeType: formatearVariacion(dashboardStats.variacionClientesActivos).tipo,
      icon: Users,
      color: "jd-primary",
    },
    {
      title: "Pagos Este Mes",
      value: formatearMoneda(dashboardStats.pagosMesActual),
      change: formatearVariacion(dashboardStats.variacionPagosMes).texto,
      changeType: formatearVariacion(dashboardStats.variacionPagosMes).tipo,
      icon: CreditCard,
      color: "green",
    },
    {
      title: "Ingresos Totales",
      value: formatearMoneda(dashboardStats.ingresosTotales),
      change: formatearVariacion(dashboardStats.variacionIngresosTotales).texto,
      changeType: formatearVariacion(dashboardStats.variacionIngresosTotales).tipo,
      icon: TrendingUp,
      color: "blue",
    },
    {
      title: "Clientes Morosos",
      value: formatearNumero(dashboardStats.clientesMorosos),
      change: formatearVariacion(dashboardStats.variacionClientesMorosos).texto,
      changeType: formatearVariacion(dashboardStats.variacionClientesMorosos).tipo,
      icon: AlertTriangle,
      color: "red",
    },
  ]

  const quickActions = [
    {
      title: "Nuevo Cliente",
      description: "Registrar un nuevo cliente",
      href: "/clientes/nuevo",
      icon: Users,
      color: "jd-primary",
    },
    {
      title: "Registrar Pago",
      description: "Registrar un nuevo pago",
      href: "/pagos/nuevo",
      icon: CreditCard,
      color: "green",
    },
    {
      title: "Enviar Notificación",
      description: "Enviar recordatorio a clientes",
      href: "/notificaciones/enviar",
      icon: FileText,
      color: "blue",
    },
    {
      title: "Ver Reportes",
      description: "Consultar reportes y estadísticas",
      href: "/reportes",
      icon: Activity,
      color: "purple",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header principal */}
      <div className="jd-header shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">Bienvenido, {user.nombre}</h1>
                <p className="text-white/80 mt-1">Panel de control - Sistema de Cobranza J&D Consultores</p>
              </div>
              <div className="flex items-center gap-4">
                <Badge className="jd-badge-secondary">{user.rol}</Badge>
                <DatabaseStatus />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="jd-card jd-hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                      <div className="flex items-center mt-2">
                        <span
                          className={`text-sm font-medium ${
                            stat.changeType === "positive" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {stat.change}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">vs mes anterior</span>
                      </div>
                    </div>
                    <div
                      className={`p-3 rounded-lg ${
                        stat.color === "jd-primary"
                          ? "bg-blue-100"
                          : stat.color === "green"
                            ? "bg-green-100"
                            : stat.color === "blue"
                              ? "bg-blue-100"
                              : "bg-red-100"
                      }`}
                    >
                      <Icon
                        className={`h-6 w-6 ${
                          stat.color === "jd-primary"
                            ? "text-blue-600"
                            : stat.color === "green"
                              ? "text-green-600"
                              : stat.color === "blue"
                                ? "text-blue-600"
                                : "text-red-600"
                        }`}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Acciones rápidas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <Card className="jd-card">
              <CardHeader className="jd-header rounded-t-lg">
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Acciones Rápidas
                </CardTitle>
                <CardDescription className="text-white/80">
                  Accesos directos a las funciones más utilizadas
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon
                    return (
                      <Link key={index} href={action.href}>
                        <div className="jd-card p-4 hover:shadow-lg transition-all duration-200 cursor-pointer group">
                          <div className="flex items-center gap-4">
                            <div
                              className={`p-3 rounded-lg ${
                                action.color === "jd-primary"
                                  ? "bg-blue-100 group-hover:bg-blue-200"
                                  : action.color === "green"
                                    ? "bg-green-100 group-hover:bg-green-200"
                                    : action.color === "blue"
                                      ? "bg-blue-100 group-hover:bg-blue-200"
                                      : "bg-purple-100 group-hover:bg-purple-200"
                              } transition-colors`}
                            >
                              <Icon
                                className={`h-5 w-5 ${
                                  action.color === "jd-primary"
                                    ? "text-blue-600"
                                    : action.color === "green"
                                      ? "text-green-600"
                                      : action.color === "blue"
                                        ? "text-blue-600"
                                        : "text-purple-600"
                                }`}
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {action.title}
                              </h3>
                              <p className="text-sm text-gray-600">{action.description}</p>
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actividad reciente */}
          <Card className="jd-card">
            <CardHeader className="jd-header rounded-t-lg">
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Actividad Reciente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {actividadesRecientes.map((actividad) => (
                  <div
                    key={actividad.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`p-2 rounded-full ${
                        actividad.estado === "CONFIRMADO" || actividad.estado === "completed"
                          ? "bg-green-100"
                          : actividad.estado === "nuevo" || actividad.tipo === "cliente"
                            ? "bg-blue-100"
                            : actividad.estado === "enviado" || actividad.estado === "ENVIADO"
                              ? "bg-yellow-100"
                              : actividad.tipo === "compromiso"
                                ? "bg-purple-100"
                                : "bg-gray-100"
                      }`}
                    >
                      {actividad.tipo === "pago" ? (
                        <CreditCard className="h-4 w-4 text-green-600" />
                      ) : actividad.tipo === "cliente" ? (
                        <Users className="h-4 w-4 text-blue-600" />
                      ) : actividad.tipo === "notificacion" ? (
                        <FileText className="h-4 w-4 text-yellow-600" />
                      ) : actividad.tipo === "compromiso" ? (
                        <Target className="h-4 w-4 text-purple-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{actividad.descripcion}</p>
                      {actividad.monto && <p className="text-sm font-semibold text-green-600">{actividad.monto}</p>}
                      <p className="text-xs text-gray-500">{actividad.fecha}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Link href="/alertas">
                  <Button variant="outline" className="w-full jd-button-secondary bg-transparent">
                    Ver todas las actividades
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos y alertas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <DashboardCharts />
          <AlertasCompromisos />
        </div>
      </div>
    </div>
  )
}
