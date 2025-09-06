import { type NextRequest, NextResponse } from "next/server"
import {
  calcularClasificacionAutomatica,
  aplicarCambiosClasificacion,
  obtenerHistorialClasificaciones,
} from "@/lib/clasificacion-automatica"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const accion = searchParams.get("accion")
    const clienteId = searchParams.get("cliente_id")

    if (accion === "historial") {
      const historial = await obtenerHistorialClasificaciones(clienteId ? Number.parseInt(clienteId) : undefined)
      return NextResponse.json({ historial })
    }

    // Por defecto, calcular clasificaciones
    const clasificaciones = await calcularClasificacionAutomatica()

    const resumen = {
      total_clientes: clasificaciones.length,
      requieren_cambio: clasificaciones.filter((c) => c.requiere_cambio).length,
      por_clasificacion: {
        A: clasificaciones.filter((c) => c.nueva_clasificacion === "A").length,
        B: clasificaciones.filter((c) => c.nueva_clasificacion === "B").length,
        C: clasificaciones.filter((c) => c.nueva_clasificacion === "C").length,
      },
      cambios_pendientes: {
        A_to_B: clasificaciones.filter((c) => c.clasificacion_actual === "A" && c.nueva_clasificacion === "B").length,
        A_to_C: clasificaciones.filter((c) => c.clasificacion_actual === "A" && c.nueva_clasificacion === "C").length,
        B_to_A: clasificaciones.filter((c) => c.clasificacion_actual === "B" && c.nueva_clasificacion === "A").length,
        B_to_C: clasificaciones.filter((c) => c.clasificacion_actual === "B" && c.nueva_clasificacion === "C").length,
        C_to_A: clasificaciones.filter((c) => c.clasificacion_actual === "C" && c.nueva_clasificacion === "A").length,
        C_to_B: clasificaciones.filter((c) => c.clasificacion_actual === "C" && c.nueva_clasificacion === "B").length,
      },
    }

    return NextResponse.json({
      clasificaciones,
      resumen,
    })
  } catch (error) {
    console.error("Error al obtener clasificaciones:", error)
    return NextResponse.json({ error: "Error al obtener clasificaciones automáticas" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accion, cliente_ids } = body

    if (accion === "aplicar_cambios") {
      // Calcular clasificaciones
      const todasLasClasificaciones = await calcularClasificacionAutomatica()

      // Filtrar solo los clientes especificados (si se proporcionaron)
      let clasificacionesAAplicar = todasLasClasificaciones

      if (cliente_ids && Array.isArray(cliente_ids)) {
        clasificacionesAAplicar = todasLasClasificaciones.filter((c) => cliente_ids.includes(c.id) && c.requiere_cambio)
      } else {
        // Si no se especifican IDs, aplicar a todos los que requieren cambio
        clasificacionesAAplicar = todasLasClasificaciones.filter((c) => c.requiere_cambio)
      }

      if (clasificacionesAAplicar.length === 0) {
        return NextResponse.json({
          message: "No hay cambios de clasificación para aplicar",
          cambios_aplicados: 0,
        })
      }

      // Aplicar los cambios
      await aplicarCambiosClasificacion(clasificacionesAAplicar)

      // Preparar resumen de cambios aplicados
      const cambiosAplicados = clasificacionesAAplicar.map((c) => ({
        cliente_id: c.id,
        cliente_nombre: c.nombre,
        clasificacion_anterior: c.clasificacion_actual,
        clasificacion_nueva: c.nueva_clasificacion,
        meses_deuda: c.meses_deuda,
      }))

      return NextResponse.json({
        message: `Se aplicaron ${clasificacionesAAplicar.length} cambios de clasificación`,
        cambios_aplicados: clasificacionesAAplicar.length,
        detalles: cambiosAplicados,
      })
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
  } catch (error) {
    console.error("Error al aplicar clasificaciones:", error)
    return NextResponse.json({ error: "Error al aplicar clasificaciones automáticas" }, { status: 500 })
  }
}
