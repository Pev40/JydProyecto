import { decolectaService } from "@/lib/decolecta-service"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dni = searchParams.get("numero")

    if (!dni) {
      return NextResponse.json({ success: false, error: "Número de DNI es requerido" }, { status: 400 })
    }

    if (dni.length !== 8) {
      return NextResponse.json({ success: false, error: "El DNI debe tener 8 dígitos" }, { status: 400 })
    }

    const data = await decolectaService.consultarDni(dni)

    if (!data) {
      return NextResponse.json(
        { success: false, error: "No se pudo consultar el DNI. Verifique el número o intente más tarde." },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        nombres: data.first_name,
        apellidoPaterno: data.first_last_name,
        apellidoMaterno: data.second_last_name,
        dni: data.document_number,
        nombreCompleto: `${data.first_name} ${data.first_last_name} ${data.second_last_name}`.trim(),
      },
    })
  } catch (error) {
    console.error("Error consulting DNI:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
