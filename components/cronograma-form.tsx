"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"
import { Loader2, Save } from "lucide-react"

interface CronogramaData {
  IdCronograma?: number
  Año: number
  Mes: number
  DigitoRUC: number
  Dia: number
  MesVencimiento: number
}

interface CronogramaFormProps {
  año: number
  cronograma: CronogramaData[]
}

export function CronogramaForm({ año, cronograma }: CronogramaFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Función auxiliar para calcular el año de vencimiento
  const calcularAñoVencimiento = (mesObligacion: number) => {
    // Diciembre (mes 12) siempre vence en enero del año siguiente
    if (mesObligacion === 12) {
      return año + 1
    }
    // Los demás meses vencen en el mismo año
    return año
  }

  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]

  const digitos = [
    { valor: 0, label: "0" },
    { valor: 1, label: "1" },
    { valor: 2, label: "2 y 3" },
    { valor: 4, label: "4 y 5" },
    { valor: 6, label: "6 y 7" },
    { valor: 8, label: "8 y 9" },
    { valor: 99, label: "Buenos Contribuyentes y UESP" },
  ]

  // Inicializar datos del cronograma
  const [cronogramaData, setCronogramaData] = useState<Record<string, CronogramaData>>(() => {
    const data: Record<string, CronogramaData> = {}

    // Llenar con datos existentes o valores por defecto
    for (let mes = 1; mes <= 12; mes++) {
      for (const digito of digitos) {
        const key = `${mes}-${digito.valor}`
        const existing = cronograma.find((c) => c.Mes === mes && c.DigitoRUC === digito.valor)

        data[key] = existing || {
          Año: año,
          Mes: mes,
          DigitoRUC: digito.valor,
          Dia: 15, // Valor por defecto
          MesVencimiento: mes + 1 > 12 ? 1 : mes + 1, // Mes siguiente por defecto
        }
      }
    }

    return data
  })

  const handleInputChange = (mes: number, digitoRUC: number, field: "Dia" | "MesVencimiento", value: string) => {
    const key = `${mes}-${digitoRUC}`
    const numValue = Number.parseInt(value) || 1

    setCronogramaData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: numValue,
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const cronogramaArray = Object.values(cronogramaData)

      const response = await fetch("/api/cronograma-sunat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          año,
          cronograma: cronogramaArray,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Cronograma actualizado",
          description: `El cronograma ${año} ha sido guardado correctamente.`,
        })
        router.push("/configuracion/cronograma-sunat")
      } else {
        throw new Error(result.error || "Error al guardar el cronograma")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error inesperado",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Información de contexto */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Información del Cronograma {año}</h3>
        <p className="text-sm text-blue-700">
          • Las obligaciones de enero a noviembre vencen en <strong>{año}</strong>
        </p>
        <p className="text-sm text-blue-700">
          • Las obligaciones de diciembre vencen en <strong>enero {año + 1}</strong>
        </p>
        <p className="text-sm text-blue-600 font-medium mt-2">
          Ejemplo: Diciembre {año} → vence 15 Enero {año + 1}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Mes de Obligación</TableHead>
                {digitos.map((digito) => (
                  <TableHead key={digito.valor} className="text-center font-bold min-w-[140px]">
                    {digito.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {meses.map((mes, mesIndex) => (
                <TableRow key={mes} className={mesIndex % 2 === 0 ? "bg-blue-50" : ""}>
                  <TableCell className="font-medium text-red-600">
                    <div>
                      <div>{mes}</div>
                      <div className="text-xs text-gray-500">
                        {mesIndex === 11 ? "Vence en Enero " + (año + 1) : "Vence en " + año}
                      </div>
                    </div>
                  </TableCell>
                  {digitos.map((digito) => {
                    const key = `${mesIndex + 1}-${digito.valor}`
                    const data = cronogramaData[key]
                    const añoVencimiento = calcularAñoVencimiento(mesIndex + 1)

                    return (
                      <TableCell key={digito.valor} className="text-center p-2">
                        <div className="space-y-1">
                          <div>
                            <Label className="text-xs">Día</Label>
                            <Input
                              type="number"
                              min="1"
                              max="31"
                              value={data.Dia}
                              onChange={(e) => handleInputChange(mesIndex + 1, digito.valor, "Dia", e.target.value)}
                              className="w-16 h-8 text-center text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Mes Venc.</Label>
                            <Input
                              type="number"
                              min="1"
                              max="12"
                              value={data.MesVencimiento}
                              onChange={(e) =>
                                handleInputChange(mesIndex + 1, digito.valor, "MesVencimiento", e.target.value)
                              }
                              className="w-16 h-8 text-center text-xs"
                            />
                          </div>
                          <div className="text-xs text-gray-600 bg-gray-100 px-1 py-0.5 rounded">
                            {data.Dia}/{data.MesVencimiento}/{añoVencimiento}
                          </div>
                        </div>
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            Guardar Cronograma
          </Button>
        </div>
      </form>
    </div>
  )
}
