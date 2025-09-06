"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface ReciboActionsProps {
  reciboId: number
  numeroRecibo: string
}

export function ReciboActions({ reciboId, numeroRecibo }: ReciboActionsProps) {
  const [sending, setSending] = useState(false)

  const onImprimir = () => {
    window.open(`/api/recibos/${reciboId}/pdf`, "_blank", "noopener,noreferrer")
  }

  const onDescargar = () => {
    const a = document.createElement("a")
    a.href = `/api/recibos/${reciboId}/pdf`
    a.download = `recibo_${numeroRecibo}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const onEnviar = async () => {
    try {
      setSending(true)
      const res = await fetch(`/api/recibos/${reciboId}/enviar`, { method: "POST" })
      if (!res.ok) {
        console.error("Error al enviar recibo")
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={onImprimir}>Imprimir</Button>
      <Button size="sm" variant="outline" onClick={onDescargar}>Descargar</Button>
      <Button size="sm" onClick={onEnviar} disabled={sending}>{sending ? "Enviando..." : "Enviar"}</Button>
    </div>
  )
}


