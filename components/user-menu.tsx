"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User, LogOut, Settings, Shield } from "lucide-react"

interface UserData {
  id: number
  nombre: string
  email: string
  NombreRol: string
  clienteNombre?: string
}

export function UserMenu() {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        }
      } catch (error) {
        console.error("Error fetching user:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Error during logout:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-corporate-gray/20 rounded-full animate-pulse" />
        <div className="w-20 h-4 bg-corporate-gray/20 rounded animate-pulse" />
      </div>
    )
  }

  if (!user) {
    return (
      <Button onClick={() => router.push("/login")} className="bg-corporate-blue hover:bg-corporate-blue/90">
        Iniciar Sesión
      </Button>
    )
  }

  const getInitials = (name: string) => {
    if (!name) return "US"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Administrador":
        return "text-red-600"
      case "Encargado Cobranza":
        return "text-corporate-blue"
      case "Gerente":
        return "text-green-600"
      default:
        return "text-corporate-gray"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "Administrador":
        return "Administrador"
      case "Encargado Cobranza":
        return "Encargado"
      case "Gerente":
        return "Gerente"
      default:
        return role
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-auto px-3 hover:bg-corporate-blue/10">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8 bg-corporate-blue">
              <AvatarFallback className="bg-corporate-blue text-white text-sm font-medium">
                {getInitials(user.nombre)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-corporate-gray">{user.nombre}</span>
              <span className={`text-xs ${getRoleColor(user.NombreRol)}`}>{getRoleLabel(user.NombreRol)}</span>
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-corporate-gray">{user.nombre}</p>
            <p className="text-xs leading-none text-corporate-gray/70">{user.email}</p>
            {user.clienteNombre && <p className="text-xs leading-none text-corporate-blue">{user.clienteNombre}</p>}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer hover:bg-corporate-blue/10">
          <User className="mr-2 h-4 w-4 text-corporate-gray" />
          <span className="text-corporate-gray">Perfil</span>
        </DropdownMenuItem>
        {(user.NombreRol === "Administrador" || user.NombreRol === "Encargado Cobranza") && (
          <DropdownMenuItem
            className="cursor-pointer hover:bg-corporate-blue/10"
            onClick={() => router.push("/configuracion")}
          >
            <Settings className="mr-2 h-4 w-4 text-corporate-gray" />
            <span className="text-corporate-gray">Configuración</span>
          </DropdownMenuItem>
        )}
        {user.NombreRol === "Administrador" && (
          <DropdownMenuItem
            className="cursor-pointer hover:bg-corporate-blue/10"
            onClick={() => router.push("/usuarios")}
          >
            <Shield className="mr-2 h-4 w-4 text-corporate-gray" />
            <span className="text-corporate-gray">Usuarios</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer hover:bg-red-50 text-red-600" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
