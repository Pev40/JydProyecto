"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Save, Search, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useModal } from "@/components/ui/modal"

interface DocumentInfo {
  razonSocial?: string
  direccion?: string
  telefono?: string
  email?: string
  nombreCompleto?: string
  estado?: string
  condicion?: string
  representanteLegal?: string
  dni?: string
}

interface ClienteFormProps {
  catalogos: {
    clasificaciones: { IdClasificacion: number; Codigo: string; Descripcion: string }[]
    carteras: { IdCartera: number; Nombre: string }[]
    servicios: { IdServicio: number; Nombre: string }[]
    categorias: { IdCategoriaEmpresa: number; Nombre: string; Descripcion: string }[]
    bancos: { IdBanco: number; Nombre: string }[]
    usuarios: { IdUsuario: number; NombreCompleto: string }[]
  }
  cliente?: {
    IdCliente?: number
    RazonSocial?: string
    NombreContacto?: string
    RucDni?: string
    IdClasificacion?: number
    IdCartera?: number
    IdEncargado?: number
    IdServicio?: number
    MontoFijoMensual?: string | number
    AplicaMontoFijo?: boolean
    IdCategoriaEmpresa?: number
    Email?: string
    Telefono?: string
    Direccion?: string
  }
  isEditing?: boolean
}

export function ClienteForm({ catalogos, cliente, isEditing = false }: ClienteFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [consultingDocument, setConsultingDocument] = useState(false)
  const [documentInfo, setDocumentInfo] = useState<DocumentInfo | null>(null)
  const { Modal, showError, showSuccess } = useModal()
  const [formData, setFormData] = useState({
    razonSocial: cliente?.RazonSocial || "",
    nombreContacto: cliente?.NombreContacto || "",
    rucDni: cliente?.RucDni || "",
    idClasificacion: cliente?.IdClasificacion ? cliente.IdClasificacion.toString() : "",
    idCartera: cliente?.IdCartera ? cliente.IdCartera.toString() : "",
    idEncargado: cliente?.IdEncargado ? cliente.IdEncargado.toString() : "",
    idServicio: cliente?.IdServicio ? cliente.IdServicio.toString() : "",
    montoFijoMensual: cliente?.MontoFijoMensual || "",
    aplicaMontoFijo: cliente?.AplicaMontoFijo || false,
    idCategoriaEmpresa: cliente?.IdCategoriaEmpresa ? cliente.IdCategoriaEmpresa.toString() : "",
    email: cliente?.Email || "",
    telefono: cliente?.Telefono || "",
    direccion: cliente?.Direccion || "",
  })

  // Actualizar formData cuando cambien las props del cliente
  useEffect(() => {
    if (cliente) {
      console.log('Cliente data received:', cliente)
      setFormData({
        razonSocial: cliente.RazonSocial || "",
        nombreContacto: cliente.NombreContacto || "",
        rucDni: cliente.RucDni || "",
        idClasificacion: cliente.IdClasificacion ? cliente.IdClasificacion.toString() : "",
        idCartera: cliente.IdCartera ? cliente.IdCartera.toString() : "",
        idEncargado: cliente.IdEncargado ? cliente.IdEncargado.toString() : "",
        idServicio: cliente.IdServicio ? cliente.IdServicio.toString() : "",
        montoFijoMensual: cliente.MontoFijoMensual || "",
        aplicaMontoFijo: cliente.AplicaMontoFijo || false,
        idCategoriaEmpresa: cliente.IdCategoriaEmpresa ? cliente.IdCategoriaEmpresa.toString() : "",
        email: cliente.Email || "",
        telefono: cliente.Telefono || "",
        direccion: cliente.Direccion || "",
      })
    }
  }, [cliente])

  const consultarDocumento = async () => {
    if (!formData.rucDni) {
      showError("Datos requeridos", "Por favor, ingrese un número de RUC o DNI para realizar la consulta.")
      return
    }

    setConsultingDocument(true)
    setDocumentInfo(null)

    try {
      const isRuc = formData.rucDni.length === 11
      const endpoint = isRuc ? "ruc" : "dni"

      const response = await fetch(`/api/consultas/${endpoint}?numero=${formData.rucDni}`)
      const result = await response.json()

      if (result.success) {
        setDocumentInfo(result.data)

        if (isRuc) {
          // Autocompletar con datos del RUC
          setFormData((prev) => ({
            ...prev,
            razonSocial: result.data.razonSocial || prev.razonSocial,
            direccion: result.data.direccion || prev.direccion,
            telefono: result.data.telefono || prev.telefono,
            email: result.data.email || prev.email,
          }))
        } else {
          // Autocompletar con datos del DNI
          setFormData((prev) => ({
            ...prev,
            razonSocial: result.data.nombreCompleto || prev.razonSocial,
            nombreContacto: result.data.nombreCompleto || prev.nombreContacto,
          }))
        }

        showSuccess("Consulta exitosa", `Los datos de ${isRuc ? "RUC" : "DNI"} se obtuvieron correctamente y se han autocompletado en el formulario.`)
      } else {
        showError("Error en la consulta", result.error || "No se pudieron obtener los datos del documento. Verifique el número ingresado e intente nuevamente.")
      }
    } catch {
      showError("Error de conexión", "No se pudo conectar con el servicio de consulta. Verifique su conexión a internet e intente nuevamente.")
    } finally {
      setConsultingDocument(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = isEditing && cliente ? `/api/clientes/${cliente.IdCliente}` : "/api/clientes"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          montoFijoMensual: Number.parseFloat(formData.montoFijoMensual.toString()) || 0,
          idClasificacion: Number.parseInt(formData.idClasificacion) || null,
          idCartera: Number.parseInt(formData.idCartera) || null,
          idEncargado: Number.parseInt(formData.idEncargado) || null,
          idServicio: Number.parseInt(formData.idServicio) || null,
          idCategoriaEmpresa: Number.parseInt(formData.idCategoriaEmpresa) || null,
        }),
      })

      const result = await response.json()

      if (result.success) {
        showSuccess(
          isEditing ? "Cliente actualizado" : "Cliente registrado exitosamente",
          isEditing
            ? "Los datos del cliente han sido actualizados correctamente en el sistema."
            : "El cliente ha sido registrado exitosamente en el sistema. Será redirigido a la página del cliente.",
          () => {
            router.push(isEditing ? `/clientes/${cliente?.IdCliente}` : `/clientes/${result.clienteId}`)
          }
        )
      } else {
        // Manejar diferentes tipos de errores con mensajes específicos
        if (response.status === 409 || result.error?.includes("Ya existe")) {
          showError(
            "Cliente duplicado",
            result.error || "Ya existe un cliente registrado con este RUC/DNI. Por favor, verifique los datos o busque el cliente existente."
          )
        } else if (response.status === 400) {
          showError(
            "Datos inválidos",
            result.error || "Los datos proporcionados no son válidos. Por favor, revise el formulario y corrija los errores."
          )
        } else {
          showError(
            "Error del servidor",
            result.error || "Ocurrió un error en el servidor. Por favor, intente nuevamente en unos momentos."
          )
        }
      }
    } catch (error) {
      showError(
        "Error inesperado",
        error instanceof Error ? error.message : "Ocurrió un error inesperado. Por favor, intente nuevamente o contacte al administrador."
      )
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Limpiar información del documento si cambia el RUC/DNI
    if (field === "rucDni") {
      setDocumentInfo(null)
    }
  }

  const isRuc = formData.rucDni.length === 11
  const isDni = formData.rucDni.length === 8

  return (
    <>
      <Modal />
      <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información del Documento */}
      {documentInfo && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="space-y-1">
              <p>
                <strong>Documento consultado exitosamente:</strong>
              </p>
              {isRuc ? (
                <>
                  <p>
                    <strong>Razón Social:</strong> {documentInfo.razonSocial}
                  </p>
                  <p>
                    <strong>Estado:</strong> {documentInfo.estado} - {documentInfo.condicion}
                  </p>
                  <p>
                    <strong>Dirección:</strong> {documentInfo.direccion}
                  </p>
                  {documentInfo.representanteLegal && (
                    <p>
                      <strong>Representante Legal:</strong> {documentInfo.representanteLegal}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p>
                    <strong>Nombre Completo:</strong> {documentInfo.nombreCompleto}
                  </p>
                  <p>
                    <strong>DNI:</strong> {documentInfo.dni}
                  </p>
                </>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Información Básica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="rucDni">RUC/DNI *</Label>
          <div className="flex gap-2">
            <Input
              id="rucDni"
              value={formData.rucDni}
              onChange={(e) => handleInputChange("rucDni", e.target.value)}
              placeholder="Ingrese RUC (11 dígitos) o DNI (8 dígitos)"
              maxLength={11}
              required
            />
            <Button
              type="button"
              variant="outline"
              onClick={consultarDocumento}
              disabled={consultingDocument || (!isRuc && !isDni)}
            >
              {consultingDocument ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          {formData.rucDni && (
            <p className="text-xs text-gray-500">
              {isRuc ? (
                <>RUC válido - Último dígito: {formData.rucDni.slice(-1)} (para cronograma SUNAT)</>
              ) : isDni ? (
                <>DNI válido - Persona natural</>
              ) : (
                <span className="text-orange-600">Ingrese 8 dígitos (DNI) o 11 dígitos (RUC)</span>
              )}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="razonSocial">Razón Social / Nombre Completo *</Label>
          <Input
            id="razonSocial"
            value={formData.razonSocial}
            onChange={(e) => handleInputChange("razonSocial", e.target.value)}
            placeholder="Ingrese la razón social o nombre completo"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nombreContacto">Nombre de Contacto</Label>
          <Input
            id="nombreContacto"
            value={formData.nombreContacto}
            onChange={(e) => handleInputChange("nombreContacto", e.target.value)}
            placeholder="Nombre de la persona de contacto"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            placeholder="correo@empresa.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input
            id="telefono"
            value={formData.telefono}
            onChange={(e) => handleInputChange("telefono", e.target.value)}
            placeholder="999 999 999"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="direccion">Dirección</Label>
          <Input
            id="direccion"
            value={formData.direccion}
            onChange={(e) => handleInputChange("direccion", e.target.value)}
            placeholder="Dirección completa"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="idCategoriaEmpresa">Categoría de Empresa</Label>
          <Select
            value={formData.idCategoriaEmpresa}
            onValueChange={(value) => handleInputChange("idCategoriaEmpresa", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccione categoría" />
            </SelectTrigger>
            <SelectContent>
              {catalogos.categorias?.map((categoria) => (
                <SelectItem key={categoria.IdCategoriaEmpresa} value={categoria.IdCategoriaEmpresa.toString()}>
                  {categoria.Nombre} - {categoria.Descripcion}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Asignación y Servicios */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Asignación y Servicios</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <Label htmlFor="idClasificacion">Clasificación Inicial</Label>
            <Select
              value={formData.idClasificacion}
              onValueChange={(value) => handleInputChange("idClasificacion", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione clasificación" />
              </SelectTrigger>
              <SelectContent>
                {catalogos.clasificaciones?.map((clasificacion) => (
                  <SelectItem key={clasificacion.IdClasificacion} value={clasificacion.IdClasificacion.toString()}>
                    {clasificacion.Codigo} - {clasificacion.Descripcion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="idCartera">Cartera Asignada</Label>
            <Select value={formData.idCartera} onValueChange={(value) => handleInputChange("idCartera", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione cartera" />
              </SelectTrigger>
              <SelectContent>
                {catalogos.carteras?.map((cartera) => (
                  <SelectItem key={cartera.IdCartera} value={cartera.IdCartera.toString()}>
                    {cartera.Nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="idEncargado">Encargado</Label>
            <Select value={formData.idEncargado} onValueChange={(value) => handleInputChange("idEncargado", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione encargado" />
              </SelectTrigger>
              <SelectContent>
                {catalogos.usuarios?.map((usuario) => (
                  <SelectItem key={usuario.IdUsuario} value={usuario.IdUsuario.toString()}>
                    {usuario.NombreCompleto}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="idServicio">Servicio Contratado</Label>
            <Select value={formData.idServicio} onValueChange={(value) => handleInputChange("idServicio", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione servicio" />
              </SelectTrigger>
              <SelectContent>
                {catalogos.servicios?.map((servicio) => (
                  <SelectItem key={servicio.IdServicio} value={servicio.IdServicio.toString()}>
                    {servicio.Nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Información Financiera */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Información Financiera</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="montoFijoMensual">Monto Fijo Mensual (S/)</Label>
            <Input
              id="montoFijoMensual"
              type="number"
              step="0.01"
              min="0"
              value={formData.montoFijoMensual}
              onChange={(e) => handleInputChange("montoFijoMensual", e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="flex items-center space-x-2 pt-8">
            <Checkbox
              id="aplicaMontoFijo"
              checked={formData.aplicaMontoFijo}
              onCheckedChange={(checked) => handleInputChange("aplicaMontoFijo", checked)}
            />
            <Label htmlFor="aplicaMontoFijo">Aplicar monto fijo mensual</Label>
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <Save className="h-4 w-4 mr-2" />
          {isEditing ? "Actualizar Cliente" : "Registrar Cliente"}
        </Button>
      </div>
    </form>
    </>
  )
}
