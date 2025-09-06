import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Tag, Briefcase, Users, Building, CreditCard, Bell } from "lucide-react"
import Link from "next/link"

export default function CatalogosPage() {
  const catalogos = [
    {
      title: "Clasificaciones",
      description: "Gestionar clasificaciones de clientes (A, B, C)",
      icon: Tag,
      href: "/catalogos/clasificaciones",
      color: "bg-blue-500",
    },
    {
      title: "Carteras",
      description: "Administrar carteras de clientes por región",
      icon: Briefcase,
      href: "/catalogos/carteras",
      color: "bg-green-500",
    },
    {
      title: "Servicios",
      description: "Configurar servicios ofrecidos",
      icon: Users,
      href: "/catalogos/servicios",
      color: "bg-purple-500",
    },
    {
      title: "Categorías de Empresa",
      description: "Gestionar categorías (Grande, Mediana, Pequeña)",
      icon: Building,
      href: "/catalogos/categorias",
      color: "bg-orange-500",
    },
    {
      title: "Bancos",
      description: "Administrar entidades bancarias",
      icon: CreditCard,
      href: "/catalogos/bancos",
      color: "bg-indigo-500",
    },
    {
      title: "Tipos de Notificación",
      description: "Configurar canales de notificación",
      icon: Bell,
      href: "/catalogos/tipos-notificacion",
      color: "bg-pink-500",
    },
  ]

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
                <h1 className="text-3xl font-bold text-gray-900">Administración de Catálogos</h1>
                <p className="text-gray-600 mt-1">Gestionar datos maestros del sistema</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {catalogos.map((catalogo) => {
            const Icon = catalogo.icon
            return (
              <Link key={catalogo.href} href={catalogo.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${catalogo.color} text-white`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-lg">{catalogo.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{catalogo.description}</p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
