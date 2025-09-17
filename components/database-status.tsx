"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Database, AlertCircle, CheckCircle } from "lucide-react"

interface DatabaseStatus {
  connected: boolean
  message: string
}

export function DatabaseStatus() {
  const [status, setStatus] = useState<DatabaseStatus>({
    connected: false,
    message: "Verificando...",
  })

  useEffect(() => {
    const checkDatabaseStatus = async () => {
      try {
        const response = await fetch("/api/database/status")
        const data = await response.json()

        setStatus({
          connected: data.connected,
          message: data.message,
        })
      } catch (_error) {
        setStatus({
          connected: false,
          message: "Error de conexión",
        })
      }
    }

    checkDatabaseStatus()

    // Verificar cada 30 segundos
    const interval = setInterval(checkDatabaseStatus, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Badge variant={status.connected ? "default" : "destructive"} className="flex items-center gap-2">
      {status.connected ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
      <Database className="h-3 w-3" />
      <span className="text-xs">{status.message}</span>
    </Badge>
  )
}
