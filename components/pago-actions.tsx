"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface PagoActionsProps {
  pago: {
    IdPago: number
    Estado: string
    UrlComprobante?: string | null
  }
}

export function PagoActions({ pago }: PagoActionsProps) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)

  const onConfirm = async () => {
    try {
      setConfirming(true)
      const res = await fetch("/api/pagos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pago.IdPago, estado: "CONFIRMADO" }),
      })
      if (!res.ok) {
        // Silencioso para no bloquear UX; se podría integrar modal/toast
        console.error("Error confirmando pago")
        return
      }
    } catch (e) {
      console.error(e)
    } finally {
      setConfirming(false)
      router.refresh()
    }
  }

  const onOpenVoucher = () => {
    if (!pago.UrlComprobante) return
    try {
      const url = pago.UrlComprobante
      // Abrir en nueva pestaña/ventana
      window.open(url, "_blank", "noopener,noreferrer")
    } catch (e) {
      console.error("No se pudo abrir el comprobante", e)
    }
  }

  return (
    <div className="flex gap-2">
      {pago.Estado === "PENDIENTE" && (
        <Button size="sm" variant="outline" onClick={onConfirm} disabled={confirming}>
          {confirming ? "Confirmando..." : "Confirmar"}
        </Button>
      )}
      {pago.UrlComprobante && (
        <Button size="sm" variant="outline" onClick={onOpenVoucher}>
          Ver Comprobante
        </Button>
      )}
    </div>
  )
}
