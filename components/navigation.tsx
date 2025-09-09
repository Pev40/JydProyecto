"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { UserMenu } from "@/components/user-menu"
import {
  Home,
  Users,
  CreditCard,
  Bell,
  FileText,
  Settings,
  BarChart3,
  Calendar,
  MessageSquare,
  AlertTriangle,
  Building,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  TrendingUp,
  DollarSign,
  Calculator,
  BookOpen,
  Shield,
  Database,
  Mail,
  Phone,
  Clock,
  Target,
  Briefcase,
  PieChart,
  Activity,
} from "lucide-react"

interface NavigationProps {
  userRole: string
}

export function Navigation({ userRole }: NavigationProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<string[]>(["reportes"])

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]))
  }

  const isActive = (href: string) => {
    if (href === "/" && pathname === "/") return true
    if (href !== "/" && pathname.startsWith(href)) return true
    return false
  }

  // Navegación para clientes (portal)
  if (userRole === "Gerente") {
    const clientNavigation = [
      { name: "Dashboard", href: "/portal/dashboard", icon: Home },
      { name: "Mis Servicios", href: "/portal/servicios", icon: Briefcase },
      { name: "Mis Pagos", href: "/portal/pagos", icon: CreditCard },
      { name: "Mis Recibos", href: "/portal/recibos", icon: FileText },
    ]

    return (
      <div className="jd-sidebar min-h-screen w-64 fixed left-0 top-0 z-40 lg:translate-x-0 transform -translate-x-full transition-transform duration-200 ease-in-out lg:static lg:inset-0">
        {/* Header del sidebar */}
        <div className="jd-header p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">JD</span>
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">J&D Consultores</h2>
              <p className="text-white/70 text-sm">Portal Cliente</p>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <nav className="p-4 space-y-2">
          {clientNavigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`jd-sidebar-item flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive(item.href) ? "active bg-white/15 text-white" : "hover:bg-white/10"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* User menu en la parte inferior */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <UserMenu />
        </div>
      </div>
    )
  }

  // Navegación completa para admin y empleados
  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Clientes", href: "/clientes", icon: Users },
    { name: "Pagos", href: "/pagos", icon: CreditCard },
    { name: "Notificaciones", href: "/notificaciones", icon: Bell },
    { name: "Compromisos", href: "/compromisos", icon: AlertTriangle },
    {
      name: "Reportes",
      icon: BarChart3,
      children: [
        { name: "Flujo de Caja", href: "/reportes/flujo-caja", icon: TrendingUp },
        { name: "Consolidado", href: "/reportes/consolidado", icon: PieChart },
        { name: "Morosidad", href: "/reportes/morosidad", icon: Activity },
        { name: "Ingreso Caja Variable", href: "/reportes/ingreso-caja-variable", icon: FileSpreadsheet },
        { name: "Ingreso Caja Fija Proyectado", href: "/reportes/ingreso-caja-fija-proyectado", icon: Calculator },
        { name: "Verificar Datos", href: "/reportes/verificar", icon: Database },
      ],
    },
    { name: "Recibos", href: "/recibos", icon: FileText },
    { name: "Comprobantes", href: "/comprobantes", icon: BookOpen },
    { name: "Servicios Adicionales", href: "/servicios-adicionales", icon: Target },
    { name: "Ingresos Mensuales", href: "/ingresos-mensuales", icon: DollarSign },
    { name: "Plantillas", href: "/plantillas", icon: MessageSquare },
    { name: "Alertas", href: "/alertas", icon: AlertTriangle },
    { name: "Proceso Automático", href: "/proceso-automatico", icon: Clock },
  ]

  // Solo admin puede ver estas secciones
  if (userRole === "ADMIN") {
    navigation.push(
      { name: "Usuarios", href: "/usuarios", icon: Shield },
      {
        name: "Catálogos",
        icon: Database,
        children: [
          { name: "Clasificaciones", href: "/catalogos/clasificaciones", icon: Building },
          { name: "Carteras", href: "/catalogos/carteras", icon: Briefcase },
        ],
      },
      {
        name: "Configuración",
        icon: Settings,
        children: [
          { name: "General", href: "/configuracion", icon: Settings },
          { name: "Notificaciones", href: "/configuracion/notificaciones", icon: Mail },
        ],
      },
      {
        name: "Consultas",
        icon: Phone,
        children: [{ name: "Tipo de Cambio", href: "/consultas/tipo-cambio", icon: DollarSign }],
      },
    )
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="jd-button-primary"
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Overlay para mobile */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`jd-sidebar min-h-screen w-64 fixed left-0 top-0 z-40 lg:translate-x-0 transform transition-transform duration-200 ease-in-out lg:static lg:inset-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header del sidebar */}
        <div className="jd-header p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <img
                src="/isotivojyd.png"
                alt="Isotipo J&D"
                className="w-10 h-10 object-contain"
                />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">J&D Consultores</h2>
              <p className="text-white/70 text-sm">Sistema de Cobranza</p>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon
            const hasChildren = "children" in item
            const isExpanded = expandedSections.includes(item.name.toLowerCase())

            if (hasChildren) {
              return (
                <div key={item.name}>
                  <button
                    onClick={() => toggleSection(item.name.toLowerCase())}
                    className="jd-sidebar-item w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:bg-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>

                  {isExpanded && item.children && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon
                        return (
                          <Link
                            key={child.name}
                            href={child.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`jd-sidebar-item flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-sm ${
                              isActive(child.href) ? "active bg-white/15 text-white" : "hover:bg-white/10"
                            }`}
                          >
                            <ChildIcon className="h-4 w-4" />
                            <span>{child.name}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`jd-sidebar-item flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive(item.href) ? "active bg-white/15 text-white" : "hover:bg-white/10"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* User menu en la parte inferior */}
        <div className="p-4 border-t border-white/10">
          <UserMenu />
        </div>
      </div>
    </>
  )
}
