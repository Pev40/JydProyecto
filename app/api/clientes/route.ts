import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  if (!sql) {
    return NextResponse.json(
      { success: false, error: "Base de datos no configurada. Configure DATABASE_URL." },
      { status: 500 },
    )
  }

  try {
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

    const result = await sql`
      INSERT INTO "Cliente" (
        "RazonSocial", 
        "NombreContacto", 
        "RucDni", 
        "UltimoDigitoRUC",
        "IdClasificacion", 
        "IdCartera",
        "IdEncargado", 
        "IdServicio", 
        "MontoFijoMensual",
        "AplicaMontoFijo",
        "IdCategoriaEmpresa",
        "Email",
        "Telefono"
      ) VALUES (
        ${razonSocial},
        ${nombreContacto || null},
        ${rucDni},
        ${ultimoDigito},
        ${idClasificacion || 1},
        ${idCartera || null},
        ${idEncargado || null},
        ${idServicio || null},
        ${montoFijoMensual || 0},
        ${aplicaMontoFijo || false},
        ${idCategoriaEmpresa || null},
        ${email || null},
        ${telefono || null}
      ) RETURNING "IdCliente"
    `

    return NextResponse.json({
      success: true,
      clienteId: result[0].IdCliente,
    })
  } catch (error: unknown) {
    console.error("Error creating client:", error)

    // Definir interfaz para errores de base de datos
    interface DatabaseError {
      code?: string;
      constraint?: string;
      detail?: string;
    }

    const isDbError = (err: unknown): err is DatabaseError => {
      return typeof err === 'object' && err !== null;
    }

    // Manejar errores específicos de Neon DB
    if (isDbError(error) && error.code === '23505') {
      // Error de violación de restricción única
      if (error.constraint === 'Cliente_RucDni_key') {
        const detailMatch = error.detail?.match(/\(([^)]+)\)/);
        const rucDni = detailMatch?.[1] || 'proporcionado';
        return NextResponse.json({ 
          success: false, 
          error: `Ya existe un cliente registrado con el RUC/DNI: ${rucDni}` 
        }, { status: 409 })
      }
      
      return NextResponse.json({ 
        success: false, 
        error: "Ya existe un registro con esos datos" 
      }, { status: 409 })
    }

    // Manejar otros errores de validación
    if (isDbError(error) && error.code?.startsWith('23')) {
      return NextResponse.json({ 
        success: false, 
        error: "Error de validación en los datos proporcionados" 
      }, { status: 400 })
    }

    // Error genérico
    return NextResponse.json({ 
      success: false, 
      error: "Error interno del servidor al crear el cliente" 
    }, { status: 500 })
  }
}
