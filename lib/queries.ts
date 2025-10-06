import { sql } from "@/lib/db"

export interface Cliente {
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

export interface Pago {
  IdPago: number
  IdCliente: number
  ClienteRazonSocial: string
  Fecha: string
  IdBanco: number
  BancoNombre: string
  Monto: number
  Concepto: string
  MedioPago: string
  UrlComprobante: string
  MesServicio: string
  Estado: string
}

interface ClientesFiltros {
  ultimoDigito?: number
  clasificacion?: string
  cartera?: number
}

export async function getClientes(filtros?: ClientesFiltros): Promise<Cliente[]> {
  if (!sql) {
    throw new Error("Base de datos no disponible")
  }

  try {
    const result = await sql`
      SELECT 
        c."IdCliente",
        c."RazonSocial",
        c."NombreContacto",
        c."RucDni",
        c."UltimoDigitoRUC",
        c."IdClasificacion",
        cl."Codigo" as "ClasificacionCodigo",
        cl."Descripcion" as "ClasificacionDescripcion",
        cl."Color" as "ClasificacionColor",
        c."IdCartera",
        ca."Nombre" as "CarteraNombre",
        c."IdEncargado",
        u."NombreCompleto" as "EncargadoNombre",
        c."IdServicio",
        s."Nombre" as "ServicioNombre",
        c."MontoFijoMensual",
        c."AplicaMontoFijo",
        c."IdCategoriaEmpresa",
        ce."Nombre" as "CategoriaEmpresa",
        c."FechaRegistro",
        c."FechaVencimiento",
        c."Email",
        c."Telefono",
        c."Estado",
        COALESCE(
          (SELECT SUM(cp."MontoCompromiso") 
           FROM "CompromisoPago" cp 
           WHERE cp."IdCliente" = c."IdCliente" 
           AND cp."Estado" = 'PENDIENTE'), 0
        ) as "SaldoPendiente"
      FROM "Cliente" c
      LEFT JOIN "Clasificacion" cl ON c."IdClasificacion" = cl."IdClasificacion"
      LEFT JOIN "Cartera" ca ON c."IdCartera" = ca."IdCartera"
      LEFT JOIN "Usuario" u ON c."IdEncargado" = u."IdUsuario"
      LEFT JOIN "Servicio" s ON c."IdServicio" = s."IdServicio"
      LEFT JOIN "CategoriaEmpresa" ce ON c."IdCategoriaEmpresa" = ce."IdCategoriaEmpresa"
      WHERE (
        ${filtros?.ultimoDigito !== undefined ? sql`c."UltimoDigitoRUC" = ${filtros.ultimoDigito}` : sql`TRUE`}
        AND ${filtros?.clasificacion ? sql`cl."Codigo" = ${filtros.clasificacion}` : sql`TRUE`}
        AND ${filtros?.cartera ? sql`c."IdCartera" = ${filtros.cartera}` : sql`TRUE`}
      )
      ORDER BY c."FechaRegistro" DESC, c."RazonSocial" ASC
    `

    return Array.isArray(result) ? result as Cliente[] : []
  } catch (error) {
    console.error("Error fetching clients:", error)
    throw new Error("Error al obtener clientes")
  }
}

export async function getPagos(): Promise<Pago[]> {
  if (!sql) {
    throw new Error("Base de datos no disponible")
  }

  try {
    const result = await sql`
      SELECT 
        p."IdPago",
        p."IdCliente",
        c."RazonSocial" as "ClienteRazonSocial",
        p."Fecha",
        p."IdBanco",
        b."Nombre" as "BancoNombre",
        p."Monto",
        p."Concepto",
        p."MedioPago",
        p."UrlComprobante",
        p."MesServicio",
        p."Estado"
      FROM "Pago" p
      LEFT JOIN "Cliente" c ON p."IdCliente" = c."IdCliente"
      LEFT JOIN "Banco" b ON p."IdBanco" = b."IdBanco"
      ORDER BY p."Fecha" DESC
    `

    return result as Pago[]
  } catch (error) {
    console.error("Error fetching payments:", error)
    throw new Error("Error al obtener pagos")
  }
}

export async function getPagosPorMes(año?: number, mes?: number): Promise<Pago[]> {
  if (!sql) {
    throw new Error("Base de datos no disponible")
  }

  try {
    // Si no se especifica año y mes, usar el mes actual
    const fechaActual = new Date()
    const añoActual = año || fechaActual.getFullYear()
    const mesActual = mes || fechaActual.getMonth() + 1

    const result = await sql`
      SELECT 
        p."IdPago",
        p."IdCliente",
        c."RazonSocial" as "ClienteRazonSocial",
        p."Fecha",
        p."IdBanco",
        b."Nombre" as "BancoNombre",
        p."Monto",
        p."Concepto",
        p."MedioPago",
        p."UrlComprobante",
        p."MesServicio",
        p."Estado"
      FROM "Pago" p
      LEFT JOIN "Cliente" c ON p."IdCliente" = c."IdCliente"
      LEFT JOIN "Banco" b ON p."IdBanco" = b."IdBanco"
      WHERE EXTRACT(YEAR FROM p."Fecha") = ${añoActual}
        AND EXTRACT(MONTH FROM p."Fecha") = ${mesActual}
      ORDER BY p."Fecha" DESC
    `

    return result as Pago[]
  } catch (error) {
    console.error("Error fetching payments by month:", error)
    throw new Error("Error al obtener pagos del mes")
  }
}

export async function getClienteById(id: number): Promise<Cliente | null> {
  if (!sql) {
    throw new Error("Base de datos no disponible")
  }

  try {
    const result = await sql`
      SELECT 
        c."IdCliente",
        c."RazonSocial",
        c."NombreContacto",
        c."RucDni",
        c."UltimoDigitoRUC",
        c."IdClasificacion",
        cl."Codigo" as "ClasificacionCodigo",
        cl."Descripcion" as "ClasificacionDescripcion",
        cl."Color" as "ClasificacionColor",
        c."IdCartera",
        ca."Nombre" as "CarteraNombre",
        c."IdEncargado",
        u."NombreCompleto" as "EncargadoNombre",
        c."IdServicio",
        s."Nombre" as "ServicioNombre",
        c."MontoFijoMensual",
        c."AplicaMontoFijo",
        c."IdCategoriaEmpresa",
        ce."Nombre" as "CategoriaEmpresa",
        c."FechaRegistro",
        c."FechaVencimiento",
        c."Email",
        c."Telefono"
      FROM "Cliente" c
      LEFT JOIN "Clasificacion" cl ON c."IdClasificacion" = cl."IdClasificacion"
      LEFT JOIN "Cartera" ca ON c."IdCartera" = ca."IdCartera"
      LEFT JOIN "Usuario" u ON c."IdEncargado" = u."IdUsuario"
      LEFT JOIN "Servicio" s ON c."IdServicio" = s."IdServicio"
      LEFT JOIN "CategoriaEmpresa" ce ON c."IdCategoriaEmpresa" = ce."IdCategoriaEmpresa"
      WHERE c."IdCliente" = ${id}
    `

    return result.length > 0 ? (result[0] as Cliente) : null
  } catch (error) {
    console.error("Error fetching client:", error)
    throw new Error("Error al obtener cliente")
  }
}

export async function getPagosByClienteId(clienteId: number): Promise<Pago[]> {
  if (!sql) {
    throw new Error("Base de datos no disponible")
  }

  try {
    const result = await sql`
      SELECT 
        p."IdPago",
        p."IdCliente",
        c."RazonSocial" as "ClienteRazonSocial",
        p."Fecha",
        p."IdBanco",
        b."Nombre" as "BancoNombre",
        p."Monto",
        p."Concepto",
        p."MedioPago",
        p."UrlComprobante",
        p."MesServicio",
        p."Estado"
      FROM "Pago" p
      LEFT JOIN "Cliente" c ON p."IdCliente" = c."IdCliente"
      LEFT JOIN "Banco" b ON p."IdBanco" = b."IdBanco"
      WHERE p."IdCliente" = ${clienteId}
      ORDER BY p."Fecha" DESC
    `

    return result as Pago[]
  } catch (error) {
    console.error("Error fetching client payments:", error)
    throw new Error("Error al obtener pagos del cliente")
  }
}

// Tipos para catálogos
export interface Clasificacion {
  IdClasificacion: number
  Codigo: string
  Descripcion: string
  Color: string
}

export interface Cartera {
  IdCartera: number
  Nombre: string
}

interface CategoriaEmpresaItem {
  IdCategoriaEmpresa: number
  Nombre: string
  Descripcion: string
}

interface ServicioItem {
  IdServicio: number
  Nombre: string
  Descripcion: string
}

interface BancoItem {
  IdBanco: number
  Nombre: string
}

interface UsuarioItem {
  IdUsuario: number
  NombreCompleto: string
  Email: string
}

export interface TipoNotificacionItem {
  IdTipoNotificacion: number
  Nombre: string
}

export async function getCatalogos(): Promise<{
  clasificaciones: Clasificacion[]
  carteras: Cartera[]
  categorias: CategoriaEmpresaItem[]
  servicios: ServicioItem[]
  bancos: BancoItem[]
  usuarios: UsuarioItem[]
  tiposNotificacion: TipoNotificacionItem[]
}> {
  if (!sql) {
    throw new Error("Base de datos no disponible")
  }

  try {
    const [clasificaciones, carteras, categorias, servicios, bancos, usuarios, tiposNotificacion] = (await Promise.all([
      sql`SELECT "IdClasificacion", "Codigo", "Descripcion", "Color" FROM "Clasificacion" ORDER BY "Descripcion"`,
      sql`SELECT "IdCartera", "Nombre" FROM "Cartera" ORDER BY "Nombre"`,
      sql`SELECT "IdCategoriaEmpresa", "Nombre", "Descripcion" FROM "CategoriaEmpresa" ORDER BY "Nombre"`,
      sql`SELECT "IdServicio", "Nombre", "Descripcion" FROM "Servicio" ORDER BY "Nombre"`,
      sql`SELECT "IdBanco", "Nombre" FROM "Banco" ORDER BY "Nombre"`,
      sql`SELECT "IdUsuario", "NombreCompleto", "Email" FROM "Usuario" WHERE "Estado" = 'ACTIVO' ORDER BY "NombreCompleto"`,
      sql`SELECT "IdTipoNotificacion", "Nombre" FROM "TipoNotificacion" ORDER BY "Nombre"`
    ])) as [
      Clasificacion[],
      Cartera[],
      CategoriaEmpresaItem[],
      ServicioItem[],
      BancoItem[],
      UsuarioItem[],
      TipoNotificacionItem[]
    ]

    return {
      clasificaciones,
      carteras,
      categorias,
      servicios,
      bancos,
      usuarios,
      tiposNotificacion
    } as {
      clasificaciones: Clasificacion[]
      carteras: Cartera[]
      categorias: CategoriaEmpresaItem[]
      servicios: ServicioItem[]
      bancos: BancoItem[]
      usuarios: UsuarioItem[]
      tiposNotificacion: TipoNotificacionItem[]
    }
  } catch (error) {
    console.error("Error al obtener catálogos:", error)
    throw error
  }
}

// Interfaces para el dashboard
export interface DashboardStats {
  clientesActivos: number
  pagosMesActual: number
  ingresosTotales: number
  clientesMorosos: number
  variacionClientesActivos: number
  variacionPagosMes: number
  variacionIngresosTotales: number
  variacionClientesMorosos: number
}

export interface ActividadReciente {
  id: number
  tipo: 'pago' | 'cliente' | 'notificacion' | 'compromiso'
  descripcion: string
  monto?: string
  fecha: string
  estado: string
}

// Función para obtener estadísticas del dashboard
export async function getDashboardStats(): Promise<DashboardStats> {
  if (!sql) {
    throw new Error("Base de datos no disponible")
  }

  try {
    const fechaActual = new Date()
    const mesActual = fechaActual.getMonth() + 1
    const anioActual = fechaActual.getFullYear()
    const mesAnterior = mesActual === 1 ? 12 : mesActual - 1
    const anioMesAnterior = mesActual === 1 ? anioActual - 1 : anioActual

    // Consultas para estadísticas actuales
    const [
      clientesActivosResult,
      pagosMesActualResult,
      ingresosTotalesResult,
      clientesMorososResult,
      clientesActivosAnteriorResult,
      pagosMesAnteriorResult,
      ingresosTotalesAnteriorResult,
      clientesMorososAnteriorResult
    ] = await Promise.all([
      // Clientes activos (total de clientes)
      sql`SELECT COUNT(*) as total FROM "Cliente"`,
      
      // Pagos del mes actual
      sql`
        SELECT COALESCE(SUM("Monto"), 0) as total 
        FROM "Pago" 
        WHERE EXTRACT(MONTH FROM "Fecha") = ${mesActual} 
        AND EXTRACT(YEAR FROM "Fecha") = ${anioActual}
        AND "Estado" = 'CONFIRMADO'
      `,
      
      // Ingresos totales
      sql`
        SELECT COALESCE(SUM("Monto"), 0) as total 
        FROM "Pago" 
        WHERE "Estado" = 'CONFIRMADO'
      `,
      
      // Clientes morosos (clasificación D)
      sql`
        SELECT COUNT(*) as total 
        FROM "Cliente" c
        LEFT JOIN "Clasificacion" cl ON c."IdClasificacion" = cl."IdClasificacion"
        WHERE cl."Codigo" = 'D'
      `,
      
      // Comparaciones con mes anterior
      sql`SELECT COUNT(*) as total FROM "Cliente" WHERE "FechaRegistro" < date_trunc('month', CURRENT_DATE)`,
      
      sql`
        SELECT COALESCE(SUM("Monto"), 0) as total 
        FROM "Pago" 
        WHERE EXTRACT(MONTH FROM "Fecha") = ${mesAnterior} 
        AND EXTRACT(YEAR FROM "Fecha") = ${anioMesAnterior}
        AND "Estado" = 'CONFIRMADO'
      `,
      
      sql`
        SELECT COALESCE(SUM("Monto"), 0) as total 
        FROM "Pago" 
        WHERE "Estado" = 'CONFIRMADO'
        AND "Fecha" < date_trunc('month', CURRENT_DATE)
      `,
      
      sql`
        SELECT COUNT(*) as total 
        FROM "Cliente" c
        LEFT JOIN "Clasificacion" cl ON c."IdClasificacion" = cl."IdClasificacion"
        LEFT JOIN "HistorialClasificacion" hc ON c."IdCliente" = hc."IdCliente"
        WHERE cl."Codigo" = 'D'
        AND (hc."FechaCambio" IS NULL OR hc."FechaCambio" < date_trunc('month', CURRENT_DATE))
      `
    ])

    const clientesActivos = Number(clientesActivosResult[0]?.total || 0)
    const pagosMesActual = Number(pagosMesActualResult[0]?.total || 0)
    const ingresosTotales = Number(ingresosTotalesResult[0]?.total || 0)
    const clientesMorosos = Number(clientesMorososResult[0]?.total || 0)
    
    const clientesActivosAnterior = Number(clientesActivosAnteriorResult[0]?.total || 0)
    const pagosMesAnterior = Number(pagosMesAnteriorResult[0]?.total || 0)
    const ingresosTotalesAnterior = Number(ingresosTotalesAnteriorResult[0]?.total || 0)
    const clientesMorososAnterior = Number(clientesMorososAnteriorResult[0]?.total || 0)

    // Calcular variaciones porcentuales
    const calcularVariacion = (actual: number, anterior: number): number => {
      if (anterior === 0) return actual > 0 ? 100 : 0
      return Math.round(((actual - anterior) / anterior) * 100)
    }

    return {
      clientesActivos,
      pagosMesActual,
      ingresosTotales,
      clientesMorosos,
      variacionClientesActivos: calcularVariacion(clientesActivos, clientesActivosAnterior),
      variacionPagosMes: calcularVariacion(pagosMesActual, pagosMesAnterior),
      variacionIngresosTotales: calcularVariacion(ingresosTotales, ingresosTotalesAnterior),
      variacionClientesMorosos: calcularVariacion(clientesMorosos, clientesMorososAnterior)
    }
  } catch (error) {
    console.error("Error al obtener estadísticas del dashboard:", error)
    throw new Error("Error al obtener estadísticas del dashboard")
  }
}

// Función para obtener actividades recientes
export async function getActividadesRecientes(): Promise<ActividadReciente[]> {
  if (!sql) {
    throw new Error("Base de datos no disponible")
  }

  try {
    const actividades: ActividadReciente[] = []

    // Últimos pagos
    const pagosRecientes = await sql`
      SELECT 
        p."IdPago" as id,
        'pago' as tipo,
        CONCAT('Pago recibido de ', c."RazonSocial") as descripcion,
        CONCAT('S/ ', p."Monto") as monto,
        p."Fecha" as fecha,
        p."Estado" as estado
      FROM "Pago" p
      LEFT JOIN "Cliente" c ON p."IdCliente" = c."IdCliente"
      WHERE p."Estado" = 'CONFIRMADO'
      ORDER BY p."Fecha" DESC
      LIMIT 3
    `

    // Últimos clientes registrados
    const clientesRecientes = await sql`
      SELECT 
        c."IdCliente" as id,
        'cliente' as tipo,
        CONCAT('Nuevo cliente registrado: ', c."RazonSocial") as descripcion,
        c."FechaRegistro" as fecha,
        'nuevo' as estado
      FROM "Cliente" c
      ORDER BY c."FechaRegistro" DESC
      LIMIT 2
    `

    // Últimas notificaciones enviadas
    const notificacionesRecientes = await sql`
      SELECT 
        n."IdNotificacion" as id,
        'notificacion' as tipo,
        CASE 
          WHEN COUNT(*) > 1 THEN CONCAT('Recordatorio enviado a ', COUNT(*), ' clientes')
          ELSE CONCAT('Notificación enviada a ', c."RazonSocial")
        END as descripcion,
        n."FechaEnvio" as fecha,
        'enviado' as estado
      FROM "Notificacion" n
      LEFT JOIN "Cliente" c ON n."IdCliente" = c."IdCliente"
      WHERE n."Estado" = 'ENVIADO'
      GROUP BY n."IdNotificacion", c."RazonSocial", n."FechaEnvio", n."Estado"
      ORDER BY n."FechaEnvio" DESC
      LIMIT 2
    `

    // Últimos compromisos de pago
    const compromisosRecientes = await sql`
      SELECT 
        cp."IdCompromisoPago" as id,
        'compromiso' as tipo,
        CONCAT('Compromiso de pago registrado: ', c."RazonSocial") as descripcion,
        CONCAT('S/ ', cp."MontoCompromiso") as monto,
        cp."FechaRegistro" as fecha,
        cp."Estado" as estado
      FROM "CompromisoPago" cp
      LEFT JOIN "Cliente" c ON cp."IdCliente" = c."IdCliente"
      ORDER BY cp."FechaRegistro" DESC
      LIMIT 2
    `

interface ActividadPago {
  id: number;
  tipo: string;
  descripcion: string;
  monto: string;
  fecha: string;
  estado: string;
}

interface ActividadCliente {
  id: number;
  tipo: string;
  descripcion: string;
  fecha: string;
  estado: string;
}

interface ActividadNotificacion {
  id: number;
  tipo: string;
  descripcion: string;
  fecha: string;
  estado: string;
}

interface ActividadCompromiso {
  id: number;
  tipo: string;
  descripcion: string;
  monto: string;
  fecha: string;
  estado: string;
}

    // Combinar todas las actividades
    actividades.push(...(pagosRecientes as ActividadPago[]).map((p) => ({
      id: p.id,
      tipo: p.tipo as 'pago',
      descripcion: p.descripcion,
      monto: p.monto,
      fecha: formatearFechaRelativa(p.fecha),
      estado: p.estado
    })))

    actividades.push(...(clientesRecientes as ActividadCliente[]).map((c) => ({
      id: c.id,
      tipo: c.tipo as 'cliente',
      descripcion: c.descripcion,
      fecha: formatearFechaRelativa(c.fecha),
      estado: c.estado
    })))

    actividades.push(...(notificacionesRecientes as ActividadNotificacion[]).map((n) => ({
      id: n.id,
      tipo: n.tipo as 'notificacion',
      descripcion: n.descripcion,
      fecha: formatearFechaRelativa(n.fecha),
      estado: n.estado
    })))

    actividades.push(...(compromisosRecientes as ActividadCompromiso[]).map((cp) => ({
      id: cp.id,
      tipo: cp.tipo as 'compromiso',
      descripcion: cp.descripcion,
      monto: cp.monto,
      fecha: formatearFechaRelativa(cp.fecha),
      estado: cp.estado
    })))

    // Ordenar por fecha más reciente y limitar a 8 actividades
    return actividades
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 8)

  } catch (error) {
    console.error("Error al obtener actividades recientes:", error)
    throw new Error("Error al obtener actividades recientes")
  }
}

// Función auxiliar para formatear fechas relativas
function formatearFechaRelativa(fecha: string | Date): string {
  const ahora = new Date()
  const fechaObj = new Date(fecha)
  const diferencia = ahora.getTime() - fechaObj.getTime()
  
  const minutos = Math.floor(diferencia / (1000 * 60))
  const horas = Math.floor(diferencia / (1000 * 60 * 60))
  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24))
  
  if (minutos < 60) {
    return `Hace ${minutos} minuto${minutos !== 1 ? 's' : ''}`
  } else if (horas < 24) {
    return `Hace ${horas} hora${horas !== 1 ? 's' : ''}`
  } else if (dias < 7) {
    return `Hace ${dias} día${dias !== 1 ? 's' : ''}`
  } else {
    return fechaObj.toLocaleDateString('es-PE', { 
      day: 'numeric', 
      month: 'short',
      year: fechaObj.getFullYear() !== ahora.getFullYear() ? 'numeric' : undefined
    })
  }
}

// Interfaces adicionales
export interface Notificacion {
  IdNotificacion: number
  IdCliente: number
  ClienteRazonSocial: string
  FechaEnvio: string
  IdTipoNotificacion: number
  TipoNotificacion: string
  Contenido: string
  IdResponsable: number
  ResponsableNombre: string
  Estado: string
}

export interface CompromisoPago {
  IdCompromisoPago: number
  IdCliente: number
  ClienteRazonSocial: string
  FechaCompromiso: string
  MontoCompromiso: number
  FechaRegistro: string
  IdResponsable: number
  ResponsableNombre: string
  Estado: string
  Observaciones: string
}

// Función para obtener notificaciones
export async function getNotificaciones(clienteId?: number): Promise<Notificacion[]> {
  if (!sql) {
    throw new Error("Base de datos no disponible")
  }

  try {
    const result = await sql`
      SELECT 
        n."IdNotificacion",
        n."IdCliente",
        c."RazonSocial" as "ClienteRazonSocial",
        n."FechaEnvio",
        n."IdTipoNotificacion",
        tn."Nombre" as "TipoNotificacion",
        n."Contenido",
        n."IdResponsable",
        u."NombreCompleto" as "ResponsableNombre",
        n."Estado"
      FROM "Notificacion" n
      LEFT JOIN "Cliente" c ON n."IdCliente" = c."IdCliente"
      LEFT JOIN "TipoNotificacion" tn ON n."IdTipoNotificacion" = tn."IdTipoNotificacion"
      LEFT JOIN "Usuario" u ON n."IdResponsable" = u."IdUsuario"
      WHERE ${clienteId ? sql`n."IdCliente" = ${clienteId}` : sql`TRUE`}
      ORDER BY n."FechaEnvio" DESC
    `

    return result as Notificacion[]
  } catch (error) {
    console.error("Error fetching notifications:", error)
    throw new Error("Error al obtener notificaciones")
  }
}

// Función para obtener compromisos de pago
export async function getCompromisosPago(clienteId?: number): Promise<CompromisoPago[]> {
  if (!sql) {
    throw new Error("Base de datos no disponible")
  }

  try {
    const result = await sql`
      SELECT 
        cp."IdCompromisoPago",
        cp."IdCliente",
        c."RazonSocial" as "ClienteRazonSocial",
        cp."FechaCompromiso",
        cp."MontoCompromiso",
        cp."FechaRegistro",
        cp."IdResponsable",
        u."NombreCompleto" as "ResponsableNombre",
        cp."Estado",
        cp."Observaciones"
      FROM "CompromisoPago" cp
      LEFT JOIN "Cliente" c ON cp."IdCliente" = c."IdCliente"
      LEFT JOIN "Usuario" u ON cp."IdResponsable" = u."IdUsuario"
      WHERE ${clienteId ? sql`cp."IdCliente" = ${clienteId}` : sql`TRUE`}
      ORDER BY cp."FechaCompromiso" DESC
    `

    return result as CompromisoPago[]
  } catch (error) {
    console.error("Error fetching payment commitments:", error)
    throw new Error("Error al obtener compromisos de pago")
  }
}

// Obtener saldo pendiente por cliente (sumatoria de compromisos en estado PENDIENTE)
export async function getObtenerSaldoPendientePorCliente(clienteId: number): Promise<number> {
  if (!sql) {
    throw new Error("Base de datos no disponible")
  }

  try {
    const result = await sql`
      SELECT COALESCE(SUM(cp."MontoCompromiso"), 0) AS "SaldoPendiente"
      FROM "CompromisoPago" cp
      WHERE cp."IdCliente" = ${clienteId}
        AND cp."Estado" = 'PENDIENTE'
    `

    const saldo = Number(result[0]?.SaldoPendiente || 0)
    return saldo
  } catch (error) {
    console.error("Error al obtener saldo pendiente del cliente:", error)
    throw new Error("Error al obtener saldo pendiente del cliente")
  }
}

interface PlantillaMensaje {
  IdPlantillaMensaje: number;
  Nombre: string;
  Contenido: string;
  IdClasificacion: number;
  ClasificacionNombre: string;
}

// Función para obtener plantillas de mensajes
export async function getPlantillasMensajes(): Promise<PlantillaMensaje[]> {
  if (!sql) {
    throw new Error("Base de datos no disponible")
  }

  try {
    const result = await sql`
      SELECT 
        pm."IdPlantillaMensaje",
        pm."Nombre",
        pm."Contenido",
        pm."IdClasificacion",
        c."Descripcion" as "ClasificacionNombre"
      FROM "PlantillaMensaje" pm
      LEFT JOIN "Clasificacion" c ON pm."IdClasificacion" = c."IdClasificacion"
      ORDER BY pm."Nombre"
    `

    return result as PlantillaMensaje[]
  } catch (error) {
    console.error("Error fetching message templates:", error)
    throw new Error("Error al obtener plantillas de mensajes")
  }
}

interface CronogramaSunat {
  IdCronograma: number;
  Año: number;
  Mes: number;
  DigitoRUC: string;
  Dia: number;
  MesVencimiento: number;
}

// Función para obtener cronograma SUNAT por año
export async function getCronogramaSunatPorAño(año: number): Promise<CronogramaSunat[]> {
  if (!sql) {
    throw new Error("Base de datos no disponible")
  }

  try {
    const result = await sql`
      SELECT 
        "IdCronograma",
        "Año",
        "Mes",
        "DigitoRUC",
        "Dia",
        "MesVencimiento"
      FROM "CronogramaSunat"
      WHERE "Año" = ${año} AND "Estado" = 'ACTIVO'
      ORDER BY "Mes", "DigitoRUC"
    `

    return result as CronogramaSunat[]
  } catch (error) {
    console.error("Error fetching SUNAT cronograma:", error)
    throw new Error("Error al obtener cronograma SUNAT")
  }
}
