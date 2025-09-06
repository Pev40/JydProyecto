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
    const { nombre, idClasificacion, contenido } = body

    // Validar campos requeridos
    if (!nombre || !idClasificacion || !contenido) {
      return NextResponse.json(
        { success: false, error: "Nombre, clasificación y contenido son requeridos" },
        { status: 400 },
      )
    }

    // Verificar si ya existe una plantilla para esta clasificación
    const plantillaExistente = await sql`
      SELECT "IdPlantillaMensaje"
      FROM "PlantillaMensaje"
      WHERE "IdClasificacion" = ${idClasificacion}
    `

    if (plantillaExistente.length > 0) {
      return NextResponse.json(
        { success: false, error: "Ya existe una plantilla para esta clasificación" },
        { status: 400 },
      )
    }

    const result = await sql`
      INSERT INTO "PlantillaMensaje" (
        "IdClasificacion",
        "Nombre",
        "Contenido"
      ) VALUES (
        ${idClasificacion},
        ${nombre},
        ${contenido}
      ) RETURNING "IdPlantillaMensaje"
    `

    return NextResponse.json({
      success: true,
      plantillaId: result[0].IdPlantillaMensaje,
      message: "Plantilla creada correctamente",
    })
  } catch (error) {
    console.error("Error creating template:", error)
    return NextResponse.json({ success: false, error: "Error al crear la plantilla" }, { status: 500 })
  }
}

export async function GET() {
  if (!sql) {
    return NextResponse.json(
      { success: false, error: "Base de datos no configurada. Configure DATABASE_URL." },
      { status: 500 },
    )
  }

  try {
    const plantillas = await sql`
      SELECT 
        pm.*,
        cl."Codigo" as "ClasificacionCodigo",
        cl."Color" as "ClasificacionColor",
        cl."Descripcion" as "ClasificacionDescripcion"
      FROM "PlantillaMensaje" pm
      LEFT JOIN "Clasificacion" cl ON pm."IdClasificacion" = cl."IdClasificacion"
      ORDER BY cl."Codigo"
    `

    return NextResponse.json({
      success: true,
      plantillas,
    })
  } catch (error) {
    console.error("Error fetching templates:", error)
    return NextResponse.json({ success: false, error: "Error al obtener las plantillas" }, { status: 500 })
  }
}
