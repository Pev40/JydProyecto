"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Power, PowerOff } from "lucide-react"
import { useRouter } from "next/navigation"

interface EstadoClienteActionsProps {
  clienteId: number
  estadoActual: string
  razonSocial: string
}

export function EstadoClienteActions({ clienteId, estadoActual, razonSocial: _razonSocial }: EstadoClienteActionsProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const cambiarEstado = async (nuevoEstado: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/clientes/${clienteId}/estado`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      })

      const result = await response.json()

      if (result.success) {
        router.refresh()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al cambiar el estado del cliente")
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={loading}
          className="h-8 w-8 p-0"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {estadoActual === "ACTIVO" ? (
          <DropdownMenuItem 
            onClick={() => cambiarEstado("INACTIVO")}
            className="text-red-600 hover:text-red-700"
          >
            <PowerOff className="mr-2 h-4 w-4" />
            Desactivar Cliente
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem 
            onClick={() => cambiarEstado("ACTIVO")}
            className="text-green-600 hover:text-green-700"
          >
            <Power className="mr-2 h-4 w-4" />
            Activar Cliente
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
