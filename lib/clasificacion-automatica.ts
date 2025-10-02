import { sql } from "./db"

interface CronogramaItem {
  FechaVencimiento: string | Date;
  [key: string]: unknown;
}

// interface eliminada por no uso

export interface ClienteClasificacion {
  IdCliente: number
  RazonSocial: string
  ClasificacionActual: "A" | "B" | "C"
  MesesDeuda: number
  NuevaClasificacion: "A" | "B" | "C"
  RequiereCambio: boolean
  MontoMensual: number
  TotalPagado: number
  MontoEsperado: number
  UltimoDigitoRUC: number
  ProximoVencimiento: Date | null
  ServiciosAdicionales: number
}

export interface HistorialClasificacion {
  IdCliente: number
  ClasificacionAnterior: string
  ClasificacionNueva: string
  Motivo: string
  FechaCambio: Date
  MesesDeuda: number
  MontoDeuda: number
}

export class ClasificacionAutomatica {
  /**
   * Calcula la clasificación automática basada en el cronograma SUNAT mensual
   * Considera servicios fijos mensuales + servicios adicionales
   */
  static async ejecutarClasificacionAutomatica(): Promise<ClienteClasificacion[]> {
    if (!sql) {
      throw new Error("Base de datos no configurada")
    }

    try {
      console.log("🔄 Iniciando clasificación automática...")

      // Obtener todos los clientes activos con sus datos completos
      const clientes = await sql`
        SELECT 
          c."IdCliente",
          c."RazonSocial",
          c."UltimoDigitoRUC",
          c."MontoFijoMensual",
          c."FechaRegistro",
          cl."Codigo" as "ClasificacionActual",
          cl."IdClasificacion"
        FROM "Cliente" c
        LEFT JOIN "Clasificacion" cl ON c."IdClasificacion" = cl."IdClasificacion"
        ORDER BY c."RazonSocial"
      `

      const resultados: ClienteClasificacion[] = []
      const fechaActual = new Date()
      const añoActual = fechaActual.getFullYear()

      for (const cliente of clientes) {
        // Calcular meses desde el registro hasta ahora
        const fechaRegistro = new Date(cliente.FechaRegistro)
        const mesesTranscurridos = this.calcularMesesTranscurridos(fechaRegistro, fechaActual)

        // Obtener cronograma SUNAT para este cliente
        const cronograma = await this.obtenerCronogramaSunatCliente(cliente.UltimoDigitoRUC, añoActual)

        // Calcular monto esperado (servicio fijo mensual)
        const montoEsperadoFijo = cliente.MontoFijoMensual * mesesTranscurridos

        // Obtener servicios adicionales facturados
        const serviciosAdicionales = await sql`
          SELECT COALESCE(SUM("Monto"), 0) as "TotalServicios", COUNT(*) as "CantidadServicios"
          FROM "ServicioAdicional" 
          WHERE "IdCliente" = ${cliente.IdCliente} 
            AND "Estado" = 'FACTURADO'
        `

        const montoServiciosAdicionales = Number(serviciosAdicionales[0].TotalServicios)
        const cantidadServiciosAdicionales = Number(serviciosAdicionales[0].CantidadServicios)

        // Monto total esperado = servicio fijo + servicios adicionales
        const montoTotalEsperado = montoEsperadoFijo + montoServiciosAdicionales

        // Obtener total pagado (confirmado)
        const pagosConfirmados = await sql`
          SELECT COALESCE(SUM("Monto"), 0) as "TotalPagado"
          FROM "Pago" 
          WHERE "IdCliente" = ${cliente.IdCliente} 
            AND "Estado" = 'CONFIRMADO'
        `

        const totalPagado = Number(pagosConfirmados[0].TotalPagado)

        // Calcular deuda y meses de deuda
        const montoDeuda = Math.max(0, montoTotalEsperado - totalPagado)
        const mesesDeuda = cliente.MontoFijoMensual > 0 ? Math.floor(montoDeuda / cliente.MontoFijoMensual) : 0

        // Determinar nueva clasificación según meses de deuda
        let nuevaClasificacion: "A" | "B" | "C"
        if (mesesDeuda === 0) {
          nuevaClasificacion = "A" // Al día
        } else if (mesesDeuda <= 2) {
          nuevaClasificacion = "B" // Deuda leve (1-2 meses)
        } else {
          nuevaClasificacion = "C" // Moroso (3+ meses)
        }

        const requiereCambio = cliente.ClasificacionActual !== nuevaClasificacion

        // Calcular próximo vencimiento según cronograma SUNAT
        const proximoVencimiento = this.calcularProximoVencimiento(cliente.UltimoDigitoRUC, cronograma)

        resultados.push({
          IdCliente: cliente.IdCliente,
          RazonSocial: cliente.RazonSocial,
          ClasificacionActual: cliente.ClasificacionActual as "A" | "B" | "C",
          MesesDeuda: mesesDeuda,
          NuevaClasificacion: nuevaClasificacion,
          RequiereCambio: requiereCambio,
          MontoMensual: Number(cliente.MontoFijoMensual),
          TotalPagado: totalPagado,
          MontoEsperado: montoTotalEsperado,
          UltimoDigitoRUC: cliente.UltimoDigitoRUC,
          ProximoVencimiento: proximoVencimiento,
          ServiciosAdicionales: cantidadServiciosAdicionales,
        })

        if (requiereCambio) {
          console.log(
            `📊 ${cliente.RazonSocial}: ${cliente.ClasificacionActual} → ${nuevaClasificacion} (${mesesDeuda} meses de deuda)`,
          )
        }
      }

      console.log(
        `✅ Clasificación automática completada. ${resultados.filter((r) => r.RequiereCambio).length} clientes requieren cambio.`,
      )
      return resultados
    } catch (error) {
      console.error("❌ Error en clasificación automática:", error)
      throw error
    }
  }

  /**
   * Aplica los cambios de clasificación y registra el historial
   */
  static async aplicarCambiosClasificacion(cambios: ClienteClasificacion[], idResponsable?: number): Promise<void> {
    if (!sql) {
      throw new Error("Base de datos no configurada")
    }

    try {
      const cambiosRequeridos = cambios.filter((c) => c.RequiereCambio)

      if (cambiosRequeridos.length === 0) {
        console.log("ℹ️ No hay cambios de clasificación que aplicar")
        return
      }

      console.log(`🔄 Aplicando ${cambiosRequeridos.length} cambios de clasificación...`)

      for (const cambio of cambiosRequeridos) {
        // Obtener ID de la nueva clasificación
        const nuevaClasificacion = await sql`
          SELECT "IdClasificacion" 
          FROM "Clasificacion" 
          WHERE "Codigo" = ${cambio.NuevaClasificacion}
        `

        if (nuevaClasificacion.length === 0) {
          console.error(`❌ Clasificación ${cambio.NuevaClasificacion} no encontrada`)
          continue
        }

        const idNuevaClasificacion = nuevaClasificacion[0].IdClasificacion

        // Obtener ID de la clasificación anterior
        const clasificacionAnterior = await sql`
          SELECT cl."IdClasificacion"
          FROM "Cliente" c
          JOIN "Clasificacion" cl ON c."IdClasificacion" = cl."IdClasificacion"
          WHERE c."IdCliente" = ${cambio.IdCliente}
        `

        const idClasificacionAnterior = clasificacionAnterior[0]?.IdClasificacion

        // Actualizar clasificación del cliente
        await sql`
          UPDATE "Cliente" 
          SET 
            "IdClasificacion" = ${idNuevaClasificacion},
            "FechaActualizacion" = CURRENT_TIMESTAMP
          WHERE "IdCliente" = ${cambio.IdCliente}
        `

        // Registrar en historial
        const montoDeuda = cambio.MontoEsperado - cambio.TotalPagado
        await sql`
          INSERT INTO "HistorialClasificacion" (
            "IdCliente",
            "IdClasificacionAnterior",
            "IdClasificacionNueva",
            "IdResponsable",
            "Motivo",
            "MesesDeuda",
            "MontoDeuda"
          ) VALUES (
            ${cambio.IdCliente},
            ${idClasificacionAnterior},
            ${idNuevaClasificacion},
            ${idResponsable || null},
            'Clasificación automática basada en cronograma SUNAT mensual',
            ${cambio.MesesDeuda},
            ${montoDeuda}
          )
        `

        console.log(`✅ ${cambio.RazonSocial}: ${cambio.ClasificacionActual} → ${cambio.NuevaClasificacion}`)
      }

      console.log(`✅ Cambios de clasificación aplicados exitosamente`)
    } catch (error) {
      console.error("❌ Error aplicando cambios de clasificación:", error)
      throw error
    }
  }

  /**
   * Obtiene el cronograma SUNAT para un cliente específico
   */
  private static async obtenerCronogramaSunatCliente(ultimoDigitoRUC: number, año: number): Promise<CronogramaItem[]> {
    if (!sql) return []

    try {
      // Mapear dígitos según cronograma SUNAT
      let digitoBusqueda = ultimoDigitoRUC
      if ([2, 3].includes(ultimoDigitoRUC)) digitoBusqueda = 2
      else if ([4, 5].includes(ultimoDigitoRUC)) digitoBusqueda = 4
      else if ([6, 7].includes(ultimoDigitoRUC)) digitoBusqueda = 6
      else if ([8, 9].includes(ultimoDigitoRUC)) digitoBusqueda = 8

      const cronograma = (await sql`
        SELECT 
          "DigitoRUC", 
          "Año", 
          "Mes", 
          "Dia", 
          "MesVencimiento",
          make_date(
            CASE 
              WHEN "MesVencimiento" = 12 THEN "Año" + 1
              ELSE "Año"
            END,
            "MesVencimiento",
            "Dia"
          ) AS "FechaVencimiento"
        FROM "CronogramaSunat" 
        WHERE "Año" = ${año}
          AND "DigitoRUC" = ${digitoBusqueda}
        ORDER BY "Dia" ASC
      `) as unknown as CronogramaItem[];
      
      return cronograma
    } catch (error) {
      console.error("Error obteniendo cronograma SUNAT:", error)
      return []
    }
  }

  /**
   * Calcula meses transcurridos entre dos fechas
   */
  private static calcularMesesTranscurridos(fechaInicio: Date, fechaFin: Date): number {
    const añosDiff = fechaFin.getFullYear() - fechaInicio.getFullYear()
    const mesesDiff = fechaFin.getMonth() - fechaInicio.getMonth()
    return Math.max(1, añosDiff * 12 + mesesDiff + 1)
  }

  /**
   * Calcula el próximo vencimiento según cronograma SUNAT
   */
  private static calcularProximoVencimiento(ultimoDigitoRUC: number, cronograma: CronogramaItem[]): Date | null {
    if (cronograma.length === 0) return null

    try {
      const hoy = new Date()
      const fechas = cronograma
        .map((r: CronogramaItem) => new Date(r.FechaVencimiento))
        .filter((d: Date) => !Number.isNaN(d.getTime()))
        .sort((a: Date, b: Date) => a.getTime() - b.getTime())

      const futura = fechas.find((d: Date) => d >= new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()))
      return futura || fechas[fechas.length - 1] || null
    } catch (error) {
      console.error("Error calculando próximo vencimiento:", error)
      return null
    }
  }

  /**
   * Obtiene el historial de clasificaciones
   */
  static async obtenerHistorialClasificaciones(clienteId?: number, limit = 50): Promise<HistorialClasificacion[]> {
    if (!sql) return []

    try {
      const whereClause = clienteId ? sql`WHERE h."IdCliente" = ${clienteId}` : sql``

      const historial = await sql`
        SELECT 
          h."IdCliente",
          ca."Codigo" as "ClasificacionAnterior",
          cn."Codigo" as "ClasificacionNueva",
          h."Motivo",
          h."FechaCambio",
          h."MesesDeuda",
          h."MontoDeuda",
          c."RazonSocial" as "ClienteNombre",
          u."Nombre" as "ResponsableNombre"
        FROM "HistorialClasificacion" h
        JOIN "Cliente" c ON h."IdCliente" = c."IdCliente"
        LEFT JOIN "Clasificacion" ca ON h."IdClasificacionAnterior" = ca."IdClasificacion"
        JOIN "Clasificacion" cn ON h."IdClasificacionNueva" = cn."IdClasificacion"
        LEFT JOIN "Usuario" u ON h."IdResponsable" = u."IdUsuario"
        ${whereClause}
        ORDER BY h."FechaCambio" DESC
        LIMIT ${limit}
      `

      type HistorialRow = {
        IdCliente: number
        ClasificacionAnterior?: string
        ClasificacionNueva: string
        Motivo: string
        FechaCambio: string | Date
        MesesDeuda: number
        MontoDeuda: string | number
      }

      return (historial as HistorialRow[]).map((h) => ({
        IdCliente: h.IdCliente,
        ClasificacionAnterior: h.ClasificacionAnterior || "N/A",
        ClasificacionNueva: h.ClasificacionNueva,
        Motivo: h.Motivo,
        FechaCambio: new Date(h.FechaCambio),
        MesesDeuda: h.MesesDeuda,
        MontoDeuda: Number(h.MontoDeuda),
      }))
    } catch (error) {
      console.error("Error obteniendo historial de clasificaciones:", error)
      return []
    }
  }

  /**
   * Obtiene estadísticas de clasificación
   */
  static async obtenerEstadisticasClasificacion() {
    if (!sql) {
      return {
        totalClientes: 0,
        clientesA: 0,
        clientesB: 0,
        clientesC: 0,
        cambiosHoy: 0,
        cambiosMes: 0,
      }
    }

    try {
      const estadisticas = await sql`
        SELECT 
          COUNT(*) as "TotalClientes",
          COUNT(CASE WHEN cl."Codigo" = 'A' THEN 1 END) as "ClientesA",
          COUNT(CASE WHEN cl."Codigo" = 'B' THEN 1 END) as "ClientesB",
          COUNT(CASE WHEN cl."Codigo" = 'C' THEN 1 END) as "ClientesC"
        FROM "Cliente" c
        LEFT JOIN "Clasificacion" cl ON c."IdClasificacion" = cl."IdClasificacion"
      `

      const cambiosRecientes = await sql`
        SELECT 
          COUNT(CASE WHEN DATE("FechaCambio") = CURRENT_DATE THEN 1 END) as "CambiosHoy",
          COUNT(CASE WHEN DATE("FechaCambio") >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as "CambiosMes"
        FROM "HistorialClasificacion"
      `

      return {
        totalClientes: Number(estadisticas[0].TotalClientes),
        clientesA: Number(estadisticas[0].ClientesA),
        clientesB: Number(estadisticas[0].ClientesB),
        clientesC: Number(estadisticas[0].ClientesC),
        cambiosHoy: Number(cambiosRecientes[0].CambiosHoy),
        cambiosMes: Number(cambiosRecientes[0].CambiosMes),
      }
    } catch (error) {
      console.error("Error obteniendo estadísticas de clasificación:", error)
      return {
        totalClientes: 0,
        clientesA: 0,
        clientesB: 0,
        clientesC: 0,
        cambiosHoy: 0,
        cambiosMes: 0,
      }
    }
  }
}

// Funciones de conveniencia para mantener compatibilidad
export const calcularClasificacionAutomatica =
  ClasificacionAutomatica.ejecutarClasificacionAutomatica.bind(ClasificacionAutomatica)
export const aplicarCambiosClasificacion =
  ClasificacionAutomatica.aplicarCambiosClasificacion.bind(ClasificacionAutomatica)
export const obtenerHistorialClasificaciones =
  ClasificacionAutomatica.obtenerHistorialClasificaciones.bind(ClasificacionAutomatica)
