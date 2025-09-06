import { neon } from "@neondatabase/serverless"

// Verificar si DATABASE_URL está configurada
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.warn("DATABASE_URL no está configurada. El sistema funcionará en modo demo.")
}

// Solo inicializar si DATABASE_URL está disponible y estamos en el servidor
export const sql = databaseUrl && typeof window === "undefined" ? neon(databaseUrl) : null

// Función para verificar la conexión
export async function testConnection(): Promise<boolean> {
  if (!sql) return false

  try {
    await sql`SELECT 1`
    return true
  } catch (error) {
    console.error("Error testing database connection:", error)
    return false
  }
}

export type Cliente = {
  IdCliente: number
  RazonSocial: string
  NombreContacto: string | null
  RucDni: string
  UltimoDigitoRUC: number | null
  IdClasificacion: number | null
  IdCartera: number | null
  IdEncargado: number | null
  IdServicio: number | null
  MontoFijoMensual: number
  AplicaMontoFijo: boolean
  IdCategoriaEmpresa: number | null
  FechaRegistro: string
  FechaVencimiento: string | null
  Email: string | null
  Telefono: string | null
  ClasificacionCodigo?: string
  ClasificacionColor?: string
  ClasificacionDescripcion?: string
  CarteraNombre?: string
  ServicioNombre?: string
  CategoriaEmpresaNombre?: string
  SaldoPendiente?: number
}

export type Pago = {
  IdPago: number
  IdCliente: number
  Fecha: string
  IdBanco: number | null
  Monto: number
  Concepto: string
  MedioPago: string
  UrlComprobante: string | null
  MesServicio: string
  Estado: string
  ClienteRazonSocial?: string
  BancoNombre?: string
}

export type Notificacion = {
  IdNotificacion: number
  IdCliente: number
  FechaEnvio: string
  IdTipoNotificacion: number
  Contenido: string
  IdResponsable: number | null
  Estado: string
  ClienteRazonSocial?: string
  TipoNotificacionNombre?: string
  ResponsableNombre?: string
}

export type CompromisoPago = {
  IdCompromisoPago: number
  IdCliente: number
  FechaCompromiso: string
  MontoCompromiso: number
  FechaRegistro: string
  IdResponsable: number | null
  Estado: string
  Observaciones: string | null
  ClienteRazonSocial?: string
  ResponsableNombre?: string
}
