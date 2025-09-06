import { decolectaService } from "@/lib/decolecta-service"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ruc = searchParams.get("numero")

    if (!ruc) {
      return NextResponse.json({ success: false, error: "Número de RUC es requerido" }, { status: 400 })
    }

    if (ruc.length !== 11) {
      return NextResponse.json({ success: false, error: "El RUC debe tener 11 dígitos" }, { status: 400 })
    }

    const data = await decolectaService.consultarRuc(ruc)
    //console.log("Respuesta de Decolecta:", data)
    if (!data) {
      return NextResponse.json(
        { success: false, error: "No se pudo consultar el RUC. Verifique el número o intente más tarde." },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        razonSocial: data.razon_social,
        ruc: data.numero_documento,
        direccion: data.direccion,
        distrito: data.distrito,
        provincia: data.provincia,
        departamento: data.departamento,
        estado: data.estado,
        condicion: data.condicion,
        ubigeo: data.ubigeo,
        viaTipo: data.via_tipo,
        viaNombre: data.via_nombre,
        zonaCodigo: data.zona_codigo,
        zonaTipo: data.zona_tipo,
        numero: data.numero,
        interior: data.interior,
        lote: data.lote,
        dpto: data.dpto,
        manzana: data.manzana,
        kilometro: data.kilometro,
        esAgenteRetencion: data.es_agente_retencion,
        esBuenContribuyente: data.es_buen_contribuyente,
        localesAnexos: data.locales_anexos,
      },
    })
  } catch (error) {
    console.error("Error consulting RUC:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
