import { type NextRequest, NextResponse } from "next/server"
import { sql, testConnection } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { mes, clientes } = await request.json()

    if (!sql || !(await testConnection())) {
      return NextResponse.json(
        {
          success: false,
          error: "Base de datos no disponible",
        },
        { status: 503 },
      )
    }

    if (!mes || !clientes || clientes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Datos inválidos",
        },
        { status: 400 },
      )
    }

    let pagosGenerados = 0
    let montoTotal = 0
    const errores = []

    // Generar pagos para cada cliente seleccionado
    for (const idCliente of clientes) {
      try {
        // Obtener datos del cliente
        const clienteData = await sql`
          SELECT "IdCliente", "RazonSocial", "MontoFijoMensual", "IdServicio"
          FROM "Cliente" 
          WHERE "IdCliente" = ${idCliente} AND "AplicaMontoFijo" = true
        `

        if (clienteData.length === 0) {
          errores.push(`Cliente ${idCliente} no encontrado o no aplica monto fijo`)
          continue
        }

        const cliente = clienteData[0]

        // Verificar que no exista ya un pago para este mes
        const pagoExistente = await sql`
          SELECT "IdPago" FROM "Pago" 
          WHERE "IdCliente" = ${idCliente} 
            AND DATE_TRUNC('month', "MesServicio") = ${mes + "-01"}::date
        `

        if (pagoExistente.length > 0) {
          errores.push(`Ya existe un pago para ${cliente.RazonSocial} en ${mes}`)
          continue
        }

        // Crear el pago automático
        const nuevoPago = await sql`
          INSERT INTO "Pago" (
            "IdCliente", 
            "Fecha", 
            "IdBanco", 
            "Monto", 
            "Concepto", 
            "MedioPago", 
            "MesServicio", 
            "Estado"
          )
          VALUES (
            ${idCliente},
            ${new Date().toISOString()},
            1,
            ${cliente.MontoFijoMensual},
            ${"Pago automático generado para " + mes},
            'AUTOMATICO',
            ${mes + "-01"}::date,
            'PENDIENTE'
          )
          RETURNING "IdPago", "Monto"
        `

        pagosGenerados++
        montoTotal += cliente.MontoFijoMensual
      } catch (error) {
        console.error(`Error generando pago para cliente ${idCliente}:`, error)
        errores.push(`Error generando pago para cliente ${idCliente}`)
      }
    }

    return NextResponse.json({
      success: true,
      pagosGenerados,
      montoTotal,
      errores: errores.length > 0 ? errores : null,
      mensaje: `Se generaron ${pagosGenerados} pagos automáticos por un total de S/ ${montoTotal.toFixed(2)}`,
    })
  } catch (error) {
    console.error("Error en generación automática:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
