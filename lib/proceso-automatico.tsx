import { sql } from "./db"
import { NotificationService } from "./notification-service"
import { ClasificacionAutomatica } from "./clasificacion-automatica"

export interface ProcesoAutomaticoResult {
  fecha: string
  clientesProcesados: number
  serviciosGenerados: number
  recordatoriosEnviados: number
  errores: string[]
  resumen: string
}

// Tipos auxiliares
export interface ClienteCorte {
  IdCliente: number
  RazonSocial: string
  Email?: string
  Telefono?: string
  UltimoDigitoRUC: number
  MontoFijoMensual: number
  Estado: string
  ServicioNombre: string
}

export interface RecordatorioRow {
  IdRecordatorio: number
  IdCliente: number
  Mensaje: string
  TipoRecordatorio: string
  RazonSocial: string
  Email?: string
  Telefono?: string
}

export interface LogRow {
  Fecha: string
  ClientesProcesados: number
  ServiciosGenerados: number
  RecordatoriosEnviados: number
  Errores: string
  Resumen: string
  Estado: string
}

export class ProcesoAutomatico {
  /**
   * Proceso principal que se ejecuta diariamente a las 06:00 AM
   * Flujo: Verificar cronograma → Si es corte → Generar servicio → Programar recordatorio para mañana
   */
  static async ejecutarProcesoDiario(): Promise<ProcesoAutomaticoResult> {
    const fechaHoy = new Date()
    const resultado: ProcesoAutomaticoResult = {
      fecha: fechaHoy.toISOString().split("T")[0],
      clientesProcesados: 0,
      serviciosGenerados: 0,
      recordatoriosEnviados: 0,
      errores: [],
      resumen: "",
    }

    try {
      console.log(`🤖 Iniciando proceso automático diario - ${resultado.fecha} 06:00 AM`)

      // 1. Verificar si hoy es día de corte SUNAT para algún cliente
      const clientesCorteHoy = await this.obtenerClientesCorteHoy(fechaHoy)
      console.log(`📅 Clientes con corte hoy: ${clientesCorteHoy.length}`)

      // 2. Si es día de corte → Generar servicios mensuales
      if (clientesCorteHoy.length > 0) {
        const serviciosResult = await this.generarServiciosMensuales(clientesCorteHoy)
        resultado.serviciosGenerados = serviciosResult.generados
        resultado.errores.push(...serviciosResult.errores)

        // 3. Programar recordatorios para el día siguiente (mañana)
        if (serviciosResult.generados > 0) {
          await this.programarRecordatoriosParaManana(clientesCorteHoy)
        }
      }

      // 4. Enviar recordatorios programados para hoy
      const recordatoriosResult = await this.enviarRecordatoriosProgramados(fechaHoy)
      resultado.recordatoriosEnviados = recordatoriosResult.enviados
      resultado.errores.push(...recordatoriosResult.errores)

      // 5. Ejecutar clasificación automática
      await ClasificacionAutomatica.ejecutarClasificacionAutomatica()
        .then((clasificaciones) => {
          const cambios = clasificaciones.filter((c) => c.RequiereCambio)
          if (cambios.length > 0) {
            return ClasificacionAutomatica.aplicarCambiosClasificacion(cambios)
          }
        })
        .catch((error) => {
          resultado.errores.push(`Error en clasificación automática: ${error.message}`)
        })

      // 6. Registrar ejecución del proceso
      await this.registrarEjecucionProceso(resultado)

      resultado.clientesProcesados = clientesCorteHoy.length
      resultado.resumen = this.generarResumenProceso(resultado)

      console.log(`✅ Proceso automático completado: ${resultado.resumen}`)
      return resultado
    } catch (error) {
      console.error("❌ Error en proceso automático diario:", error)
      resultado.errores.push(`Error general: ${error instanceof Error ? error.message : "Error desconocido"}`)
      resultado.resumen = `Error en proceso: ${resultado.errores.length} errores`
      return resultado
    }
  }

  /**
   * Obtiene clientes que tienen corte SUNAT en la fecha especificada
   */
  private static async obtenerClientesCorteHoy(fecha: Date): Promise<ClienteCorte[]> {
    if (!sql) return []

    try {
      const año = fecha.getFullYear()
      const mes = fecha.getMonth() + 1
      const dia = fecha.getDate()

      const clientes = await sql`
        SELECT 
          c."IdCliente",
          c."RazonSocial",
          c."Email",
          c."Telefono",
          c."UltimoDigitoRUC",
          c."MontoFijoMensual",
          c."Estado",
          s."Nombre" as "ServicioNombre",
          cs."Dia" as "DiaCorte",
          cs."MesVencimiento",
          COALESCE(
            (SELECT SUM(cp."Monto") 
             FROM "CompromisoPago" cp 
             WHERE cp."IdCliente" = c."IdCliente" 
             AND cp."Estado" = 'PENDIENTE'), 0
          ) as "SaldoPendiente"
        FROM "Cliente" c
        JOIN "Servicio" s ON c."IdServicio" = s."IdServicio"
        JOIN "CronogramaSunat" cs ON (
          (c."UltimoDigitoRUC" = cs."DigitoRUC") OR 
          (c."UltimoDigitoRUC" IN (2,3) AND cs."DigitoRUC" = 2) OR
          (c."UltimoDigitoRUC" IN (4,5) AND cs."DigitoRUC" = 4) OR
          (c."UltimoDigitoRUC" IN (6,7) AND cs."DigitoRUC" = 6) OR
          (c."UltimoDigitoRUC" IN (8,9) AND cs."DigitoRUC" = 8)
        )
        WHERE cs."Año" = ${año}
          AND cs."Mes" = ${mes}
          AND cs."Dia" = ${dia}
          AND (
            c."Estado" = 'ACTIVO' OR 
            (c."Estado" = 'INACTIVO' AND COALESCE(
              (SELECT SUM(cp."Monto") 
               FROM "CompromisoPago" cp 
               WHERE cp."IdCliente" = c."IdCliente" 
               AND cp."Estado" = 'PENDIENTE'), 0
            ) > 0)
          )
        ORDER BY c."RazonSocial"
      `

      return clientes
    } catch (error) {
      console.error("Error obteniendo clientes con corte hoy:", error)
      return []
    }
  }

  /**
   * Genera servicios mensuales automáticos para clientes con corte hoy
   */
  private static async generarServiciosMensuales(clientes: ClienteCorte[]): Promise<{
    generados: number
    errores: string[]
  }> {
    const resultado = { generados: 0, errores: [] }

    if (!sql) {
      resultado.errores.push("Base de datos no configurada")
      return resultado
    }

    try {
      const fechaHoy = new Date()
      const mesServicio = new Date(fechaHoy.getFullYear(), fechaHoy.getMonth(), 1)

      for (const cliente of clientes) {
        try {
          // Verificar si ya se generó el servicio para este mes
          const servicioExistente = await sql`
            SELECT "IdServicioAdicional"
            FROM "ServicioAdicional"
            WHERE "IdCliente" = ${cliente.IdCliente}
              AND "Fecha" >= ${mesServicio.toISOString().split("T")[0]}
              AND "Fecha" < ${new Date(fechaHoy.getFullYear(), fechaHoy.getMonth() + 1, 1).toISOString().split("T")[0]}
              AND "NombreServicio" = ${cliente.ServicioNombre}
              AND "Tipo" = 'MENSUAL'
          `

          if (servicioExistente.length > 0) {
            console.log(`⏭️ Servicio mensual ya existe para ${cliente.RazonSocial}`)
            continue
          }

          // Generar servicio mensual automático
          await sql`
            INSERT INTO "ServicioAdicional" (
              "IdCliente",
              "NombreServicio",
              "Descripcion",
              "Monto",
              "Fecha",
              "Estado",
              "Tipo",
              "MesServicio"
            ) VALUES (
              ${cliente.IdCliente},
              ${cliente.ServicioNombre},
              ${"Servicio mensual - " + mesServicio.toLocaleDateString("es-PE", { year: "numeric", month: "long" })},
              ${cliente.MontoFijoMensual},
              ${fechaHoy.toISOString().split("T")[0]},
              'FACTURADO',
              'MENSUAL',
              ${mesServicio.toISOString().split("T")[0]}
            )
          `

          // Enviar email inmediato de servicio generado
          await this.enviarEmailServicioGenerado(cliente, mesServicio)

          resultado.generados++
          console.log(`✅ Servicio mensual generado para ${cliente.RazonSocial}`)
        } catch (error) {
          const errorMsg = `Error generando servicio para ${cliente.RazonSocial}: ${error}`
          resultado.errores.push(errorMsg)
          console.error(errorMsg)
        }
      }

      return resultado
    } catch (error) {
      resultado.errores.push(`Error general generando servicios: ${error}`)
      return resultado
    }
  }

  /**
   * Programa recordatorios para el día siguiente (mañana)
   * Se ejecuta después de generar servicios hoy
   */
  private static async programarRecordatoriosParaManana(clientes: ClienteCorte[]): Promise<void> {
    if (!sql) return

    try {
      const fechaManana = new Date()
      fechaManana.setDate(fechaManana.getDate() + 1)

      for (const cliente of clientes) {
        try {
          // Verificar si ya existe recordatorio programado para mañana
          const recordatorioExistente = await sql`
            SELECT "IdRecordatorio"
            FROM "RecordatorioProgramado"
            WHERE "IdCliente" = ${cliente.IdCliente}
              AND "FechaProgramada" = ${fechaManana.toISOString().split("T")[0]}
              AND "Estado" = 'PROGRAMADO'
          `

          if (recordatorioExistente.length > 0) {
            console.log(`⏭️ Recordatorio ya programado para ${cliente.RazonSocial}`)
            continue
          }

          // Programar recordatorio para mañana
          await sql`
            INSERT INTO "RecordatorioProgramado" (
              "IdCliente",
              "FechaProgramada",
              "TipoRecordatorio",
              "Mensaje",
              "Estado",
              "FechaCreacion"
            ) VALUES (
              ${cliente.IdCliente},
              ${fechaManana.toISOString().split("T")[0]},
              'PAGO_PENDIENTE',
              ${"Recordatorio: Tiene servicios pendientes de pago. Por favor, comuníquese para coordinar el pago."},
              'PROGRAMADO',
              ${new Date().toISOString()}
            )
          `

          console.log(`📅 Recordatorio programado para mañana: ${cliente.RazonSocial}`)
        } catch (error) {
          console.error(`Error programando recordatorio para ${cliente.RazonSocial}:`, error)
        }
      }
    } catch (error) {
      console.error("Error general programando recordatorios:", error)
    }
  }

  /**
   * Envía recordatorios que fueron programados para hoy
   */
  private static async enviarRecordatoriosProgramados(fechaHoy: Date): Promise<{
    enviados: number
    errores: string[]
  }> {
    const resultado = { enviados: 0, errores: [] }

    if (!sql) {
      resultado.errores.push("Base de datos no configurada")
      return resultado
    }

    try {
      // Obtener recordatorios programados para hoy
      const recordatoriosProgramados = await sql`
        SELECT 
          rp."IdRecordatorio",
          rp."IdCliente",
          rp."Mensaje",
          rp."TipoRecordatorio",
          c."RazonSocial",
          c."Email",
          c."Telefono"
        FROM "RecordatorioProgramado" rp
        JOIN "Cliente" c ON rp."IdCliente" = c."IdCliente"
        WHERE rp."FechaProgramada" = ${fechaHoy.toISOString().split("T")[0]}
          AND rp."Estado" = 'PROGRAMADO'
          AND c."Estado" = 'ACTIVO'
        ORDER BY c."RazonSocial"
      `

      console.log(`📨 Recordatorios programados para hoy: ${recordatoriosProgramados.length}`)

      for (const recordatorio of recordatoriosProgramados as RecordatorioRow[]) {
        try {
          let enviado = false

          // Intentar enviar por email primero
          if (recordatorio.Email) {
            const emailResult = await NotificationService.sendEmail({
              to: recordatorio.Email,
              subject: `Recordatorio de Pago - ${process.env.NEXT_PUBLIC_COMPANY_NAME || "J&D Consultores"}`,
              html: `
                <h3>Estimado ${recordatorio.RazonSocial}</h3>
                <p>${recordatorio.Mensaje}</p>
                <p>Para consultas o coordinación de pagos, puede contactarnos a través de nuestros canales habituales.</p>
                <br>
                <p>Atentamente,<br>
                ${process.env.NEXT_PUBLIC_COMPANY_NAME || "J&D Consultores"}</p>
              `,
            })

            if (emailResult.success) {
              enviado = true
            }
          }

          // Si no se pudo enviar por email, intentar WhatsApp
          if (!enviado && recordatorio.Telefono && NotificationService.validateConfiguration().whatsapp) {
            const whatsappResult = await NotificationService.sendWhatsApp(
              recordatorio.Telefono,
              recordatorio.Mensaje,
              recordatorio.RazonSocial,
            )

            if (whatsappResult.success) {
              enviado = true
            }
          }

          if (enviado) {
            // Marcar recordatorio como enviado
            await sql`
              UPDATE "RecordatorioProgramado"
              SET "Estado" = 'ENVIADO',
                  "FechaEnvio" = ${new Date().toISOString()}
              WHERE "IdRecordatorio" = ${recordatorio.IdRecordatorio}
            `

            // Registrar notificación en historial
            await sql`
              INSERT INTO "Notificacion" (
                "IdCliente",
                "IdTipoNotificacion",
                "Contenido",
                "IdResponsable",
                "Estado"
              ) VALUES (
                ${recordatorio.IdCliente},
                ${NotificationService.getTiposNotificacion().EMAIL},
                ${recordatorio.Mensaje},
                1,
                'ENVIADO'
              )
            `

            resultado.enviados++
            console.log(`📨 Recordatorio enviado a ${recordatorio.RazonSocial}`)
          } else {
            // Marcar como error
            await sql`
              UPDATE "RecordatorioProgramado"
              SET "Estado" = 'ERROR',
                  "FechaEnvio" = ${new Date().toISOString()}
              WHERE "IdRecordatorio" = ${recordatorio.IdRecordatorio}
            `

            resultado.errores.push(`No se pudo enviar recordatorio a ${recordatorio.RazonSocial}`)
          }
        } catch (error) {
          resultado.errores.push(`Error enviando recordatorio a ${recordatorio.RazonSocial}: ${error}`)
        }
      }

      return resultado
    } catch (error) {
      resultado.errores.push(`Error general enviando recordatorios: ${error}`)
      return resultado
    }
  }

  /**
   * Envía email inmediato cuando se genera un servicio mensual
   */
  private static async enviarEmailServicioGenerado(cliente: ClienteCorte, mesServicio: Date): Promise<void> {
    try {
      const mesNombre = mesServicio.toLocaleDateString("es-PE", { year: "numeric", month: "long" })

      if (cliente.Email) {
        const emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Servicio Contable Generado</h2>
            
            <p>Estimado <strong>${cliente.RazonSocial}</strong>,</p>
            
            <p>Le informamos que se ha realizado el servicio contable contratado correspondiente al mes de <strong>${mesNombre}</strong>.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #374151;">Detalles del Servicio:</h3>
              <p><strong>Servicio:</strong> ${cliente.ServicioNombre}</p>
              <p><strong>Período:</strong> ${mesNombre}</p>
              <p><strong>Monto:</strong> S/ ${Number(cliente.MontoFijoMensual).toFixed(2)}</p>
              <p><strong>Estado:</strong> Servicio realizado - Pendiente de pago</p>
            </div>
            
            <p>Por favor, comuníquese con nosotros para coordinar el pago o puede realizarlo a través de nuestros canales habituales.</p>
            
            <p>Mañana recibirá un recordatorio adicional para facilitar la coordinación del pago.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="color: #6b7280; font-size: 14px;">
              Gracias por confiar en nuestros servicios.<br>
              <strong>${process.env.NEXT_PUBLIC_COMPANY_NAME || "J&D Consultores"}</strong>
            </p>
          </div>
        `

        await NotificationService.sendEmail({
          to: cliente.Email,
          subject: `Servicio Realizado - ${cliente.ServicioNombre} ${mesNombre}`,
          html: emailContent,
        })

        console.log(`📧 Email de servicio generado enviado a ${cliente.RazonSocial}`)
      }
    } catch (error) {
      console.error(`Error enviando email de servicio generado a ${cliente.RazonSocial}:`, error)
    }
  }

  /**
   * Registra la ejecución del proceso en la base de datos
   */
  private static async registrarEjecucionProceso(resultado: ProcesoAutomaticoResult): Promise<void> {
    if (!sql) return

    try {
      await sql`
        INSERT INTO "LogProcesoAutomatico" (
          "Fecha",
          "ClientesProcesados",
          "ServiciosGenerados", 
          "RecordatoriosEnviados",
          "Errores",
          "Resumen",
          "Estado"
        ) VALUES (
          ${resultado.fecha},
          ${resultado.clientesProcesados},
          ${resultado.serviciosGenerados},
          ${resultado.recordatoriosEnviados},
          ${JSON.stringify(resultado.errores)},
          ${resultado.resumen},
          ${resultado.errores.length > 0 ? "CON_ERRORES" : "EXITOSO"}
        )
      `
    } catch (error) {
      console.error("Error registrando ejecución del proceso:", error)
    }
  }

  /**
   * Genera resumen del proceso ejecutado
   */
  private static generarResumenProceso(resultado: ProcesoAutomaticoResult): string {
    const partes = []

    if (resultado.serviciosGenerados > 0) {
      partes.push(`${resultado.serviciosGenerados} servicios generados`)
    }

    if (resultado.recordatoriosEnviados > 0) {
      partes.push(`${resultado.recordatoriosEnviados} recordatorios enviados`)
    }

    if (resultado.errores.length > 0) {
      partes.push(`${resultado.errores.length} errores`)
    }

    if (partes.length === 0) {
      return "Sin actividades programadas para hoy"
    }

    return partes.join(", ")
  }

  /**
   * Obtiene el historial de ejecuciones del proceso
   */
  static async obtenerHistorialProceso(limit = 30): Promise<LogRow[]> {
    if (!sql) return []

    try {
      const historial = await sql`
        SELECT *
        FROM "LogProcesoAutomatico"
        ORDER BY "Fecha" DESC
        LIMIT ${limit}
      `

      return (historial as LogRow[]).map((log) => ({
        ...log,
        Errores: JSON.parse(log.Errores || "[]"),
      })) as unknown as LogRow[]
    } catch (error) {
      console.error("Error obteniendo historial del proceso:", error)
      return []
    }
  }

  /**
   * Ejecuta el proceso manualmente (para testing)
   */
  static async ejecutarProcesoManual(): Promise<ProcesoAutomaticoResult> {
    console.log("🔧 Ejecutando proceso automático manualmente...")
    return await this.ejecutarProcesoDiario()
  }
}

// Función para ser llamada por cron job
export const ejecutarProcesoDiario = ProcesoAutomatico.ejecutarProcesoDiario.bind(ProcesoAutomatico)
export const ejecutarProcesoManual = ProcesoAutomatico.ejecutarProcesoManual.bind(ProcesoAutomatico)
