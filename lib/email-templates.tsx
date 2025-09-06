import { Body, Container, Head, Heading, Html, Preview, Section, Text, Row, Column, Hr } from "@react-email/components"
import type { ServicioFacturado } from "./recibo-service"

interface ReciboEmailTemplateProps {
  numeroRecibo: string
  clienteNombre: string
  clienteRuc: string
  fechaPago: string
  monto: number
  concepto: string
  metodoPago: string
  numeroOperacion?: string
  observaciones?: string
  serviciosIncluidos?: ServicioFacturado[]
  mesServicio?: string
}

export function ReciboEmailTemplate({
  numeroRecibo,
  clienteNombre,
  clienteRuc,
  fechaPago,
  monto,
  concepto,
  metodoPago,
  numeroOperacion,
  observaciones,
  serviciosIncluidos = [],
  mesServicio,
}: ReciboEmailTemplateProps) {
  const empresaNombre = process.env.NEXT_PUBLIC_COMPANY_NAME || "J & D CONSULTORES DE NEGOCIOS S.A.C."
  const empresaEmail = process.env.EMAIL_FROM || "admin@jdconsultores.com"
  const empresaTelefono = "+51 999 888 777"
  const empresaDireccion = "Av. Principal 123, Lima, Perú"

  return (
    <Html>
      <Head />
      <Preview>
        Recibo de Pago {numeroRecibo} - {empresaNombre}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Row>
              <Column>
                <Heading style={h1}>{empresaNombre}</Heading>
                <Text style={companyInfo}>
                  {empresaDireccion}
                  <br />
                  Tel: {empresaTelefono}
                  <br />
                  Email: {empresaEmail}
                </Text>
              </Column>
              <Column align="right">
                <Text style={receiptNumber}>
                  RECIBO DE PAGO
                  <br />
                  <strong>{numeroRecibo}</strong>
                </Text>
              </Column>
            </Row>
          </Section>

          <Hr style={hr} />

          {/* Client Info */}
          <Section style={section}>
            <Heading style={h2}>Información del Cliente</Heading>
            <Text style={text}>
              <strong>Cliente:</strong> {clienteNombre}
              <br />
              <strong>RUC/DNI:</strong> {clienteRuc}
              <br />
              <strong>Fecha de Pago:</strong> {fechaPago}
            </Text>
          </Section>

          {/* Payment Details */}
          <Section style={section}>
            <Heading style={h2}>Detalle del Pago</Heading>
            <Text style={text}>
              <strong>Concepto:</strong> {concepto}
              <br />
              <strong>Método de Pago:</strong> {metodoPago}
              <br />
              {numeroOperacion && (
                <>
                  <strong>Número de Operación:</strong> {numeroOperacion}
                  <br />
                </>
              )}
              {mesServicio && (
                <>
                  <strong>Período de Servicio:</strong> {mesServicio}
                  <br />
                </>
              )}
            </Text>
          </Section>

          {/* Services Included */}
          {serviciosIncluidos.length > 0 && (
            <Section style={section}>
              <Heading style={h2}>Servicios Incluidos</Heading>
              <div style={tableContainer}>
                <table style={table}>
                  <thead>
                    <tr style={tableHeader}>
                      <th style={tableHeaderCell}>Servicio</th>
                      <th style={tableHeaderCell}>Descripción</th>
                      <th style={tableHeaderCell}>Período</th>
                      <th style={tableHeaderCell}>Tipo</th>
                      <th style={tableHeaderCell}>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviciosIncluidos.map((servicio, index) => (
                      <tr key={index} style={tableRow}>
                        <td style={tableCell}>{servicio.nombre}</td>
                        <td style={tableCell}>{servicio.descripcion}</td>
                        <td style={tableCell}>{servicio.periodo || "N/A"}</td>
                        <td style={tableCell}>
                          <span style={servicio.tipo === "FIJO" ? tagFijo : tagAdicional}>
                            {servicio.tipo === "FIJO" ? "Mensual" : "Adicional"}
                          </span>
                        </td>
                        <td style={tableCellAmount}>
                          S/ {servicio.monto.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {/* Total Amount */}
          <Section style={section}>
            <div style={totalContainer}>
              <Text style={totalText}>
                <strong>TOTAL PAGADO: S/ {monto.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</strong>
              </Text>
            </div>
          </Section>

          {/* Observations */}
          {observaciones && (
            <Section style={section}>
              <Heading style={h2}>Observaciones</Heading>
              <Text style={text}>{observaciones}</Text>
            </Section>
          )}

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Gracias por su pago. Este recibo es generado automáticamente por nuestro sistema de cobranza.
            </Text>
            <Text style={footerText}>
              Para consultas, contáctenos a {empresaEmail} o al {empresaTelefono}
            </Text>
            <Text style={footerTextSmall}>{empresaNombre} - Sistema de Gestión de Cobranza</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Estilos CSS-in-JS
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
}

const header = {
  padding: "20px 30px",
}

const h1 = {
  color: "#1f2937",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 10px",
  lineHeight: "1.25",
}

const h2 = {
  color: "#374151",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 15px",
}

const companyInfo = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "1.4",
  margin: "0",
}

const receiptNumber = {
  color: "#1f2937",
  fontSize: "16px",
  fontWeight: "600",
  textAlign: "right" as const,
  margin: "0",
}

const section = {
  padding: "0 30px 20px",
}

const text = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0",
}

const hr = {
  borderColor: "#e5e7eb",
  margin: "20px 0",
}

const tableContainer = {
  margin: "15px 0",
}

const table = {
  width: "100%",
  borderCollapse: "collapse" as const,
  border: "1px solid #e5e7eb",
}

const tableHeader = {
  backgroundColor: "#f9fafb",
}

const tableHeaderCell = {
  border: "1px solid #e5e7eb",
  padding: "12px 8px",
  textAlign: "left" as const,
  fontSize: "12px",
  fontWeight: "600",
  color: "#374151",
}

const tableRow = {
  borderBottom: "1px solid #e5e7eb",
}

const tableCell = {
  border: "1px solid #e5e7eb",
  padding: "10px 8px",
  fontSize: "12px",
  color: "#374151",
}

const tableCellAmount = {
  ...tableCell,
  textAlign: "right" as const,
  fontWeight: "600",
}

const tagFijo = {
  backgroundColor: "#dbeafe",
  color: "#1e40af",
  padding: "2px 6px",
  borderRadius: "4px",
  fontSize: "10px",
  fontWeight: "500",
}

const tagAdicional = {
  backgroundColor: "#fef3c7",
  color: "#92400e",
  padding: "2px 6px",
  borderRadius: "4px",
  fontSize: "10px",
  fontWeight: "500",
}

const totalContainer = {
  backgroundColor: "#f9fafb",
  border: "2px solid #e5e7eb",
  borderRadius: "8px",
  padding: "20px",
  textAlign: "center" as const,
}

const totalText = {
  color: "#1f2937",
  fontSize: "18px",
  fontWeight: "700",
  margin: "0",
}

const footer = {
  padding: "20px 30px 0",
  textAlign: "center" as const,
}

const footerText = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0 0 10px",
}

const footerTextSmall = {
  color: "#9ca3af",
  fontSize: "12px",
  margin: "0",
}

// Template para notificaciones de recordatorio
interface RecordatorioEmailTemplateProps {
  clienteNombre: string
  montoDeuda: number
  mesesDeuda: number
  serviciosPendientes: string[]
  fechaVencimiento?: string
  clasificacion: "A" | "B" | "C"
}

export function RecordatorioEmailTemplate({
  clienteNombre,
  montoDeuda,
  mesesDeuda,
  serviciosPendientes,
  fechaVencimiento,
  clasificacion,
}: RecordatorioEmailTemplateProps) {
  const empresaNombre = process.env.NEXT_PUBLIC_COMPANY_NAME || "J & D CONSULTORES DE NEGOCIOS S.A.C."
  const empresaEmail = process.env.EMAIL_FROM || "admin@jdconsultores.com"
  const empresaTelefono = "+51 999 888 777"

  const getTituloSegunClasificacion = () => {
    switch (clasificacion) {
      case "B":
        return "Recordatorio de Pago - Cuenta Pendiente"
      case "C":
        return "URGENTE: Regularización de Cuenta Vencida"
      default:
        return "Recordatorio de Pago"
    }
  }

  const getMensajeSegunClasificacion = () => {
    switch (clasificacion) {
      case "B":
        return "Le recordamos que tiene pagos pendientes. Por favor regularice su situación a la brevedad para evitar inconvenientes."
      case "C":
        return "Su cuenta presenta una deuda vencida. Es urgente que se comunique con nosotros para evitar la suspensión del servicio."
      default:
        return "Le recordamos sobre el estado de su cuenta."
    }
  }

  const colorSegunClasificacion = clasificacion === "C" ? "#dc2626" : clasificacion === "B" ? "#d97706" : "#059669"

  return (
    <Html>
      <Head />
      <Preview>
        {getTituloSegunClasificacion()} - {empresaNombre}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>{empresaNombre}</Heading>
            <Text style={companyInfo}>
              Tel: {empresaTelefono} | Email: {empresaEmail}
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Title */}
          <Section style={section}>
            <Heading style={{ ...h1, color: colorSegunClasificacion }}>{getTituloSegunClasificacion()}</Heading>
          </Section>

          {/* Client Info */}
          <Section style={section}>
            <Text style={text}>
              Estimado(a) <strong>{clienteNombre}</strong>,
            </Text>
            <Text style={{ ...text, marginTop: "15px" }}>{getMensajeSegunClasificacion()}</Text>
          </Section>

          {/* Debt Details */}
          <Section style={section}>
            <div style={{ ...totalContainer, borderColor: colorSegunClasificacion }}>
              <Text style={{ ...totalText, color: colorSegunClasificacion }}>
                MONTO PENDIENTE: S/ {montoDeuda.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </Text>
              <Text style={{ ...text, marginTop: "10px" }}>Meses de deuda: {mesesDeuda}</Text>
            </div>
          </Section>

          {/* Pending Services */}
          {serviciosPendientes.length > 0 && (
            <Section style={section}>
              <Heading style={h2}>Servicios Pendientes:</Heading>
              <ul style={{ ...text, paddingLeft: "20px" }}>
                {serviciosPendientes.map((servicio, index) => (
                  <li key={index} style={{ marginBottom: "5px" }}>
                    {servicio}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Due Date */}
          {fechaVencimiento && (
            <Section style={section}>
              <Text style={{ ...text, fontWeight: "600" }}>Fecha límite de pago: {fechaVencimiento}</Text>
            </Section>
          )}

          {/* Contact Info */}
          <Section style={section}>
            <Text style={text}>Para coordinar el pago o resolver cualquier consulta, contáctenos:</Text>
            <Text style={{ ...text, marginTop: "10px" }}>
              📞 {empresaTelefono}
              <br />📧 {empresaEmail}
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>Gracias por su atención. Esperamos su pronta respuesta.</Text>
            <Text style={footerTextSmall}>{empresaNombre} - Sistema Automatizado de Cobranza</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
