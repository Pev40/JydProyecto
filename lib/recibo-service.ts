import { sql } from "@/lib/db"
import { render } from "@react-email/render"
import { ReciboEmailTemplate } from "./email-templates"
import renderReciboPdfBuffer from "./recibo-pdf"
import nodemailer from "nodemailer"

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
    if (!sql) {
      return { success: false, error: "Base de datos no configurada" }
    }

    try {
      console.log(`📧 Enviando recibo automático para pago ${datos.pagoId}...`)

      // Obtener información completa del pago y cliente
      const resultado = await sql`
        SELECT 
          p."IdPago",
          p."Monto",
          p."Concepto",
          p."MedioPago",
          p."Fecha",
          p."Observaciones",
          p."MesServicio",
          c."IdCliente",
          c."RazonSocial",
          c."Email",
          c."RucDni",
          c."MontoFijoMensual",
          s."Nombre" as "ServicioNombre"
        FROM "Pago" p
        JOIN "Cliente" c ON p."IdCliente" = c."IdCliente"
        LEFT JOIN "Servicio" s ON c."IdServicio" = s."IdServicio"
        WHERE p."IdPago" = ${datos.pagoId}
      `

      if (resultado.length === 0) {
        return { success: false, error: "Pago no encontrado" }
      }

      const pago = resultado[0]

      if (!pago.Email) {
        return { success: false, error: "Cliente no tiene email registrado" }
      }

      // Determinar servicios incluidos en este pago
      const serviciosIncluidos = await this.determinarServiciosIncluidos(
        datos.clienteId,
        Number(pago.Monto),
        pago.MesServicio,
        Number(pago.MontoFijoMensual),
        pago.ServicioNombre,
      )

      // Generar número de recibo único
      const numeroRecibo = await this.generarNumeroRecibo()

      // Generar HTML del recibo con servicios detallados
  const htmlRecibo = await render(
        ReciboEmailTemplate({
          numeroRecibo,
          clienteNombre: pago.RazonSocial,
          clienteRuc: pago.RucDni,
          fechaPago: new Date(pago.Fecha).toLocaleDateString("es-PE"),
          monto: Number(pago.Monto),
          concepto: pago.Concepto,
          metodoPago: pago.MedioPago,
          numeroOperacion: datos.numeroOperacion,
          observaciones: pago.Observaciones,
          serviciosIncluidos: serviciosIncluidos,
          mesServicio: pago.MesServicio
            ? new Date(pago.MesServicio).toLocaleDateString("es-PE", {
                year: "numeric",
                month: "long",
              })
            : undefined,
        }),
      )

      // Generar PDF buffer para adjuntar
      let pdfBuffer: Buffer | undefined = undefined
      try {
        const reciboDataForPdf = {
          RazonSocial: pago.RazonSocial,
          RucDni: pago.RucDni,
          NumeroRecibo: numeroRecibo,
          Fecha: pago.Fecha,
          FechaEnvio: new Date().toISOString(),
          Monto: pago.Monto,
          Concepto: pago.Concepto,
        }
        pdfBuffer = await renderReciboPdfBuffer(reciboDataForPdf, serviciosIncluidos)
      } catch (e) {
        console.error('Error generando PDF del recibo:', e)
        pdfBuffer = undefined
      }

      // Enviar email usando configuración SMTP (adjuntando PDF si se generó)
      const resultadoEmail = await this.enviarEmail({
        to: pago.Email,
        subject: `Recibo de Pago ${numeroRecibo} - ${pago.RazonSocial}`,
        html: htmlRecibo,
        attachPdfBuffer: pdfBuffer,
      })

      // Registrar el envío del recibo con servicios incluidos
      const estado = resultadoEmail.success ? "ENVIADO" : "ERROR"
      await sql`
        INSERT INTO "ReciboEnviado" (
          "IdPago",
          "IdCliente",
          "NumeroRecibo",
          "EmailDestinatario",
          "Estado",
          "MessageId",
          "ErrorMensaje",
          "ServiciosIncluidos"
        ) VALUES (
          ${datos.pagoId},
          ${datos.clienteId},
          ${numeroRecibo},
          ${pago.Email},
          ${estado},
          ${resultadoEmail.messageId || null},
          ${resultadoEmail.error || null},
          ${JSON.stringify(serviciosIncluidos)}
        )
      `

      if (resultadoEmail.success) {
        console.log(`✅ Recibo ${numeroRecibo} enviado exitosamente a ${pago.Email}`)
        return { success: true, numeroRecibo }
      } else {
        console.error(`❌ Error enviando recibo ${numeroRecibo}:`, resultadoEmail.error)
        return { success: false, error: resultadoEmail.error }
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
    if (!sql) {
      return { success: false, error: "Base de datos no configurada" }
    }

    try {
      const pagoRows = await sql`
        SELECT 
          p."IdPago", p."IdCliente", p."Monto", p."Concepto", p."Fecha", c."Email"
        FROM "Pago" p
        JOIN "Cliente" c ON p."IdCliente" = c."IdCliente"
        WHERE p."IdPago" = ${pagoId}
      `

      if (pagoRows.length === 0) {
        return { success: false, error: "Pago no encontrado" }
      }

      const pago = pagoRows[0]
      const numeroRecibo = await this.generarNumeroRecibo()

      const inserted = await sql`
        INSERT INTO "ReciboEnviado" (
          "IdPago",
          "IdCliente",
          "NumeroRecibo",
          "EmailDestinatario",
          "Estado",
          "ServiciosIncluidos"
        ) VALUES (
          ${pago.IdPago},
          ${pago.IdCliente},
          ${numeroRecibo},
          ${pago.Email || ''},
          'GENERADO',
          ${JSON.stringify([])}
        ) RETURNING "IdReciboEnviado"
      `

      const reciboId = inserted[0].IdReciboEnviado as number
      return { success: true, reciboId, numeroRecibo }
    } catch (error: any) {
      // Si la tabla no existe en la base de datos, devolver un error claro
      if (error && error.code === '42P01') {
        console.error('Error generando recibo: tabla "ReciboEnviado" no existe en la BD')
        return { success: false, error: 'Tabla ReciboEnviado no encontrada en la base de datos. Ejecuta las migraciones.' }
      }

      console.error("Error generando recibo:", error)
      return { success: false, error: error instanceof Error ? error.message : "Error desconocido" }
    }
  }

  /**
   * Determina qué servicios están incluidos en un pago específico
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
      if (!sql) {
        console.warn('DB no disponible al determinar servicios incluidos')
        return servicios
      }
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

      // 2. Servicios adicionales pendientes de pago
      const serviciosAdicionales = await sql`
        SELECT 
          "IdServicioAdicional",
          "NombreServicio",
          "Descripcion",
          "Monto",
          "Fecha"
        FROM "ServicioAdicional"
        WHERE "IdCliente" = ${clienteId}
          AND "Estado" = 'FACTURADO'
          AND "IdServicioAdicional" NOT IN (
            SELECT DISTINCT "IdServicioAdicional"
            FROM "DetallePagoServicio" dps
            JOIN "Pago" p ON dps."IdPago" = p."IdPago"
            WHERE p."Estado" = 'CONFIRMADO'
              AND "IdServicioAdicional" IS NOT NULL
          )
        ORDER BY "Fecha" ASC
      `

      // Asignar servicios adicionales al pago actual
      let montoRestante = montoPago - servicios.length * montoFijoMensual

      for (const servicio of serviciosAdicionales) {
        if (montoRestante >= Number(servicio.Monto)) {
          servicios.push({
            nombre: servicio.NombreServicio,
            descripcion: servicio.Descripcion || "Servicio adicional",
            monto: Number(servicio.Monto),
            periodo: new Date(servicio.Fecha).toLocaleDateString("es-PE"),
            tipo: "ADICIONAL",
          })

          montoRestante -= Number(servicio.Monto)

          // Registrar que este servicio adicional fue pagado
          await sql`
            INSERT INTO "DetallePagoServicio" (
              "IdPago", 
              "IdServicioAdicional", 
              "Monto"
            ) VALUES (
              (SELECT "IdPago" FROM "Pago" WHERE "IdCliente" = ${clienteId} ORDER BY "Fecha" DESC LIMIT 1),
              ${servicio.IdServicioAdicional},
              ${servicio.Monto}
            )
          `
        }
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
   * Obtiene recibos enviados con paginación
   */
  static async obtenerRecibosEnviados(
    limit = 20,
    offset = 0,
  ): Promise<{
    recibos: ReciboEnviado[]
    total: number
    hasMore: boolean
  }> {
    if (!sql) {
      return { recibos: [], total: 0, hasMore: false }
    }

    try {
      // Obtener recibos con paginación
      const recibos = await sql`
        SELECT 
          r."IdReciboEnviado" as id,
          r."NumeroRecibo" as "numeroRecibo",
          r."EmailDestinatario" as "emailDestinatario",
          r."Estado" as estado,
          r."FechaEnvio" as "fechaEnvio",
          r."ErrorMensaje" as "errorMensaje",
          r."MessageId" as "messageId",
          r."ServiciosIncluidos" as "serviciosIncluidos",
          c."RazonSocial" as "clienteNombre",
          p."Monto" as "pagoMonto",
          p."Concepto" as "pagoConcepto"
        FROM "ReciboEnviado" r
        JOIN "Cliente" c ON r."IdCliente" = c."IdCliente"
        LEFT JOIN "Pago" p ON r."IdPago" = p."IdPago"
        ORDER BY r."FechaEnvio" DESC
        LIMIT ${limit} OFFSET ${offset}
      `

      // Obtener total de registros
      const totalResult = await sql`
        SELECT COUNT(*) as total FROM "ReciboEnviado"
      `

      const total = Number(totalResult[0].total)
      const hasMore = offset + limit < total

      // Parsear servicios incluidos
      const recibosConServicios = recibos.map((recibo: any) => ({
        ...recibo,
        serviciosIncluidos: recibo.serviciosIncluidos ? JSON.parse(recibo.serviciosIncluidos) : [],
      }))

      return {
        recibos: recibosConServicios as ReciboEnviado[],
        total,
        hasMore,
      }
    } catch (error: any) {
      if (error && error.code === '42P01') {
        console.error('Error obteniendo recibos enviados: tabla "ReciboEnviado" no existe en la BD')
        return { recibos: [], total: 0, hasMore: false }
      }

      console.error("Error obteniendo recibos enviados:", error)
      return { recibos: [], total: 0, hasMore: false }
    }
  }

  /**
   * Obtiene estadísticas de recibos
   */
  static async obtenerEstadisticasRecibos(): Promise<{
    total: number
    enviados: number
    errores: number
    hoy: number
    mesActual: number
    montoTotalRecibos: number
  }> {
    if (!sql) {
      return { total: 0, enviados: 0, errores: 0, hoy: 0, mesActual: 0, montoTotalRecibos: 0 }
    }

    try {
      const estadisticas = await sql`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN "Estado" = 'ENVIADO' THEN 1 END) as enviados,
          COUNT(CASE WHEN "Estado" = 'ERROR' THEN 1 END) as errores,
          COUNT(CASE WHEN DATE("FechaEnvio") = CURRENT_DATE THEN 1 END) as hoy,
          COUNT(CASE WHEN DATE("FechaEnvio") >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as "mesActual"
        FROM "ReciboEnviado"
      `

      const montoTotal = await sql`
        SELECT COALESCE(SUM(p."Monto"), 0) as "montoTotal"
        FROM "ReciboEnviado" r
        JOIN "Pago" p ON r."IdPago" = p."IdPago"
        WHERE r."Estado" = 'ENVIADO'
      `

      return {
        total: Number(estadisticas[0].total),
        enviados: Number(estadisticas[0].enviados),
        errores: Number(estadisticas[0].errores),
        hoy: Number(estadisticas[0].hoy),
        mesActual: Number(estadisticas[0].mesActual),
        montoTotalRecibos: Number(montoTotal[0].montoTotal),
      }
    } catch (error) {
      console.error("Error obteniendo estadísticas de recibos:", error)
      return { total: 0, enviados: 0, errores: 0, hoy: 0, mesActual: 0, montoTotalRecibos: 0 }
    }
  }

  /**
   * Genera número de recibo único
   */
  private static async generarNumeroRecibo(): Promise<string> {
    if (!sql) {
      return `REC-${Date.now()}`
    }

    try {
      // Obtener el último número de recibo del año actual
      const añoActual = new Date().getFullYear()
      const ultimoRecibo = await sql`
        SELECT "NumeroRecibo" 
        FROM "ReciboEnviado" 
        WHERE "NumeroRecibo" LIKE ${`REC-${añoActual}-%`}
        ORDER BY "IdReciboEnviado" DESC 
        LIMIT 1
      `

      let siguienteNumero = 1

      if (ultimoRecibo.length > 0) {
        const ultimoNumero = ultimoRecibo[0].NumeroRecibo
        const match = ultimoNumero.match(/REC-\d{4}-(\d+)/)
        if (match) {
          siguienteNumero = Number.parseInt(match[1]) + 1
        }
      }

      return `REC-${añoActual}-${siguienteNumero.toString().padStart(6, "0")}`
    } catch (error) {
      console.error("Error generando número de recibo:", error)
      return `REC-${new Date().getFullYear()}-${Date.now()}`
    }
  }

  /**
   * Envía email usando configuración SMTP
   */
  private static async enviarEmail(datos: {
    to: string
    subject: string
    html: string
    attachPdfBuffer?: Buffer
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Configuración SMTP desde variables de entorno
      const smtpHost = process.env.EMAIL_HOST
      const smtpPort = Number(process.env.EMAIL_PORT || 587)
      const smtpUser = process.env.EMAIL_USER
      const smtpPass = process.env.EMAIL_PASS
      console.log('SMTP Config:', { smtpHost, smtpPort, smtpUser, smtpPass: smtpPass ? '****' : undefined })
      if (!smtpHost || !smtpUser || !smtpPass) {
        console.error('SMTP no configurado en environment variables')
        return { success: false, error: 'SMTP no configurado' }
      }

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      })

      const message: any = {
        from: process.env.SMTP_FROM || smtpUser,
        to: datos.to,
        subject: datos.subject,
        html: datos.html,
      }

      if (datos.attachPdfBuffer) {
        message.attachments = [
          {
            filename: `recibo.pdf`,
            content: datos.attachPdfBuffer,
            contentType: 'application/pdf',
          },
        ]
      }

      const info = await transporter.sendMail(message)
      return { success: true, messageId: info.messageId }
    } catch (error) {
      console.error('Error enviando email:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  /**
   * Reenvía un recibo existente
   */
  static async reenviarRecibo(reciboId: number): Promise<{
    success: boolean
    error?: string
  }> {
    if (!sql) {
      return { success: false, error: "Base de datos no configurada" }
    }

    try {
      // Obtener información del recibo
      const recibo = await sql`
        SELECT 
          r.*,
          c."RazonSocial",
          c."RucDni",
          p."Monto",
          p."Concepto",
          p."MedioPago",
          p."Fecha",
          p."Observaciones"
        FROM "ReciboEnviado" r
        JOIN "Cliente" c ON r."IdCliente" = c."IdCliente"
        LEFT JOIN "Pago" p ON r."IdPago" = p."IdPago"
        WHERE r."IdReciboEnviado" = ${reciboId}
      `

      if (recibo.length === 0) {
        return { success: false, error: "Recibo no encontrado" }
      }

      const reciboData = recibo[0]
      // Parsear ServiciosIncluidos de forma segura (puede ser JSONB o cadena vacía)
      let serviciosIncluidos: any[] = []
      try {
        if (reciboData.ServiciosIncluidos) {
          serviciosIncluidos = typeof reciboData.ServiciosIncluidos === 'string'
            ? JSON.parse(reciboData.ServiciosIncluidos || '[]')
            : reciboData.ServiciosIncluidos
        }
      } catch (parseError) {
        console.error('Error parseando ServiciosIncluidos para recibo', reciboId, 'valor:', reciboData.ServiciosIncluidos, parseError)
        serviciosIncluidos = []
      }

      // Generar HTML del recibo
  const htmlRecibo = await render(
        ReciboEmailTemplate({
          numeroRecibo: reciboData.NumeroRecibo,
          clienteNombre: reciboData.RazonSocial,
          clienteRuc: reciboData.RucDni,
          fechaPago: new Date(reciboData.Fecha).toLocaleDateString("es-PE"),
          monto: Number(reciboData.Monto),
          concepto: reciboData.Concepto,
          metodoPago: reciboData.MedioPago,
          observaciones: reciboData.Observaciones,
          serviciosIncluidos: serviciosIncluidos,
        }),
      )

      // Generar PDF buffer para adjuntar al reenvío
      let pdfBuffer: Buffer | undefined = undefined
      try {
        pdfBuffer = await renderReciboPdfBuffer(reciboData, serviciosIncluidos)
      } catch (e) {
        console.error('Error generando PDF para reenvío del recibo', reciboId, e)
        pdfBuffer = undefined
      }

      // Reenviar email
      const resultadoEmail = await this.enviarEmail({
        to: reciboData.EmailDestinatario,
        subject: `Recibo de Pago ${reciboData.NumeroRecibo} - ${reciboData.RazonSocial}`,
        html: htmlRecibo,
        attachPdfBuffer: pdfBuffer,
      })

      // Actualizar estado del recibo
      const nuevoEstado = resultadoEmail.success ? "ENVIADO" : "ERROR"
      await sql`
        UPDATE "ReciboEnviado" 
        SET 
          "Estado" = ${nuevoEstado},
          "MessageId" = ${resultadoEmail.messageId || null},
          "ErrorMensaje" = ${resultadoEmail.error || null},
          "FechaEnvio" = CURRENT_TIMESTAMP
        WHERE "IdReciboEnviado" = ${reciboId}
      `

      return {
        success: resultadoEmail.success,
        error: resultadoEmail.error,
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
