import nodemailer from "nodemailer"

export interface NotificationConfig {
  email: boolean
  whatsapp: boolean
  emailConfig?: {
    host: string
    port: number
    user: string
    pass: string
    from: string
  }
  whatsappConfig?: {
    baseUrl: string
    instanceKey: string
    token: string
  }
}

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export interface WhatsAppMessage {
  number: string
  message: string
}

export class NotificationService {
  private static emailTransporter: nodemailer.Transporter | null = null

  static validateConfiguration(): NotificationConfig {
    const config: NotificationConfig = {
      email: false,
      whatsapp: false,
    }

    // Validar configuración de email
    if (
      process.env.EMAIL_HOST &&
      process.env.EMAIL_PORT &&
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASS &&
      process.env.EMAIL_FROM
    ) {
      config.email = true
      config.emailConfig = {
        host: process.env.EMAIL_HOST,
        port: Number.parseInt(process.env.EMAIL_PORT),
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
        from: process.env.EMAIL_FROM,
      }
    }

    // Validar configuración de WhatsApp
    if (process.env.EVOLUTION_BASE_URL && process.env.EVOLUTION_INSTANCE_KEY && process.env.EVOLUTION_TOKEN) {
      config.whatsapp = true
      config.whatsappConfig = {
        baseUrl: process.env.EVOLUTION_BASE_URL,
        instanceKey: process.env.EVOLUTION_INSTANCE_KEY,
        token: process.env.EVOLUTION_TOKEN,
      }
    }

    return config
  }

  static async sendEmail(options: EmailOptions): Promise<{
    success: boolean
    messageId?: string
    error?: string
  }> {
    try {
      const config = this.validateConfiguration()

      if (!config.email || !config.emailConfig) {
        return { success: false, error: "Configuración de email no disponible" }
      }

      // Crear transporter si no existe
      if (!this.emailTransporter) {
        this.emailTransporter = nodemailer.createTransporter({
          host: config.emailConfig.host,
          port: config.emailConfig.port,
          secure: config.emailConfig.port === 465,
          auth: {
            user: config.emailConfig.user,
            pass: config.emailConfig.pass,
          },
        })
      }

      const mailOptions = {
        from: config.emailConfig.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }

      const result = await this.emailTransporter.sendMail(mailOptions)

      return {
        success: true,
        messageId: result.messageId,
      }
    } catch (error) {
      console.error("Error enviando email:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      }
    }
  }

  static async sendWhatsApp(message: WhatsAppMessage): Promise<{
    success: boolean
    messageId?: string
    error?: string
  }> {
    try {
      const config = this.validateConfiguration()

      if (!config.whatsapp || !config.whatsappConfig) {
        return { success: false, error: "Configuración de WhatsApp no disponible" }
      }

      const response = await fetch(
        `${config.whatsappConfig.baseUrl}/message/sendText/${config.whatsappConfig.instanceKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.whatsappConfig.token}`,
          },
          body: JSON.stringify({
            number: message.number,
            text: message.message,
          }),
        },
      )

      const result = await response.json()

      if (response.ok && result.key) {
        return {
          success: true,
          messageId: result.key.id,
        }
      } else {
        return {
          success: false,
          error: result.message || "Error enviando WhatsApp",
        }
      }
    } catch (error) {
      console.error("Error enviando WhatsApp:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      }
    }
  }

  static async sendNotification(
    tipo: string,
    destinatario: string,
    mensaje: string,
    asunto: string,
    clienteNombre: string,
  ): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      if (tipo === "EMAIL") {
        const htmlMessage = this.generateEmailTemplate(clienteNombre, mensaje, "notificacion")
        return await this.sendEmail({
          to: destinatario,
          subject: asunto,
          html: htmlMessage,
          text: mensaje.replace(/<[^>]*>/g, ""), // Remover HTML para texto plano
        })
      } else if (tipo === "WHATSAPP") {
        // Limpiar HTML del mensaje para WhatsApp
        const textMessage = mensaje
          .replace(/<[^>]*>/g, "")
          .replace(/\s+/g, " ")
          .trim()
        return await this.sendWhatsApp({
          number: destinatario,
          message: `${asunto}\n\n${textMessage}`,
        })
      }

      return { success: false, error: "Tipo de notificación no válido" }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      }
    }
  }

  static generateEmailTemplate(clienteNombre: string, contenido: string, tipo: "recibo" | "notificacion"): string {
    const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || "J & D CONSULTORES DE NEGOCIOS S.A.C."

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${tipo === "recibo" ? "Recibo de Pago" : "Notificación"}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1f2937; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            h1 { margin: 0; }
            h2 { color: #1f2937; }
            .highlight { background-color: #fef3c7; padding: 10px; border-left: 4px solid #f59e0b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${companyName}</h1>
              <p>${tipo === "recibo" ? "Recibo de Pago" : "Notificación Importante"}</p>
            </div>
            <div class="content">
              <h2>Estimado/a ${clienteNombre},</h2>
              ${contenido}
            </div>
            <div class="footer">
              <p>Este es un mensaje automático del sistema de ${companyName}</p>
              <p>Para cualquier consulta, comuníquese con nosotros a través de nuestros canales oficiales.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  static getTiposNotificacion() {
    return {
      EMAIL: "EMAIL",
      WHATSAPP: "WHATSAPP",
      SMS: "SMS",
    }
  }

  static async testConfiguration(): Promise<{
    email: { available: boolean; error?: string }
    whatsapp: { available: boolean; error?: string }
  }> {
    const result = {
      email: { available: false, error: undefined as string | undefined },
      whatsapp: { available: false, error: undefined as string | undefined },
    }

    // Test email
    try {
      const config = this.validateConfiguration()
      if (config.email && config.emailConfig) {
        const testResult = await this.sendEmail({
          to: config.emailConfig.from,
          subject: "Test de Configuración - Sistema de Cobranza",
          html: "<p>Este es un email de prueba del sistema de cobranza.</p>",
        })
        result.email.available = testResult.success
        if (!testResult.success) {
          result.email.error = testResult.error
        }
      } else {
        result.email.error = "Configuración de email incompleta"
      }
    } catch (error) {
      result.email.error = error instanceof Error ? error.message : "Error desconocido"
    }

    // Test WhatsApp
    try {
      const config = this.validateConfiguration()
      if (config.whatsapp && config.whatsappConfig) {
        // Solo verificar que la configuración esté presente
        // No enviar mensaje de prueba para evitar spam
        result.whatsapp.available = true
      } else {
        result.whatsapp.error = "Configuración de WhatsApp incompleta"
      }
    } catch (error) {
      result.whatsapp.error = error instanceof Error ? error.message : "Error desconocido"
    }

    return result
  }
}
