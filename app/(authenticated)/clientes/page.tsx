import { getClientes, getCatalogos } from "@/lib/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Eye, Edit, Phone, Mail } from "lucide-react"
import Link from "next/link"
import { ClientesFiltros } from "@/components/clientes-filtros"
import { EstadoClienteActions } from "@/components/estado-cliente-actions"

export const revalidate = 0

interface PageProps {
  searchParams: {
    ultimoDigito?: string
    clasificacion?: string
    cartera?: string
    search?: string
  }
}

export default async function ClientesPage({ searchParams }: PageProps) {
  const filtros = {
    ultimoDigito:
      searchParams.ultimoDigito && searchParams.ultimoDigito !== "ALL"
        ? Number.parseInt(searchParams.ultimoDigito)
        : undefined,
    clasificacion:
      searchParams.clasificacion && searchParams.clasificacion !== "ALL" ? searchParams.clasificacion : undefined,
    cartera: searchParams.cartera && searchParams.cartera !== "ALL" ? Number.parseInt(searchParams.cartera) : undefined,
  }

  const clientesResult = await getClientes(filtros)
  const catalogos = await getCatalogos()

  // Asegurar que clientes es un array
  const clientes = Array.isArray(clientesResult) ? clientesResult : []

  // Filtrar por búsqueda de texto en el lado del cliente
  let clientesFiltrados = clientes
  if (searchParams.search) {
    const searchTerm = searchParams.search.toLowerCase()
    clientesFiltrados = clientes.filter(
      (cliente) =>
        cliente.RazonSocial.toLowerCase().includes(searchTerm) ||
        cliente.RucDni.includes(searchTerm) ||
        (cliente.NombreContacto && cliente.NombreContacto.toLowerCase().includes(searchTerm)),
    )
  }

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
  if (filtros.ultimoDigito !== undefined) filtrosActivos.push(`Dígito RUC: ${filtros.ultimoDigito}`)
  if (filtros.clasificacion) filtrosActivos.push(`Clasificación: ${filtros.clasificacion}`)
  if (filtros.cartera) {
    const cartera = catalogos.carteras.find((c) => c.IdCartera === filtros.cartera)
    if (cartera) filtrosActivos.push(`Cartera: ${cartera.Nombre}`)
  }
  if (searchParams.search) filtrosActivos.push(`Búsqueda: "${searchParams.search}"`)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Clientes</h1>
              <p className="text-gray-600 mt-1">
                {clientesFiltrados.length} cliente(s) encontrado(s)
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
        <ClientesFiltros 
          catalogos={{ 
            clasificaciones: catalogos.clasificaciones, 
            carteras: catalogos.carteras 
          }} 
          searchParams={searchParams} 
        />

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
                  {clientesFiltrados.map((cliente) => (
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

            {clientesFiltrados.length === 0 && (
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
      </main>
    </div>
  )
}
