"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Eye, Edit, Phone, Mail, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ClientesFiltros } from "@/components/clientes-filtros"
import { EstadoClienteActions } from "@/components/estado-cliente-actions"

interface Cliente {
  IdCliente: number
  RazonSocial: string
  NombreContacto: string
  RucDni: string
  UltimoDigitoRUC: number
  IdClasificacion: number
  ClasificacionCodigo: string
  ClasificacionDescripcion: string
  ClasificacionColor: string
  IdCartera: number
  CarteraNombre: string
  IdEncargado: number
  EncargadoNombre: string
  IdServicio: number
  ServicioNombre: string
  MontoFijoMensual: number
  AplicaMontoFijo: boolean
  IdCategoriaEmpresa: number
  CategoriaEmpresa: string
  FechaRegistro: string
  FechaVencimiento: string
  Email: string
  Telefono: string
  Estado: string
  SaldoPendiente?: number
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface Catalogos {
  clasificaciones: Array<{ IdClasificacion: number; Codigo: string; Descripcion: string; Color: string }>
  carteras: Array<{ IdCartera: number; Nombre: string }>
}

export default function ClientesPage() {
  const searchParams = useSearchParams()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [catalogos, setCatalogos] = useState<Catalogos>({ clasificaciones: [], carteras: [] })
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Construir URL con parámetros
      const params = new URLSearchParams()
      const ultimoDigito = searchParams.get("ultimoDigito")
      const clasificacion = searchParams.get("clasificacion")
      const cartera = searchParams.get("cartera")
      const search = searchParams.get("search")
      const page = searchParams.get("page") || "1"

      if (ultimoDigito) params.append("ultimoDigito", ultimoDigito)
      if (clasificacion) params.append("clasificacion", clasificacion)
      if (cartera) params.append("cartera", cartera)
      if (search) params.append("search", search)
      params.append("page", page)
      params.append("limit", "20")

      const [clientesResponse, catalogosResponse] = await Promise.all([
        fetch(`/api/clientes?${params}`),
        fetch('/api/catalogos')
      ])

      if (!clientesResponse.ok) {
        throw new Error('Error cargando clientes')
      }

      if (!catalogosResponse.ok) {
        throw new Error('Error cargando catálogos')
      }

      const clientesData = await clientesResponse.json()
      const catalogosData = await catalogosResponse.json()

      if (clientesData.success === false) {
        throw new Error(clientesData.error || 'Error en la respuesta de clientes')
      }

      if (catalogosData.success === false) {
        throw new Error(catalogosData.error || 'Error en la respuesta de catálogos')
      }

      setClientes(Array.isArray(clientesData.clientes) ? clientesData.clientes : [])
      setPagination(clientesData.pagination)
      setCatalogos(catalogosData)
    } catch (error) {
      console.error('Error cargando datos:', error)
      setError("Error al cargar los datos. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const getClasificacionBadge = (codigo: string | undefined, color: string | undefined) => {
    if (!codigo) return null

    const colorClass =
      color === "green"
        ? "bg-green-100 text-green-800"
        : color === "orange"
          ? "bg-orange-100 text-orange-800"
          : color === "red"
            ? "bg-red-100 text-red-800"
            : "bg-gray-100 text-gray-800"

    return (
      <Badge variant="secondary" className={colorClass}>
        {codigo}
      </Badge>
    )
  }

  // Construir descripción de filtros activos
  const filtrosActivos = []
  const ultimoDigito = searchParams.get("ultimoDigito")
  const clasificacion = searchParams.get("clasificacion")
  const cartera = searchParams.get("cartera")
  const search = searchParams.get("search")

  if (ultimoDigito && ultimoDigito !== "ALL") filtrosActivos.push(`Dígito RUC: ${ultimoDigito}`)
  if (clasificacion && clasificacion !== "ALL") filtrosActivos.push(`Clasificación: ${clasificacion}`)
  if (cartera && cartera !== "ALL") {
    const carteraInfo = catalogos.carteras.find((c) => c.IdCartera === Number.parseInt(cartera))
    if (carteraInfo) filtrosActivos.push(`Cartera: ${carteraInfo.Nombre}`)
  }
  if (search) filtrosActivos.push(`Búsqueda: "${search}"`)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando clientes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={cargarDatos}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Clientes</h1>
              <p className="text-gray-600 mt-1">
                {pagination ? `${pagination.total} cliente(s) total(es)` : `${clientes.length} cliente(s)`}
                {filtrosActivos.length > 0 && <span className="text-blue-600"> - {filtrosActivos.join(", ")}</span>}
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/">
                <Button variant="outline">Volver al Dashboard</Button>
              </Link>
              <Link href="/clientes/nuevo">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Cliente
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Componente de Filtros */}
        <ClientesFiltros catalogos={catalogos} searchParams={searchParams} />

        {/* Filtros rápidos por dígito */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Filtro rápido por dígito RUC:</h3>
          <div className="flex gap-2 flex-wrap">
            <Link href="/clientes">
              <Button variant={!searchParams.ultimoDigito ? "default" : "outline"} size="sm">
                Todos
              </Button>
            </Link>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digito) => (
              <Link key={digito} href={`/clientes?ultimoDigito=${digito}`}>
                <Button variant={searchParams.ultimoDigito === digito.toString() ? "default" : "outline"} size="sm">
                  {digito}
                </Button>
              </Link>
            ))}
          </div>
        </div>

        {/* Tabla de clientes */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Razón Social</TableHead>
                    <TableHead>RUC/DNI</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Clasificación</TableHead>
                    <TableHead>Cartera</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Monto Mensual</TableHead>
                    <TableHead>Saldo Pendiente</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(clientes) && clientes.map((cliente) => (
                    <TableRow key={cliente.IdCliente}>
                      <TableCell className="font-medium">
                        {cliente.RazonSocial}
                        <div className="text-xs text-gray-500">Dígito: {cliente.UltimoDigitoRUC}</div>
                      </TableCell>
                      <TableCell>{cliente.RucDni}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{cliente.NombreContacto}</div>
                          <div className="flex gap-2 mt-1">
                            {cliente.Email && (
                              <a href={`mailto:${cliente.Email}`} className="text-blue-600 hover:text-blue-800">
                                <Mail className="h-3 w-3" />
                              </a>
                            )}
                            {cliente.Telefono && (
                              <a href={`tel:${cliente.Telefono}`} className="text-green-600 hover:text-green-800">
                                <Phone className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={cliente.Estado === "ACTIVO" ? "default" : "secondary"}
                          className={
                            cliente.Estado === "ACTIVO" 
                              ? "bg-green-100 text-green-800 hover:bg-green-200" 
                              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                          }
                        >
                          {cliente.Estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getClasificacionBadge(cliente.ClasificacionCodigo, cliente.ClasificacionColor)}
                      </TableCell>
                      <TableCell>{cliente.CarteraNombre}</TableCell>
                      <TableCell>{cliente.ServicioNombre}</TableCell>
                      <TableCell>
                        S/ {cliente.MontoFijoMensual.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            cliente.SaldoPendiente && cliente.SaldoPendiente > 0
                              ? "text-red-600 font-medium"
                              : "text-green-600"
                          }
                        >
                          S/ {(cliente.SaldoPendiente || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/clientes/${cliente.IdCliente}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3" />
                            </Button>
                          </Link>
                          <Link href={`/clientes/${cliente.IdCliente}/editar`}>
                            <Button size="sm" variant="outline">
                              <Edit className="h-3 w-3" />
                            </Button>
                          </Link>
                          <EstadoClienteActions
                            clienteId={cliente.IdCliente}
                            estadoActual={cliente.Estado}
                            razonSocial={cliente.RazonSocial}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {clientes.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No se encontraron clientes con los filtros aplicados.</p>
                <div className="mt-4 space-x-2">
                  <Link href="/clientes">
                    <Button variant="outline">Limpiar Filtros</Button>
                  </Link>
                  <Link href="/clientes/nuevo">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar Nuevo Cliente
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paginación */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} resultados
            </div>
            <div className="flex items-center space-x-2">
              {pagination.hasPrevPage && (
                <Link
                  href={`/clientes?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: (pagination.page - 1).toString() }).toString()}`}
                >
                  <Button variant="outline" size="sm">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                </Link>
              )}

              <span className="text-sm text-gray-700">
                Página {pagination.page} de {pagination.totalPages}
              </span>

              {pagination.hasNextPage && (
                <Link
                  href={`/clientes?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: (pagination.page + 1).toString() }).toString()}`}
                >
                  <Button variant="outline" size="sm">
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
