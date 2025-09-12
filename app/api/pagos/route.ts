import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"
import { ReciboService } from "@/lib/recibo-service"
import { ClasificacionAutomatica } from "@/lib/clasificacion-automatica"

export async function POST(request: NextRequest) {
  if (!sql) {
    return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })
  }

  try {
    const body = await request.json()
    const {
      idCliente,
      monto,
      concepto,
      medioPago,
      idBanco,
      mesServicio,
      observaciones,
      urlComprobante,
      estado = "PENDIENTE",
      mesesServicios = [], // Array de meses/servicios que se están pagando
    } = body

    console.log("📝 Registrando nuevo pago:", { idCliente, monto, concepto, medioPago })

    // Validaciones básicas
    if (!idCliente || !monto || !concepto || !medioPago) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Verificar que el cliente existe
    const cliente = await sql`
      SELECT 
        "IdCliente", 
        "RazonSocial", 
        "Email",
        "MontoFijoMensual",
        "UltimoDigitoRUC"
      FROM "Cliente" 
      WHERE "IdCliente" = ${idCliente}
    `

    if (cliente.length === 0) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    const clienteData = cliente[0]

    // Determinar estado final (si hay comprobante, confirmar automáticamente)
    const estadoFinal = urlComprobante ? "CONFIRMADO" : estado

    // Insertar el pago principal
    const nuevoPago = await sql`
      INSERT INTO "Pago" (
        "IdCliente",
        "Monto",
        "Concepto",
        "MedioPago",
        "IdBanco",
        "MesServicio",
        "UrlComprobante",
        "Estado"
      ) VALUES (
        ${idCliente},
        ${monto},
        ${concepto},
        ${medioPago},
        ${idBanco || null},
        ${mesServicio || new Date().toISOString().split('T')[0]},
        ${urlComprobante || null},
        ${estadoFinal}
      ) RETURNING *
    `

    const pagoId = nuevoPago[0].IdPago
    console.log(`✅ Pago registrado con ID: ${pagoId}`)

    // Registrar detalle de servicios pagados (solo si se proporcionan y la estructura es compatible)
    if (mesesServicios && mesesServicios.length > 0) {
      try {
        const cols = await sql`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'DetallePagoServicio' AND column_name = 'TipoServicio'
          ) as has_tipo
        `

        type ColsRow = { has_tipo: boolean }
        if ((cols as ColsRow[])[0]?.has_tipo) {
          for (const mesServicio of mesesServicios) {
            await sql`
              INSERT INTO "DetallePagoServicio" (
                "IdPago",
                "TipoServicio",
                "Descripcion",
                "Monto",
                "PeriodoServicio"
              ) VALUES (
                ${pagoId},
                'FIJO',
                ${mesServicio.servicio || "Servicio mensual"},
                ${mesServicio.monto},
                ${mesServicio.mes}
              )
            `
          }
          console.log(`📋 Registrados ${mesesServicios.length} servicios en el detalle del pago`)
        } else {
          console.log("ℹ️ Estructura DetallePagoServicio incompleta, se omite detalle")
        }
      } catch (error) {
        console.log("ℹ️ No se pudo registrar detalle de servicios; pago principal OK")
        // No fallar el pago por errores en detalles de servicio
      }
    }

    // Marcar servicios adicionales como pagados si corresponde (solo si las tablas existen)
    try {
      await procesarServiciosAdicionales(pagoId, idCliente, Number.parseFloat(monto), clienteData.MontoFijoMensual)
    } catch (error) {
      console.error("⚠️ Error procesando servicios adicionales (no crítico):", error)
      // No fallar el pago por errores en servicios adicionales
    }

    // Si el pago está confirmado, ejecutar procesos automáticos
    if (estadoFinal === "CONFIRMADO") {
      console.log("🤖 Ejecutando procesos automáticos para pago confirmado...")

      try {
        // 1. Enviar recibo automáticamente (si el servicio está disponible)
        try {
          const resultadoRecibo = await ReciboService.enviarReciboAutomatico({
            pagoId,
            clienteId: idCliente,
            monto: Number.parseFloat(monto),
            concepto,
            metodoPago: medioPago,
            observaciones,
          })

          if (resultadoRecibo.success) {
            console.log(`📧 Recibo ${resultadoRecibo.numeroRecibo} enviado exitosamente`)
          } else {
            console.error(`❌ Error enviando recibo: ${resultadoRecibo.error}`)
          }
        } catch (error) {
          console.error("⚠️ Servicio de recibos no disponible:", error)
        }

        // 2. Ejecutar clasificación automática para este cliente (si está disponible)
        try {
          const clasificaciones = await ClasificacionAutomatica.ejecutarClasificacionAutomatica()
          const clienteClasificacion = clasificaciones.find((c) => c.IdCliente === idCliente)

          if (clienteClasificacion && clienteClasificacion.RequiereCambio) {
            await ClasificacionAutomatica.aplicarCambiosClasificacion([clienteClasificacion])
            console.log(
              `🔄 Clasificación actualizada: ${clienteClasificacion.ClasificacionActual} → ${clienteClasificacion.NuevaClasificacion}`,
            )
          }
        } catch (error) {
          console.error("⚠️ Servicio de clasificación automática no disponible:", error)
        }
      } catch (error) {
        console.error("❌ Error en procesos automáticos:", error)
        // No fallar la creación del pago por errores en procesos automáticos
      }
    }

    return NextResponse.json({
      success: true,
      message: "Pago registrado exitosamente",
      pago: nuevoPago[0],
    })
  } catch (error) {
    console.error("❌ Error al crear pago:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al crear pago",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  if (!sql) {
    return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get("cliente_id")
    const estado = searchParams.get("estado")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    const whereConditions = []
    const queryParams: string[] = []

    if (clienteId) {
      whereConditions.push(`p."IdCliente" = ${clienteId}`)
    }

    if (estado) {
      whereConditions.push(`p."Estado" = '${estado}'`)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    // Consulta principal con información completa
    const queryPagos = `
      SELECT 
        p.*,
        c."RazonSocial" as "ClienteRazonSocial",
        c."RucDni" as "ClienteRucDni",
        c."Email" as "ClienteEmail",
        b."Nombre" as "BancoNombre",
        -- Servicios incluidos en este pago
        COALESCE(
          JSON_AGG(
            CASE WHEN dps."IdDetallePagoServicio" IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'tipo', dps."TipoServicio",
                'descripcion', dps."Descripcion",
                'monto', dps."Monto",
                'periodo', dps."PeriodoServicio"
              )
            END
          ) FILTER (WHERE dps."IdDetallePagoServicio" IS NOT NULL),
          '[]'::json
        ) as "ServiciosIncluidos"
      FROM "Pago" p
      JOIN "Cliente" c ON p."IdCliente" = c."IdCliente"
      LEFT JOIN "Banco" b ON p."IdBanco" = b."IdBanco"
      LEFT JOIN "DetallePagoServicio" dps ON p."IdPago" = dps."IdPago"
      ${whereClause}
      GROUP BY p."IdPago", c."RazonSocial", c."RucDni", c."Email", b."Nombre"
      ORDER BY p."Fecha" DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const pagos = await sql.unsafe(queryPagos)

    // Consulta para el total
    const queryTotal = `
      SELECT COUNT(DISTINCT p."IdPago") as total
      FROM "Pago" p
      JOIN "Cliente" c ON p."IdCliente" = c."IdCliente"
      ${whereClause}
    `

    const totalResult = await sql.unsafe(queryTotal)
    const total = Number.parseInt((totalResult as unknown as { total: string }[])[0].total)

    return NextResponse.json({
      success: true,
      pagos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error("❌ Error al obtener pagos:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener pagos",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  if (!sql) {
    return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })
  }

  try {
    const body = await request.json()
    const { id, estado } = body

    if (!id) {
      return NextResponse.json({ error: "ID del pago requerido" }, { status: 400 })
    }

    console.log(`🔄 Actualizando pago ${id} a estado: ${estado}`)

    // Obtener datos del pago actual
    const pagoActual = await sql`
      SELECT 
        p.*,
        c."RazonSocial",
        c."Email",
        c."MontoFijoMensual"
      FROM "Pago" p
      JOIN "Cliente" c ON p."IdCliente" = c."IdCliente"
      WHERE p."IdPago" = ${id}
    `

    if (pagoActual.length === 0) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 })
    }

    const pago = pagoActual[0]

    // Actualizar el pago
    const pagoActualizado = await sql`
      UPDATE "Pago" 
      SET 
        "Estado" = ${estado || pago.Estado}
      WHERE "IdPago" = ${id}
      RETURNING *
    `

    // Si se confirma el pago por primera vez, ejecutar procesos automáticos
    if (estado === "CONFIRMADO" && pago.Estado !== "CONFIRMADO") {
      console.log("🤖 Ejecutando procesos automáticos para confirmación de pago...")

      try {
        // 1. Enviar recibo automáticamente
        const resultadoRecibo = await ReciboService.enviarReciboAutomatico({
          pagoId: id,
          clienteId: pago.IdCliente,
          monto: Number.parseFloat(pago.Monto),
          concepto: pago.Concepto,
          metodoPago: pago.MedioPago,
          observaciones: undefined,
        })

        if (resultadoRecibo.success) {
          console.log(`📧 Recibo ${resultadoRecibo.numeroRecibo} enviado exitosamente`)
        }

        // 2. Ejecutar clasificación automática
        const clasificaciones = await ClasificacionAutomatica.ejecutarClasificacionAutomatica()
        const clienteClasificacion = clasificaciones.find((c) => c.IdCliente === pago.IdCliente)

        if (clienteClasificacion && clienteClasificacion.RequiereCambio) {
          await ClasificacionAutomatica.aplicarCambiosClasificacion([clienteClasificacion])
          console.log(
            `🔄 Clasificación actualizada: ${clienteClasificacion.ClasificacionActual} → ${clienteClasificacion.NuevaClasificacion}`,
          )
        }
      } catch (error) {
        console.error("❌ Error en procesos automáticos:", error)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Pago actualizado exitosamente",
      pago: pagoActualizado[0],
    })
  } catch (error) {
    console.error("❌ Error al actualizar pago:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al actualizar pago",
      },
      { status: 500 },
    )
  }
}

/**
 * Procesa servicios adicionales que pueden ser cubiertos por el pago
 */
async function procesarServiciosAdicionales(
  pagoId: number,
  clienteId: number,
  montoPago: number,
  montoFijoMensual: number,
) {
  if (!sql) {
    console.log("⚠️ Base de datos no disponible")
    return
  }

  try {
    // Verificar si las tablas necesarias existen
    const tablesExist = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ServicioAdicional'
      ) as servicio_adicional_exists,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'DetallePagoServicio'
      ) as detalle_pago_exists
    `

    if (!tablesExist[0].servicio_adicional_exists || !tablesExist[0].detalle_pago_exists) {
      console.log("⚠️ Tablas de servicios adicionales no encontradas, omitiendo procesamiento")
      return
    }

    // Calcular monto disponible para servicios adicionales
    const mesesCubiertos = montoFijoMensual > 0 ? Math.floor(montoPago / montoFijoMensual) : 0
    const montoUsadoFijo = mesesCubiertos * montoFijoMensual
    const montoDisponibleAdicionales = montoPago - montoUsadoFijo

    if (montoDisponibleAdicionales <= 0) {
      console.log("💰 No hay monto disponible para servicios adicionales")
      return
    }

    // Obtener servicios adicionales pendientes de pago
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
          FROM "DetallePagoServicio" 
          WHERE "IdServicioAdicional" IS NOT NULL
        )
      ORDER BY "Fecha" ASC
    `

    if (serviciosAdicionales.length === 0) {
      console.log("📋 No hay servicios adicionales pendientes para este cliente")
      return
    }

    let montoRestante = montoDisponibleAdicionales

    // Asignar servicios adicionales al pago
    for (const servicio of serviciosAdicionales) {
      if (montoRestante >= Number(servicio.Monto)) {
        // Registrar que este servicio adicional fue pagado
        await sql`
          INSERT INTO "DetallePagoServicio" (
            "IdPago", 
            "IdServicioAdicional", 
            "TipoServicio",
            "Descripcion",
            "Monto"
          ) VALUES (
            ${pagoId},
            ${servicio.IdServicioAdicional},
            'ADICIONAL',
            ${servicio.NombreServicio + " - " + servicio.Descripcion},
            ${servicio.Monto}
          )
        `

        // Marcar servicio como pagado
        await sql`
          UPDATE "ServicioAdicional"
          SET "Estado" = 'PAGADO'
          WHERE "IdServicioAdicional" = ${servicio.IdServicioAdicional}
        `

        montoRestante -= Number(servicio.Monto)
        console.log(`💰 Servicio adicional pagado: ${servicio.NombreServicio} - S/ ${servicio.Monto}`)
      }
    }
  } catch (error) {
    console.error("❌ Error procesando servicios adicionales:", error)
    throw error // Permitir que se maneje en el nivel superior
  }
}
