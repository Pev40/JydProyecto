"use client"

import { useState } from "react"
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
import { Plus, Copy, Upload, Loader2, Calendar, FileSpreadsheet } from "lucide-react"
import { useRouter } from "next/navigation"

export function CronogramaSunatManager() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [accion, setAccion] = useState<"crear" | "copiar" | "importar">("crear")
  const [año, setAño] = useState(new Date().getFullYear() + 1)
  const [añoOrigen, setAñoOrigen] = useState(new Date().getFullYear())
  const [añosDisponibles, setAñosDisponibles] = useState<number[]>([])

  // Cargar años disponibles cuando se abre el diálogo
  const handleDialogOpen = async (accionSeleccionada: "crear" | "copiar" | "importar") => {
    setAccion(accionSeleccionada)
    setDialogOpen(true)

    if (accionSeleccionada === "copiar") {
      try {
        const response = await fetch("/api/cronograma-sunat?accion=años")
        const data = await response.json()
        if (data.success) {
          setAñosDisponibles(data.años.map((a: any) => a.Año))
        }
      } catch (error) {
        console.error("Error cargando años:", error)
      }
    }
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
      const requestBody: any = { año }

      switch (accion) {
        case "crear":
          requestBody.accion = "crear_año"
          break
        case "copiar":
          requestBody.accion = "copiar_año"
          requestBody.añoOrigen = añoOrigen
          break
        case "importar":
          // Por ahora crear cronograma base, luego se puede editar
          requestBody.accion = "crear_año"
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
        setDialogOpen(false)
        router.refresh()

        // Redirigir a editar si se creó un nuevo cronograma
        if (accion === "crear" || accion === "importar") {
          router.push(`/cronograma-sunat/${año}/editar`)
        }
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
      case "importar":
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
    <>
      {/* Botones principales */}
      <div className="flex gap-2">
        <Button onClick={() => handleDialogOpen("crear")}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Año
        </Button>

        <Button variant="outline" onClick={() => handleDialogOpen("copiar")}>
          <Copy className="h-4 w-4 mr-2" />
          Copiar Año
        </Button>

        <Button variant="outline" onClick={() => handleDialogOpen("importar")}>
          <Upload className="h-4 w-4 mr-2" />
          Importar
        </Button>
      </div>

      {/* Diálogo */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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

              {accion === "importar" && (
                <div className="flex items-start gap-2">
                  <FileSpreadsheet className="h-4 w-4 mt-0.5 text-purple-500" />
                  <div>
                    <p className="font-medium">Se creará cronograma base</p>
                    <p>Después podrás importar el archivo oficial de SUNAT o editarlo manualmente</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {dialogContent.buttonText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
