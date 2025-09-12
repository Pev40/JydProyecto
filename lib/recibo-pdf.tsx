import React from 'react'
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer'
import { renderToBuffer } from '@react-pdf/renderer'
import path from 'path'
import fs from 'fs'

interface ReciboData {
  Concepto?: string;
  Monto?: number | string;
  RazonSocial?: string;
  RucDni?: string;
  NumeroRecibo?: string;
  FechaEnvio?: string;
  Fecha?: string;
}

interface Servicio {
  nombre?: string;
  NombreServicio?: string;
  descripcion?: string;
  monto?: number | string;
  Monto?: number | string;
}

export async function renderReciboPdfBuffer(reciboData: ReciboData, servicios: Servicio[] = []) {
  if (!servicios || servicios.length === 0) {
    servicios = [
      {
        nombre: reciboData.Concepto || 'Servicio',
        monto: Number(reciboData.Monto) || 0,
        descripcion: reciboData.Concepto || '',
      },
    ]
  }

  const subtotal = servicios.reduce((s: number, it: Servicio) => s + Number(it.monto ?? it.Monto ?? 0), 0)

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
  } catch {
    logoDataUri = null
  }

  const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Helvetica' },
  })

  const Doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <View>
            <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#22325b', letterSpacing: 2 }}>RECIBO</Text>
            <Text style={{ fontSize: 10, marginTop: 8, fontWeight: 'bold' }}>Rojo Polo Paella Inc.</Text>
            <Text style={{ fontSize: 10 }}>Carretera Muelle 38</Text>
            <Text style={{ fontSize: 10 }}>37531 Ávila, Ávila</Text>
          </View>
          <View style={{ width: 80, height: 80, borderRadius: 40, overflow: 'hidden' }}>
            {/* @react-pdf/renderer Image component doesn't support alt prop */}
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            {logoDataUri ? <Image src={logoDataUri} style={{ width: 80, height: 80 }} /> : <View style={{ width: 80, height: 80, backgroundColor: '#ccc' }} />}
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 }}>
          <View>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#22325b' }}>A</Text>
            <Text style={{ fontSize: 10 }}>{reciboData.RazonSocial}</Text>
            <Text style={{ fontSize: 10 }}>{reciboData.RucDni}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#22325b' }}>ENVIAR A</Text>
            <Text style={{ fontSize: 10 }}>{reciboData.RazonSocial}</Text>
            <Text style={{ fontSize: 10 }}>{reciboData.RucDni}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#22325b' }}>N° DE RECIBO</Text>
            <Text style={{ fontSize: 10 }}>{reciboData.NumeroRecibo}</Text>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#22325b', marginTop: 8 }}>FECHA</Text>
            <Text style={{ fontSize: 10 }}>{new Date(reciboData.FechaEnvio || reciboData.Fecha || Date.now()).toLocaleDateString('es-PE')}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#d32f2f', marginBottom: 6, paddingBottom: 2 }}>
          <Text style={{ width: '10%', fontSize: 10, fontWeight: 'bold', color: '#22325b' }}>CANT.</Text>
          <Text style={{ width: '50%', fontSize: 10, fontWeight: 'bold', color: '#22325b' }}>DESCRIPCIÓN</Text>
          <Text style={{ width: '20%', fontSize: 10, fontWeight: 'bold', color: '#22325b', textAlign: 'right' }}>PRECIO UNITARIO</Text>
          <Text style={{ width: '20%', fontSize: 10, fontWeight: 'bold', color: '#22325b', textAlign: 'right' }}>IMPORTE</Text>
        </View>

        {servicios.map((it: Servicio, idx: number) => {
          const nombre = it.nombre || it.NombreServicio || it.descripcion || ''
          const monto = Number(it.monto ?? it.Monto ?? 0)
          return (
            <View key={idx} style={{ flexDirection: 'row', marginBottom: 2 }}>
              <Text style={{ width: '10%', fontSize: 10 }}>{idx + 1}</Text>
              <Text style={{ width: '50%', fontSize: 10 }}>{nombre}</Text>
              <Text style={{ width: '20%', fontSize: 10, textAlign: 'right' }}>{monto.toFixed(2)}</Text>
              <Text style={{ width: '20%', fontSize: 10, textAlign: 'right' }}>{monto.toFixed(2)}</Text>
            </View>
          )
        })}

        <View style={{ marginTop: 12, alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 10 }}>Subtotal</Text>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#22325b', marginTop: 4 }}>TOTAL S/ {subtotal.toFixed(2)}</Text>
        </View>

      </Page>
    </Document>
  )

  const buffer = await renderToBuffer(Doc as React.ReactElement)
  return buffer
}

export default renderReciboPdfBuffer
