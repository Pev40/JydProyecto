import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  if (!sql) {
    return NextResponse.json(
      { success: false, error: "Base de datos no configurada. Configure DATABASE_URL." },
      { status: 500 },
    )
  }

  try {
    const clienteId = Number.parseInt(params.id)
    if (isNaN(clienteId)) {
      return NextResponse.json({ success: false, error: "ID de cliente inválido" }, { status: 400 })
    }

    const body = await request.json()

    const {
      razonSocial,
      nombreContacto,
      rucDni,
      idClasificacion,
      idCartera,
      idEncargado,
      idServicio,
      montoFijoMensual,
      aplicaMontoFijo,
      idCategoriaEmpresa,
      email,
      telefono,
    } = body

    // Validar campos requeridos
    if (!razonSocial || !rucDni) {
      return NextResponse.json({ success: false, error: "Razón social y RUC/DNI son requeridos" }, { status: 400 })
    }

    // Calcular último dígito del RUC
    const ultimoDigito = Number.parseInt(rucDni.slice(-1))

    await sql`
      UPDATE "Cliente" SET
        "RazonSocial" = ${razonSocial},
        "NombreContacto" = ${nombreContacto || null},
        "RucDni" = ${rucDni},
        "UltimoDigitoRUC" = ${ultimoDigito},
        "IdClasificacion" = ${idClasificacion || null},
        "IdCartera" = ${idCartera || null},
        "IdEncargado" = ${idEncargado || null},
        "IdServicio" = ${idServicio || null},
        "MontoFijoMensual" = ${montoFijoMensual || 0},
        "AplicaMontoFijo" = ${aplicaMontoFijo || false},
        "IdCategoriaEmpresa" = ${idCategoriaEmpresa || null},
        "Email" = ${email || null},
        "Telefono" = ${telefono || null}
      WHERE "IdCliente" = ${clienteId}
    `

    return NextResponse.json({
      success: true,
      message: "Cliente actualizado correctamente",
    })
  } catch (error) {
    console.error("Error updating client:", error)

    // Manejar error de duplicado
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return NextResponse.json({ success: false, error: "Ya existe un cliente con ese RUC/DNI" }, { status: 400 })
    }

    return NextResponse.json({ success: false, error: "Error al actualizar el cliente" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  if (!sql) {
    return NextResponse.json(
      { error: "Base de datos no configurada. Configure DATABASE_URL." },
      { status: 500 },
    )
  }

  try {
    const clienteId = Number.parseInt(params.id)
    
    if (isNaN(clienteId)) {
      return NextResponse.json(
        { error: "ID de cliente inválido" },
        { status: 400 }
      )
    }

    const clientes = await sql`
      SELECT 
        "IdCliente",
        "RazonSocial",
        "RucDni",
        "Estado"
      FROM "Cliente"
      WHERE "IdCliente" = ${clienteId}
    `

    if (clientes.length === 0) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(clientes[0])
  } catch (error) {
    console.error("Error al obtener cliente:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
