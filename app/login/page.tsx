"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Lock, Mail, Building } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  // Verificar si ya hay una sesión activa
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const user = await response.json()
          // Redirigir según el rol
          switch (user.NombreRol) {
            case "Administrador":
            case "Encargado Cobranza":
              router.push("/")
              break
            case "Gerente":
              router.push("/portal")
              break
            default:
              router.push("/")
          }
        }
      } catch (error) {
        // No hay sesión activa, continuar en login
        console.log("No hay sesión activa")
      }
    }

    checkSession()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Redirigir según el rol del usuario
        switch (data.user.NombreRol) {
          case "Administrador":
          case "Encargado Cobranza":
            router.push("/")
            break
          case "Gerente":
            router.push("/portal")
            break
          default:
            router.push("/")
        }
        router.refresh()
      } else {
        setError(data.error || "Error al iniciar sesión")
      }
    } catch (error) {
      setError("Error de conexión. Intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-corporate-blue/10 to-corporate-blue/20 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="space-y-4 pb-8">
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 bg-corporate-blue rounded-xl flex items-center justify-center shadow-lg">
                <Building className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="text-center">
              <CardTitle className="text-2xl font-bold text-corporate-gray">J&D Consultores</CardTitle>
              <CardDescription className="text-corporate-gray/70 mt-2">Sistema de Cobranza</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-corporate-gray">
                  Correo Electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-corporate-gray/50 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@empresa.com"
                    className="pl-10 h-11 border-corporate-gray/20 focus:border-corporate-blue"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-corporate-gray">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-corporate-gray/50 h-4 w-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-11 border-corporate-gray/20 focus:border-corporate-blue"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-corporate-gray/50 hover:text-corporate-gray"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-corporate-blue hover:bg-corporate-blue/90 text-white font-medium"
                disabled={loading}
              >
                {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-corporate-gray/20">
              <div className="text-center">
                <p className="text-sm text-corporate-gray/70 mb-4">Credenciales de prueba:</p>
                <div className="space-y-2 text-xs">
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <p className="font-medium text-red-600">Administrador:</p>
                    <p className="text-corporate-gray">admin@jdconsultores.com</p>
                    <p className="text-corporate-gray">password</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="font-medium text-corporate-blue">Empleado:</p>
                    <p className="text-corporate-gray">empleado@jdconsultores.com</p>
                    <p className="text-corporate-gray">password</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="font-medium text-green-600">Cliente:</p>
                    <p className="text-corporate-gray">cliente@empresa.com</p>
                    <p className="text-corporate-gray">password</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
