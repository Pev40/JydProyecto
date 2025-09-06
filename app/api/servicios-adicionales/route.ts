import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  if (!sql) {
    // Mock data para desarrollo
    return NextResponse.json({
      success: true,
      servicios: [
        {
          IdServicioAdicional: 1,
          IdCliente: 1,
          ClienteNombre: "EMPRESA DEMO SAC",
          NombreServicio: "Consultoría Tributaria",
          Descripcion: "Asesoría especializada en temas tributarios",
          Fecha: "2024-01-15",
          Monto: 500.0,
          Estado: "FACTURADO",
        },
        {
          IdServicioAdicional: 2,
          IdCliente: 2,
          ClienteNombre: "CONSULTORA ABC EIRL",
          NombreServicio: "Auditoría Interna",
          Descripcion: "Revisión de procesos contables internos",
          Fecha: "2024-01-20",
          Monto: 1200.0,
          Estado: "PENDIENTE",
        },
      ],
    })
  }

  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get("cliente")

    let query = `
      SELECT 
        sa.*,
        c."RazonSocial" as "ClienteNombre"
      FROM "ServicioAdicional" sa
      LEFT JOIN "Cliente" c ON sa."IdCliente" = c."IdCliente"
    `

    if (clienteId) {
      query += ` WHERE sa."IdCliente" = ${clienteId}`
    }

    query += ` ORDER BY sa."Fecha" DESC`

  const servicios = await sql.query(query)

    return NextResponse.json({
      success: true,
      servicios,
    })
  } catch (error) {
    console.error("Error fetching servicios adicionales:", error)
    return NextResponse.json({ success: false, error: "Error al obtener servicios adicionales" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!sql) {
    return NextResponse.json({ success: false, error: "Base de datos no configurada" }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { idCliente, nombreServicio, descripcion, monto, fecha } = body

    // Validar campos requeridos
    if (!idCliente || !nombreServicio || !monto || !fecha) {
      return NextResponse.json({ success: false, error: "Todos los campos son requeridos" }, { status: 400 })
    }

    // Insertar servicio adicional
    const result = await sql`
      INSERT INTO "ServicioAdicional" (
        "IdCliente",
        "NombreServicio",
        "Descripcion",
        "Fecha",
        "Monto",
        "Estado"
      ) VALUES (
        ${idCliente},
        ${nombreServicio},
        ${descripcion || null},
        ${fecha},
        ${monto},
        'PENDIENTE'
      ) RETURNING "IdServicioAdicional"
    `

    return NextResponse.json({
      success: true,
      servicioId: result[0].IdServicioAdicional,
      message: "Servicio adicional registrado correctamente",
    })
  } catch (error) {
    console.error("Error creating servicio adicional:", error)
    return NextResponse.json({ success: false, error: "Error al registrar servicio adicional" }, { status: 500 })
  }
}
