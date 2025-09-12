import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { Page, Text, View, Document, StyleSheet, Image } from "@react-pdf/renderer"
import path from "path"
import fs from "fs"

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  if (!sql) {
    return NextResponse.json({ success: false, error: "DB no disponible" }, { status: 503 })
  }

  try {
    const id = Number.parseInt(params.id)
    if (Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 })
    }

    const data = await sql`
      SELECT 
        r."NumeroRecibo",
        r."FechaEnvio",
        r."IdPago",
        c."RazonSocial",
        c."RucDni",
        p."Monto",
        p."Concepto",
        p."MedioPago",
        p."Fecha"
      FROM "ReciboEnviado" r
      JOIN "Cliente" c ON r."IdCliente" = c."IdCliente"
      LEFT JOIN "Pago" p ON r."IdPago" = p."IdPago"
      WHERE r."IdReciboEnviado" = ${id}
    `

    if (data.length === 0) {
      return NextResponse.json({ success: false, error: "Recibo no encontrado" }, { status: 404 })
    }

    const r = data[0]

    // Servicios incluidos (puede ser JSONB o string)
    type Servicio = {
      nombre?: string
      NombreServicio?: string
      descripcion?: string
      monto?: number
      Monto?: number
      tipo?: string
    }
    let servicios: Servicio[] = []
    if (r.ServiciosIncluidos) {
      try {
        servicios = typeof r.ServiciosIncluidos === 'string' ? JSON.parse(r.ServiciosIncluidos) : r.ServiciosIncluidos
      } catch (e) {
        servicios = []
      }
    }

    // Fallback si no hay servicios: usar concepto y monto del pago
    if (!servicios || servicios.length === 0) {
      servicios = [
        {
          nombre: r.Concepto || 'Servicio',
          monto: Number(r.Monto) || 0,
          descripcion: r.Concepto || '',
          tipo: 'FIJO',
        },
      ]
    }

    const subtotal = servicios.reduce((s: number, it: unknown) => {
      const item = it as { monto?: number; Monto?: number }
      return s + Number(item.monto ?? item.Monto ?? 0)
    }, 0)

    // Logo path (public folder) -> leer y convertir a data URI para evitar fetch
    const candidate1 = path.join(process.cwd(), 'public', 'LOGOJYD.png')
    const candidate2 = path.join(process.cwd(), 'public', 'placeholder-logo.png')
    let logoDataUri: string | null = null
    try {
      let chosen: string | null = null
      if (fs.existsSync(candidate1)) chosen = candidate1
      else if (fs.existsSync(candidate2)) chosen = candidate2

      if (chosen) {
        const buf = fs.readFileSync(chosen)
        const mime = chosen.toLowerCase().endsWith('.svg') ? 'image/svg+xml' : 'image/png'
        logoDataUri = `data:${mime};base64,${buf.toString('base64')}`
      }
    } catch (e) {
      logoDataUri = null
    }

    const styles = StyleSheet.create({
      page: { padding: 32 },
      title: { fontSize: 22, marginBottom: 16 },
      row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
      label: { fontSize: 10, color: "#555" },
      value: { fontSize: 12 },
      total: { fontSize: 16, marginTop: 12, textAlign: "right" },
    })

    const Doc = (
      <Document>
        <Page size="A4" style={{ padding: 40, fontFamily: "Helvetica" }}>
          {/* Header */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <View>
              <Text style={{ fontSize: 36, fontWeight: "bold", color: "#22325b", letterSpacing: 2 }}>RECIBO</Text>
              <Text style={{ fontSize: 10, marginTop: 8, fontWeight: "bold" }}>Rojo Polo Paella Inc.</Text>
              <Text style={{ fontSize: 10 }}>Carretera Muelle 38</Text>
              <Text style={{ fontSize: 10 }}>37531 Ávila, Ávila</Text>
            </View>
            <View style={{ width: 200, height: 80, borderRadius: 40, overflow: 'hidden' }}>
              {logoDataUri ? (
                <Image src={logoDataUri} style={{ width: 200, height: 80 }} />
              ) : (
                <View style={{ width: 150, height: 80, backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12}}>LOGO</Text>
                </View>
              )}
            </View>
          </View>

          {/* Info Rows */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 18 }}>
            <View>
              <Text style={{ fontSize: 12, fontWeight: "bold", color: "#22325b" }}>A</Text>
              <Text style={{ fontSize: 10 }}>{r.RazonSocial}</Text>
              <Text style={{ fontSize: 10 }}>{r.RucDni}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 12, fontWeight: "bold", color: "#22325b" }}>ENVIAR A</Text>
              <Text style={{ fontSize: 10 }}>{r.RazonSocial}</Text>
              <Text style={{ fontSize: 10 }}>{r.RucDni}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 12, fontWeight: "bold", color: "#22325b" }}>N° DE RECIBO</Text>
              <Text style={{ fontSize: 10 }}>{r.NumeroRecibo}</Text>
              <Text style={{ fontSize: 12, fontWeight: "bold", color: "#22325b", marginTop: 8 }}>FECHA</Text>
              <Text style={{ fontSize: 10 }}>{new Date(r.FechaEnvio).toLocaleDateString("es-PE")}</Text>
            </View>
          </View>

          {/* Table Header */}
          <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#d32f2f", marginBottom: 6, paddingBottom: 2 }}>
            <Text style={{ width: "10%", fontSize: 10, fontWeight: "bold", color: "#22325b" }}>CANT.</Text>
            <Text style={{ width: "50%", fontSize: 10, fontWeight: "bold", color: "#22325b" }}>DESCRIPCIÓN</Text>
            <Text style={{ width: "20%", fontSize: 10, fontWeight: "bold", color: "#22325b", textAlign: "right" }}>PRECIO UNITARIO</Text>
            <Text style={{ width: "20%", fontSize: 10, fontWeight: "bold", color: "#22325b", textAlign: "right" }}>IMPORTE</Text>
          </View>
          {/* Table Rows from servicios */}
          {servicios.map((it: unknown, idx: number) => {
            const item = it as { nombre?: string; NombreServicio?: string; descripcion?: string; monto?: number; Monto?: number }
            const nombre = item.nombre || item.NombreServicio || item.descripcion || ''
            const monto = Number(item.monto ?? item.Monto ?? 0)
            return (
              <View key={idx} style={{ flexDirection: "row", marginBottom: 2 }}>
                <Text style={{ width: "10%", fontSize: 10 }}>{idx + 1}</Text>
                <Text style={{ width: "50%", fontSize: 10 }}>{nombre}</Text>
                <Text style={{ width: "20%", fontSize: 10, textAlign: "right" }}>{monto.toFixed(2)}</Text>
                <Text style={{ width: "20%", fontSize: 10, textAlign: "right" }}>{monto.toFixed(2)}</Text>
              </View>
            )
          })}
          {/* Totals (IVA omitted) */}
          <View style={{ marginTop: 12, alignItems: "flex-end" }}>
            <Text style={{ fontSize: 10 }}>Subtotal</Text>
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#22325b", marginTop: 4 }}>
              TOTAL S/ {subtotal.toFixed(2)}
            </Text>
          </View>

          {/* Footer */}
          <View style={{ position: "absolute", bottom: 60, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
            <View>
              <Text style={{ fontSize: 12, color: "#d32f2f", fontWeight: "bold" }}>CONDICIONES Y FORMA DE PAGO</Text>
              <Text style={{ fontSize: 10, marginTop: 4 }}>El pago se realizará en un plazo de 15 días</Text>
              <Text style={{ fontSize: 10, marginTop: 4 }}>Banco BCP</Text>
              <Text style={{ fontSize: 10 }}>CCI: 12345678901234567890</Text>
              <Text style={{ fontSize: 10 }}>SWIFT/BIC: ABCDESM1XXX</Text>
            </View>
            <Text style={{ fontSize: 32, fontWeight: "bold", color: "#22325b", fontStyle: "italic", fontFamily: "Helvetica" }}>Gracias</Text>
          </View>
        </Page>
      </Document>
    )

    // Render a PDF buffer
    const { renderToBuffer } = await import("@react-pdf/renderer")
    const pdfBuffer = await renderToBuffer(Doc)
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=recibo_${r.NumeroRecibo}.pdf`,
      },
    })
  } catch (error) {
    console.error("Error en GET /api/recibos/:id/pdf:", error)
    return NextResponse.json({ success: false, error: "Error al generar PDF" }, { status: 500 })
  }
}

