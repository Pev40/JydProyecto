"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Loader2, Save, Upload, X, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"


interface PagoFormProps {
  clientes: {
    IdCliente: number;
    RazonSocial: string;
    RucDni: string;
    MontoFijoMensual: number;
    ServicioNombre?: string;
  }[]
  catalogos: {
    bancos: Banco[]
    servicios: Servicio[]
  }
  clienteSeleccionado?: number
  pago?: PagoExistente
  isEditing?: boolean
}

interface Banco {
  IdBanco: number
  Nombre: string
}

interface Servicio {
  IdServicio: number
  Nombre: string
}

interface PagoExistente {
  IdPago: number
  IdCliente: number
  Monto: number
  Concepto: string
  MedioPago: string
  IdBanco: number | null
  MesServicio: string
  Observaciones?: string
  UrlComprobante?: string
}

export function PagoForm({ clientes, catalogos, clienteSeleccionado, pago, isEditing = false }: PagoFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  // Obtener parámetros de compromiso desde URL
  const compromisoId = searchParams.get("compromiso")
  const montoCompromiso = searchParams.get("monto")
  const conceptoCompromiso = searchParams.get("concepto")

  const [formData, setFormData] = useState({
    idCliente: clienteSeleccionado?.toString() || pago?.IdCliente?.toString() || "",
    monto: montoCompromiso || pago?.Monto || "",
    concepto: conceptoCompromiso || pago?.Concepto || "",
    medioPago: pago?.MedioPago || "",
    idBanco: pago?.IdBanco?.toString() || "",
    mesServicio: pago?.MesServicio ? pago.MesServicio.split("T")[0] : "",
    observaciones: pago?.Observaciones || "",
    comprobante: null as File | null,
    urlComprobante: pago?.UrlComprobante || "",
    idCompromisoPago: compromisoId || null, // Vincular con compromiso
  })

  // Obtener servicios del cliente seleccionado
  const clienteSeleccionadoData = clientes.find((c) => c.IdCliente.toString() === formData.idCliente)

  // Efecto para cargar datos del compromiso si existe
  useEffect(() => {
    if (compromisoId && !isEditing) {
      // Si viene de un compromiso, pre-llenar algunos campos
      setFormData((prev) => ({
        ...prev,
        mesServicio: new Date().toISOString().split("T")[0], // Mes actual por defecto
      }))
    }
  }, [compromisoId, isEditing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let urlComprobante = formData.urlComprobante

      // Subir comprobante a S3 si hay archivo
      if (formData.comprobante) {
        urlComprobante = await uploadComprobante(formData.comprobante)
      }

      const url = isEditing ? `/api/pagos/${pago.IdPago}` : "/api/pagos"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          idCliente: Number.parseInt(formData.idCliente),
          monto: Number.parseFloat(formData.monto),
          idBanco: Number.parseInt(formData.idBanco) || null,
          urlComprobante,
          idCompromisoPago: formData.idCompromisoPago ? Number.parseInt(formData.idCompromisoPago) : null,
          // Determinar meses/servicios que se están pagando
          mesesServicios: determinarMesesServicios(),
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: isEditing ? "Pago actualizado" : "Pago registrado",
          description: isEditing
            ? "El pago ha sido actualizado correctamente."
            : compromisoId
              ? "El pago ha sido registrado y vinculado al compromiso exitosamente."
              : "El pago ha sido registrado exitosamente.",
        })

        // Si viene de un compromiso, actualizar el estado del compromiso
        if (compromisoId && !isEditing) {
          await actualizarEstadoCompromiso(compromisoId, result.pago.IdPago)
        }

        router.push(`/clientes/${formData.idCliente}`)
      } else {
        throw new Error(result.error || "Error al procesar la solicitud")
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

  const actualizarEstadoCompromiso = async (compromisoId: string, pagoId: number) => {
    try {
      await fetch(`/api/compromisos/${compromisoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          estado: "CUMPLIDO",
          idPagoVinculado: pagoId,
          observaciones: "Compromiso cumplido mediante pago registrado",
        }),
      })
    } catch (error) {
      console.error("Error actualizando compromiso:", error)
    }
  }

  const uploadComprobante = async (file: File): Promise<string> => {
    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "comprobante")

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()
      if (result.success) {
        return result.url
      } else {
        throw new Error(result.error || "Error al subir archivo")
      }
    } finally {
      setUploadingFile(false)
    }
  }

  const determinarMesesServicios = () => {
    // Lógica para determinar qué meses/servicios se están pagando
    const cliente = clientes.find((c) => c.IdCliente.toString() === formData.idCliente)
    if (!cliente) return []

    const monto = Number.parseFloat(formData.monto)
    const montoMensual = cliente.MontoFijoMensual

    if (montoMensual > 0) {
      const mesesPagados = Math.floor(monto / montoMensual)
      const fechaServicio = new Date(formData.mesServicio)

      const meses = []
      for (let i = 0; i < mesesPagados; i++) {
        const fecha = new Date(fechaServicio)
        fecha.setMonth(fecha.getMonth() + i)
        meses.push({
          mes: fecha.toISOString().split("T")[0],
          servicio: cliente.ServicioNombre,
          monto: montoMensual,
        })
      }
      return meses
    }

    return [
      {
        mes: formData.mesServicio,
        servicio: cliente.ServicioNombre,
        monto: monto,
      },
    ]
  }

  type FormState = typeof formData
  const handleInputChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Tipo de archivo no válido",
          description: "Solo se permiten archivos JPG, PNG o PDF",
          variant: "destructive",
        })
        return
      }

      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "El archivo no debe superar los 5MB",
          variant: "destructive",
        })
        return
      }

      setFormData((prev) => ({ ...prev, comprobante: file }))
    }
  }

  const removeFile = () => {
    setFormData((prev) => ({ ...prev, comprobante: null, urlComprobante: "" }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Alerta si viene de un compromiso */}
      {compromisoId && (
        <Alert className="border-jd-primary bg-jd-primary/5">
          <AlertCircle className="h-4 w-4 text-jd-primary" />
          <AlertDescription className="text-jd-primary">
            <strong>Registrando pago desde compromiso:</strong> Este pago se vinculará automáticamente al compromiso de
            pago y marcará el compromiso como cumplido.
          </AlertDescription>
        </Alert>
      )}

      {/* Información Básica del Pago */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="idCliente" className="text-jd-gray font-medium">
            Cliente *
          </Label>
          <Select value={formData.idCliente} onValueChange={(value) => handleInputChange("idCliente", value)}>
            <SelectTrigger className="border-jd-gray/30 focus:border-jd-primary">
              <SelectValue placeholder="Seleccione cliente" />
            </SelectTrigger>
            <SelectContent>
              {clientes.map((cliente) => (
                <SelectItem key={cliente.IdCliente} value={cliente.IdCliente.toString()}>
                  {cliente.RazonSocial} - {cliente.RucDni}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="monto" className="text-jd-gray font-medium">
            Monto (S/) *
          </Label>
          <Input
            id="monto"
            type="number"
            step="0.01"
            min="0"
            value={formData.monto}
            onChange={(e) => handleInputChange("monto", e.target.value)}
            placeholder="0.00"
            className="border-jd-gray/30 focus:border-jd-primary"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mesServicio" className="text-jd-gray font-medium">
            Mes de Servicio *
          </Label>
          <Input
            id="mesServicio"
            type="date"
            value={formData.mesServicio}
            onChange={(e) => handleInputChange("mesServicio", e.target.value)}
            className="border-jd-gray/30 focus:border-jd-primary"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="medioPago" className="text-jd-gray font-medium">
            Medio de Pago *
          </Label>
          <Select value={formData.medioPago} onValueChange={(value) => handleInputChange("medioPago", value)}>
            <SelectTrigger className="border-jd-gray/30 focus:border-jd-primary">
              <SelectValue placeholder="Seleccione medio de pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Transferencia">Transferencia Bancaria</SelectItem>
              <SelectItem value="Deposito">Depósito Bancario</SelectItem>
              <SelectItem value="Efectivo">Efectivo</SelectItem>
              <SelectItem value="Yape">Yape</SelectItem>
              <SelectItem value="Plin">Plin</SelectItem>
              <SelectItem value="Cheque">Cheque</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="idBanco" className="text-jd-gray font-medium">
            Banco
          </Label>
          <Select value={formData.idBanco} onValueChange={(value) => handleInputChange("idBanco", value)}>
            <SelectTrigger className="border-jd-gray/30 focus:border-jd-primary">
              <SelectValue placeholder="Seleccione banco" />
            </SelectTrigger>
            <SelectContent>
              {catalogos.bancos?.map((banco) => (
                <SelectItem key={banco.IdBanco} value={banco.IdBanco.toString()}>
                  {banco.Nombre}
                </SelectItem>
              )) || (
                <SelectItem value="no-disponible" disabled>
                  No hay bancos disponibles
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="concepto" className="text-jd-gray font-medium">
            Concepto *
          </Label>
          <Input
            id="concepto"
            value={formData.concepto}
            onChange={(e) => handleInputChange("concepto", e.target.value)}
            placeholder="Pago de servicios contables - Enero 2024"
            className="border-jd-gray/30 focus:border-jd-primary"
            required
          />
        </div>
      </div>

      {/* Información del Servicio Pagado */}
      {clienteSeleccionadoData && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4 text-jd-primary">Detalle del Servicio</h3>
          <div className="bg-jd-primary/5 p-4 rounded-lg border border-jd-primary/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-jd-gray">Servicio:</span>
                <p className="text-jd-primary font-medium">{clienteSeleccionadoData.ServicioNombre}</p>
              </div>
              <div>
                <span className="font-medium text-jd-gray">Monto Mensual:</span>
                <p className="text-jd-primary font-medium">
                  S/ {clienteSeleccionadoData.MontoFijoMensual.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <span className="font-medium text-jd-gray">Meses Cubiertos:</span>
                <p className="text-jd-primary font-medium">
                  {formData.monto && clienteSeleccionadoData.MontoFijoMensual > 0
                    ? Math.floor(Number.parseFloat(formData.monto) / clienteSeleccionadoData.MontoFijoMensual)
                    : 0}{" "}
                  mes(es)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comprobante de Pago */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4 text-jd-primary">Comprobante de Pago</h3>
        <div className="space-y-4">
          {!formData.comprobante && !formData.urlComprobante && (
            <div className="border-2 border-dashed border-jd-primary/30 rounded-lg p-6 hover:border-jd-primary/50 transition-colors">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-jd-primary/60" />
                <div className="mt-4">
                  <Label htmlFor="comprobante" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-jd-primary">Subir comprobante de pago</span>
                    <span className="mt-1 block text-sm text-jd-gray">PNG, JPG o PDF hasta 5MB</span>
                  </Label>
                  <Input
                    id="comprobante"
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            </div>
          )}

          {(formData.comprobante || formData.urlComprobante) && (
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Upload className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    {formData.comprobante ? formData.comprobante.name : "Comprobante existente"}
                  </p>
                  <p className="text-sm text-green-600">{formData.comprobante ? "Listo para subir" : "Ya subido"}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={removeFile}
                className="text-red-600 hover:text-red-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Observaciones */}
      <div className="space-y-2">
        <Label htmlFor="observaciones" className="text-jd-gray font-medium">
          Observaciones
        </Label>
        <Textarea
          id="observaciones"
          value={formData.observaciones}
          onChange={(e) => handleInputChange("observaciones", e.target.value)}
          placeholder="Observaciones adicionales sobre el pago..."
          className="border-jd-gray/30 focus:border-jd-primary"
          rows={3}
        />
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button type="button" variant="outline" onClick={() => router.back()} className="jd-button-outline">
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || uploadingFile} className="jd-button-primary">
          {(loading || uploadingFile) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <Save className="h-4 w-4 mr-2" />
          {isEditing ? "Actualizar Pago" : compromisoId ? "Registrar Pago y Cumplir Compromiso" : "Registrar Pago"}
        </Button>
      </div>
    </form>
  )
}
