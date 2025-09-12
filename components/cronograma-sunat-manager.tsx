"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Plus, Copy, Upload, Loader2, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"

interface AñoCronograma {
  Año: number
  totalRegistros: number
  fechaCreacion: string
  Estado: string
}

interface CronogramaSunatManagerProps {
  accion: "crear" | "copiar" | "editar"
  añoSeleccionado: number | null
  años: AñoCronograma[]
  onClose: () => void
}

export function CronogramaSunatManager({ 
  accion: accionInicial, 
  añoSeleccionado, 
  años, 
  onClose 
}: CronogramaSunatManagerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(true)
  const [accion] = useState<"crear" | "copiar" | "importar">(accionInicial === "editar" ? "crear" : accionInicial)
  const [año, setAño] = useState(añoSeleccionado || new Date().getFullYear() + 1)
  const [añoOrigen, setAñoOrigen] = useState(añoSeleccionado || new Date().getFullYear())
  const [añosDisponibles] = useState<number[]>(años.map(a => a.Año))

  useEffect(() => {
    setDialogOpen(true)
  }, [])

  const handleDialogClose = () => {
    setDialogOpen(false)
    onClose()
  }

  const handleSubmit = async () => {
    if (!año) {
      toast({
        title: "Error",
        description: "Por favor ingresa un año válido",
        variant: "destructive",
      })
      return
    }

    if (accion === "copiar" && !añoOrigen) {
      toast({
        title: "Error",
        description: "Por favor selecciona el año origen",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const requestBody: { año: number; accion?: string; añoOrigen?: number } = { año }

      switch (accion) {
        case "crear":
          requestBody.accion = "crear_año"
          break
        case "copiar":
          requestBody.accion = "copiar_año"
          requestBody.añoOrigen = añoOrigen
          break
      }

      const response = await fetch("/api/cronograma-sunat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message,
        })
        handleDialogClose()
        router.refresh()
      } else {
        throw new Error(result.error || "Error desconocido")
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

  const getDialogContent = () => {
    switch (accion) {
      case "crear":
        return {
          title: "Crear Nuevo Cronograma",
          description: "Crear un cronograma base para un nuevo año",
          icon: <Plus className="h-5 w-5" />,
          buttonText: "Crear Cronograma",
        }
      case "copiar":
        return {
          title: "Copiar Cronograma",
          description: "Copiar cronograma de un año existente a un nuevo año",
          icon: <Copy className="h-5 w-5" />,
          buttonText: "Copiar Cronograma",
        }
      default:
        return {
          title: "Importar Cronograma",
          description: "Importar cronograma desde archivo oficial SUNAT",
          icon: <Upload className="h-5 w-5" />,
          buttonText: "Crear e Importar",
        }
    }
  }

  const dialogContent = getDialogContent()

  return (
    <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {dialogContent.icon}
            {dialogContent.title}
          </DialogTitle>
          <DialogDescription>{dialogContent.description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Año destino */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="año" className="text-right">
              Año {accion === "copiar" ? "Destino" : ""}
            </Label>
            <Input
              id="año"
              type="number"
              value={año}
              onChange={(e) => setAño(Number.parseInt(e.target.value))}
              className="col-span-3"
              min={2020}
              max={2030}
            />
          </div>

          {/* Año origen (solo para copiar) */}
          {accion === "copiar" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="añoOrigen" className="text-right">
                Año Origen
              </Label>
              <Select value={añoOrigen.toString()} onValueChange={(value) => setAñoOrigen(Number.parseInt(value))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccionar año origen" />
                </SelectTrigger>
                <SelectContent>
                  {añosDisponibles.map((año) => (
                    <SelectItem key={año} value={año.toString()}>
                      {año}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Información adicional */}
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            {accion === "crear" && (
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 mt-0.5 text-blue-500" />
                <div>
                  <p className="font-medium">Se creará un cronograma base</p>
                  <p>Podrás editarlo después con las fechas oficiales de SUNAT</p>
                </div>
              </div>
            )}

            {accion === "copiar" && (
              <div className="flex items-start gap-2">
                <Copy className="h-4 w-4 mt-0.5 text-green-500" />
                <div>
                  <p className="font-medium">Se copiará el cronograma completo</p>
                  <p>Todas las fechas del año origen se aplicarán al año destino</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleDialogClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {dialogContent.buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
