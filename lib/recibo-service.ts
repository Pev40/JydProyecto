import { apiClient } from "@/lib/api-client"

export interface DatosRecibo {
  pagoId: number
  clienteId: number
  monto: number
  concepto: string
  metodoPago: string
  numeroOperacion?: string
  observaciones?: string
  serviciosIncluidos?: ServicioFacturado[]
}

export interface ServicioFacturado {
  nombre: string
  descripcion: string
  monto: number
  periodo?: string
  tipo: "FIJO" | "ADICIONAL"
}

export interface ReciboEnviado {
  id: number
  numeroRecibo: string
  clienteNombre: string
  emailDestinatario: string
  pagoMonto: number
  pagoConcepto: string
  estado: "ENVIADO" | "ERROR"
  fechaEnvio: string
  errorMensaje?: string
  messageId?: string
  serviciosIncluidos: ServicioFacturado[]
}

export class ReciboService {
  /**
   * Envía recibo automático considerando servicios fijos y adicionales
   */
  static async enviarReciboAutomatico(datos: DatosRecibo): Promise<{
    success: boolean
    numeroRecibo?: string
    error?: string
  }> {
    try {
      console.log(`📧 Enviando recibo automático para pago ${datos.pagoId}...`)

      // Usar el endpoint del API client para enviar recibo automático
      const resultado = await apiClient.enviarReciboAutomatico({
        pagoId: datos.pagoId,
        clienteId: datos.clienteId,
        monto: datos.monto,
        concepto: datos.concepto,
        metodoPago: datos.metodoPago,
        numeroOperacion: datos.numeroOperacion,
        observaciones: datos.observaciones,
      })

      if (resultado.success) {
        console.log(`✅ Recibo ${resultado.numeroRecibo} enviado exitosamente`)
        return { success: true, numeroRecibo: resultado.numeroRecibo }
      } else {
        console.error(`❌ Error enviando recibo:`, resultado.error)
        return { success: false, error: resultado.error }
      }
    } catch (error) {
      console.error("❌ Error enviando recibo automático:", error)
      return { success: false, error: `Error interno: ${error}` }
    }
  }

  /**
   * Genera un registro de recibo para un pago (sin enviar email) y devuelve su id y correlativo
   */
  static async generarReciboParaPago(pagoId: number): Promise<{ success: boolean; reciboId?: number; numeroRecibo?: string; error?: string }> {
    try {
      // Usar el endpoint del API client para generar recibo
      const resultado = await apiClient.generarRecibo({ pagoId })

      if (resultado.success) {
        return { 
          success: true, 
          reciboId: resultado.reciboId, 
          numeroRecibo: resultado.numeroRecibo 
        }
      } else {
        return { success: false, error: "Error generando recibo" }
      }
    } catch (error: unknown) {
      console.error("Error generando recibo:", error)
      return { success: false, error: error instanceof Error ? error.message : "Error desconocido" }
    }
  }

  /**
   * Determina qué servicios están incluidos en un pago específico
   * Ahora usa endpoints en lugar de SQL directo
   */
  private static async determinarServiciosIncluidos(
    clienteId: number,
    montoPago: number,
    mesServicio: string,
    montoFijoMensual: number,
    servicioNombre: string,
  ): Promise<ServicioFacturado[]> {
    const servicios: ServicioFacturado[] = []

    try {
      // 1. Servicio fijo mensual
      if (montoFijoMensual > 0 && montoPago >= montoFijoMensual) {
        const mesesCubiertos = Math.floor(montoPago / montoFijoMensual)

        for (let i = 0; i < mesesCubiertos; i++) {
          const fechaMes = new Date(mesServicio)
          fechaMes.setMonth(fechaMes.getMonth() + i)

          servicios.push({
            nombre: servicioNombre || "Servicio Contable",
            descripcion: `Servicio mensual - ${fechaMes.toLocaleDateString("es-PE", {
              year: "numeric",
              month: "long",
            })}`,
            monto: montoFijoMensual,
            periodo: fechaMes.toISOString().split("T")[0],
            tipo: "FIJO",
          })
        }
      }

      // 2. Servicios adicionales usando endpoint
      try {
        const serviciosAdicionalesResponse = await apiClient.getServiciosAdicionales(clienteId)
        
        if (serviciosAdicionalesResponse.success) {
          let montoRestante = montoPago - servicios.length * montoFijoMensual

          for (const servicio of serviciosAdicionalesResponse.servicios) {
            if (montoRestante >= Number(servicio.monto)) {
              servicios.push({
                nombre: servicio.nombreservicio,
                descripcion: servicio.descripcion || "Servicio adicional",
                monto: Number(servicio.monto),
                periodo: new Date(servicio.fecha).toLocaleDateString("es-PE"),
                tipo: "ADICIONAL",
              })

              montoRestante -= Number(servicio.monto)
            }
          }
        }
      } catch (error) {
        console.error("Error obteniendo servicios adicionales:", error)
      }

      return servicios
    } catch (error) {
      console.error("Error determinando servicios incluidos:", error)

      // Fallback: solo servicio básico
      return [
        {
          nombre: servicioNombre || "Servicio Contable",
          descripcion: "Servicio mensual",
          monto: montoPago,
          tipo: "FIJO",
        },
      ]
    }
  }

  /**
   * Obtiene recibos enviados con paginación usando API client
   */
  static async obtenerRecibosEnviados(
    limit = 20,
    offset = 0,
  ): Promise<{
    recibos: ReciboEnviado[]
    total: number
    hasMore: boolean
  }> {
    try {
      const resultado = await apiClient.getRecibosEnviados({ limit, offset })
      
      if (resultado.success) {
        return {
          recibos: resultado.recibos as ReciboEnviado[],
          total: resultado.total,
          hasMore: resultado.hasMore,
        }
      } else {
        return { recibos: [], total: 0, hasMore: false }
      }
    } catch (error: unknown) {
      console.error("Error obteniendo recibos enviados:", error)
      return { recibos: [], total: 0, hasMore: false }
    }
  }

  /**
   * Obtiene estadísticas de recibos usando API client
   */
  static async obtenerEstadisticasRecibos(): Promise<{
    total: number
    enviados: number
    errores: number
    hoy: number
    mesActual: number
    montoTotalRecibos: number
  }> {
    try {
      const resultado = await apiClient.getEstadisticasRecibos()
      
      if (resultado.success) {
        return {
          total: resultado.estadisticas.totalRecibos,
          enviados: resultado.estadisticas.enviados,
          errores: resultado.estadisticas.errores,
          hoy: resultado.estadisticas.hoy,
          mesActual: resultado.estadisticas.mesActual,
          montoTotalRecibos: resultado.estadisticas.montoTotalRecibos,
        }
      } else {
        return { total: 0, enviados: 0, errores: 0, hoy: 0, mesActual: 0, montoTotalRecibos: 0 }
      }
    } catch (error) {
      console.error("Error obteniendo estadísticas de recibos:", error)
      return { total: 0, enviados: 0, errores: 0, hoy: 0, mesActual: 0, montoTotalRecibos: 0 }
    }
  }

  /**
   * Reenvía un recibo existente usando API client
   */
  static async reenviarRecibo(reciboId: number): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const resultado = await apiClient.reenviarRecibo(reciboId)
      
      return {
        success: resultado.success,
        error: resultado.success ? undefined : "Error reenviando recibo",
      }
    } catch (error) {
      console.error("Error reenviando recibo:", error)
      return { success: false, error: `Error interno: ${error}` }
    }
  }
}

// Funciones de conveniencia para mantener compatibilidad
export const enviarReciboAutomatico = ReciboService.enviarReciboAutomatico.bind(ReciboService)
export const obtenerRecibosEnviados = ReciboService.obtenerRecibosEnviados.bind(ReciboService)
export const obtenerEstadisticasRecibos = ReciboService.obtenerEstadisticasRecibos.bind(ReciboService)
export const generarReciboParaPago = ReciboService.generarReciboParaPago.bind(ReciboService)
