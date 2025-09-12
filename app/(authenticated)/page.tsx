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
  Clock,
  ArrowUpRight,
} from "lucide-react"
import Link from "next/link"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getDashboardStats, getActividadesRecientes } from "@/lib/queries"

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const user = await getCurrentUser()

  // Si el usuario es cliente, mostrar mensaje o componente específico
  if (user && user.rol === "CLIENTE") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Restringido</h1>
          <p className="text-gray-600 mb-4">Esta sección es solo para administradores.</p>
          <a 
            href="/portal" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Ir al Portal del Cliente
          </a>
        </div>
      </div>
    )
  }

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header principal */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Bienvenido, {user.nombre}</h1>
                <p className="text-blue-100 text-lg">Panel de control - Sistema de Cobranza J&D Consultores</p>
              </div>
              <div className="flex items-center gap-4">
                <Badge className="bg-white/20 text-white border-white/30 px-4 py-2 text-sm font-medium">
                  {user.rol}
                </Badge>
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
              <Card key={index} className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2 mb-3">{stat.value}</p>
                      <div className="flex items-center">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            stat.changeType === "positive" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {stat.change}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">vs mes anterior</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div
                        className={`p-4 rounded-2xl ${
                          stat.color === "jd-primary"
                            ? "bg-gradient-to-br from-blue-100 to-blue-200"
                            : stat.color === "green"
                              ? "bg-gradient-to-br from-green-100 to-green-200"
                              : stat.color === "blue"
                                ? "bg-gradient-to-br from-blue-100 to-blue-200"
                                : "bg-gradient-to-br from-red-100 to-red-200"
                        }`}
                      >
                        <Icon
                          className={`h-8 w-8 ${
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
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Acciones rápidas y actividad reciente */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-lg">
                <CardTitle className="text-white flex items-center gap-2 text-xl">
                  <Target className="h-6 w-6" />
                  Acciones Rápidas
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Accesos directos a las funciones más utilizadas
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon
                    return (
                      <Link key={index} href={action.href}>
                        <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer group">
                          <div className="flex items-center gap-4">
                            <div
                              className={`p-3 rounded-xl ${
                                action.color === "jd-primary"
                                  ? "bg-gradient-to-br from-blue-100 to-blue-200 group-hover:from-blue-200 group-hover:to-blue-300"
                                  : action.color === "green"
                                    ? "bg-gradient-to-br from-green-100 to-green-200 group-hover:from-green-200 group-hover:to-green-300"
                                    : action.color === "blue"
                                      ? "bg-gradient-to-br from-blue-100 to-blue-200 group-hover:from-blue-200 group-hover:to-blue-300"
                                      : "bg-gradient-to-br from-purple-100 to-purple-200 group-hover:from-purple-200 group-hover:to-purple-300"
                              } transition-all`}
                            >
                              <Icon
                                className={`h-6 w-6 ${
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
                              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-lg">
                                {action.title}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                            </div>
                            <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
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
          <Card className="bg-white shadow-lg border-0 h-fit">
            <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 rounded-t-lg">
              <CardTitle className="text-white flex items-center gap-2 text-xl">
                <Activity className="h-6 w-6" />
                Actividad Reciente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Contenedor con altura fija y scroll */}
              <div className="h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <div className="p-6 space-y-4">
                  {actividadesRecientes.map((actividad) => (
                  <div
                    key={actividad.id}
                    className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-all duration-200"
                  >
                    <div
                      className={`p-3 rounded-full ${
                        actividad.estado === "CONFIRMADO" || actividad.estado === "completed"
                          ? "bg-gradient-to-br from-green-100 to-green-200"
                          : actividad.estado === "nuevo" || actividad.tipo === "cliente"
                            ? "bg-gradient-to-br from-blue-100 to-blue-200"
                            : actividad.estado === "enviado" || actividad.estado === "ENVIADO"
                              ? "bg-gradient-to-br from-yellow-100 to-yellow-200"
                              : actividad.tipo === "compromiso"
                                ? "bg-gradient-to-br from-purple-100 to-purple-200"
                                : "bg-gradient-to-br from-gray-100 to-gray-200"
                      }`}
                    >
                      {actividad.tipo === "pago" ? (
                        <CreditCard className="h-5 w-5 text-green-600" />
                      ) : actividad.tipo === "cliente" ? (
                        <Users className="h-5 w-5 text-blue-600" />
                      ) : actividad.tipo === "notificacion" ? (
                        <FileText className="h-5 w-5 text-yellow-600" />
                      ) : actividad.tipo === "compromiso" ? (
                        <Target className="h-5 w-5 text-purple-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 leading-relaxed">{actividad.descripcion}</p>
                      {actividad.monto && (
                        <p className="text-sm font-semibold text-green-600 mt-1">{actividad.monto}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {actividad.fecha}
                      </p>
                    </div>
                  </div>
                ))}
                </div>
              </div>
              {/* Botón fuera del área de scroll */}
              <div className="px-6 pb-6 pt-2 border-t border-gray-200">
                <Link href="/alertas">
                  <Button variant="outline" className="w-full hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors">
                    Ver todas las actividades
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sección de Gráficos */}
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Análisis y Estadísticas</h2>
            <p className="text-gray-600">Visualización de datos y tendencias del sistema</p>
          </div>
          <DashboardCharts />
        </div>

        {/* Sección de Compromisos y Alertas */}
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Compromisos</h2>
            <p className="text-gray-600">Monitoreo y alertas de compromisos de pago</p>
          </div>
          <AlertasCompromisos />
        </div>
      </div>
    </div>
  )
}
