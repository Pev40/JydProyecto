import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Acceso No Autorizado
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            No tienes permisos para acceder a esta página.
          </p>
          <div className="space-y-2">
            <Link href="/portal">
              <Button className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Ir al Portal
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                Iniciar Sesión con Otra Cuenta
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
