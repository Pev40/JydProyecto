"use client"

import { Button } from "@/components/ui/button"
import { FileText, Send } from "lucide-react"

interface Props {
  pagoId: number
}

export function GenerateButtons({ pagoId }: Props) {
  const handleGenerate = async () => {
    try {
      const res = await fetch("/api/recibos/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pagoId }),
      })
      const data = await res.json()
      if (data?.reciboId) {
        window.open(`/api/recibos/${data.reciboId}/pdf`, "_blank", "noopener,noreferrer")
      }
    } catch (e) {
      console.error("Error generando recibo", e)
    }
  }

  const handleSend = async () => {
    try {
      const res = await fetch("/api/recibos/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pagoId }),
      })
      const data = await res.json()
      if (data?.reciboId) {
        await fetch(`/api/recibos/${data.reciboId}/enviar`, { method: "POST" })
      }
    } catch (e) {
      console.error("Error enviando recibo", e)
    }
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={handleGenerate}>
        <FileText className="h-3 w-3 mr-1" />
        Generar/Imprimir
      </Button>
      <Button size="sm" variant="outline" onClick={handleSend}>
        <Send className="h-3 w-3 mr-1" />
        Enviar
      </Button>
    </div>
  )
}


