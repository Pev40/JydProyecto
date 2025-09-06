import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST() {
  if (!sql) {
    return NextResponse.json(
      { error: "Base de datos no disponible" },
      { status: 503 }
    )
  }

  try {
    console.log("🔄 Iniciando migración de estructura de pagos...")

    // Leer el archivo de migración
    const migracionPath = path.join(process.cwd(), "scripts", "14-migrar-estructura-pagos.sql")
    const migracionSQL = fs.readFileSync(migracionPath, "utf8")

    console.log("📄 Ejecutando script de migración...")

    // Ejecutar la migración
    await sql.unsafe(migracionSQL)

    console.log("✅ Migración ejecutada exitosamente")

    // Verificar las tablas creadas
    console.log("🔍 Verificando estructura de tablas...")

    const verificacion = await sql`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name IN ('Pago', 'DetallePagoServicio', 'ServicioAdicional')
      AND table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `

    // Organizar por tabla
    const tablas: Record<string, any[]> = {}
    for (const col of verificacion) {
      if (!tablas[col.table_name]) {
        tablas[col.table_name] = []
      }
      tablas[col.table_name].push({
        columna: col.column_name,
        tipo: col.data_type,
        nullable: col.is_nullable === "YES",
      })
    }

    console.log("🎉 Migración completada exitosamente")

    return NextResponse.json({
      success: true,
      message: "Migración ejecutada exitosamente",
      tablas,
    })
  } catch (error) {
    console.error("❌ Error durante la migración:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error durante la migración",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  if (!sql) {
    return NextResponse.json(
      { error: "Base de datos no disponible" },
      { status: 503 }
    )
  }

  try {
    // Solo verificar la estructura actual
    const verificacion = await sql`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name IN ('Pago', 'DetallePagoServicio', 'ServicioAdicional')
      AND table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `

    // Organizar por tabla
    const tablas: Record<string, any[]> = {}
    for (const col of verificacion) {
      if (!tablas[col.table_name]) {
        tablas[col.table_name] = []
      }
      tablas[col.table_name].push({
        columna: col.column_name,
        tipo: col.data_type,
        nullable: col.is_nullable === "YES",
      })
    }

    return NextResponse.json({
      success: true,
      message: "Estructura actual de tablas",
      tablas,
    })
  } catch (error) {
    console.error("❌ Error verificando estructura:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error verificando estructura",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    )
  }
}
