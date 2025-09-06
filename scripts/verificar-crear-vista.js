require('dotenv').config()
const { neon } = require('@neondatabase/serverless')

const sql = neon(process.env.DATABASE_URL)

async function verificarYCrearVista() {
  try {
    console.log('🔍 Verificando estado actual de la base de datos...')
    
    // Verificar vistas existentes
    const vistas = await sql`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    
    console.log('📋 Vistas existentes:')
    vistas.forEach(vista => {
      console.log(`  - ${vista.table_name}`)
    })
    
    // Verificar columnas de la tabla Pago
    console.log('\n📊 Verificando estructura de la tabla Pago...')
    const columnasPago = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'Pago' 
      ORDER BY ordinal_position
    `
    
    console.log('Columnas de la tabla Pago:')
    columnasPago.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable})`)
    })
    
    // Verificar si existe la tabla Banco
    const tablaBanco = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'Banco' AND table_schema = 'public'
    `
    
    if (tablaBanco.length === 0) {
      console.log('\n🏗️  Creando tabla Banco...')
      await sql`
        CREATE TABLE "Banco" (
          "IdBanco" SERIAL PRIMARY KEY,
          "Nombre" VARCHAR(100) NOT NULL,
          "Codigo" VARCHAR(10),
          "Activo" BOOLEAN DEFAULT true,
          "FechaCreacion" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
      
      await sql`
        INSERT INTO "Banco" ("Nombre", "Codigo") VALUES 
        ('YAPE', 'YAPE'),
        ('PLIN', 'PLIN'),
        ('BCP', 'BCP'),
        ('BBVA', 'BBVA'),
        ('INTERBANK', 'IBK')
      `
      console.log('✅ Tabla Banco creada')
    } else {
      console.log('✅ Tabla Banco ya existe')
    }
    
    // Agregar columnas faltantes a la tabla Pago si no existen
    console.log('\n🔧 Verificando y agregando columnas faltantes a la tabla Pago...')
    
    const columnasNecesarias = [
      { nombre: 'MontoPagado', tipo: 'DECIMAL(10,2)' },
      { nombre: 'SaldoPendiente', tipo: 'DECIMAL(10,2)' },
      { nombre: 'NumeroRecibo', tipo: 'VARCHAR(50)' },
      { nombre: 'DetalleServicio', tipo: 'TEXT' },
      { nombre: 'MedioPago', tipo: 'VARCHAR(50)' },
      { nombre: 'IdBanco', tipo: 'INTEGER' },
      { nombre: 'Observaciones', tipo: 'TEXT' }
    ]
    
    for (const columna of columnasNecesarias) {
      const existe = columnasPago.find(col => col.column_name === columna.nombre)
      if (!existe) {
        console.log(`  ➕ Agregando columna ${columna.nombre}...`)
        await sql.unsafe(`ALTER TABLE "Pago" ADD COLUMN "${columna.nombre}" ${columna.tipo}`)
      } else {
        console.log(`  ✅ Columna ${columna.nombre} ya existe`)
      }
    }
    
    // Crear la vista VistaReporteCajaVariable
    console.log('\n🏗️  Creando vista VistaReporteCajaVariable...')
    
    await sql`DROP VIEW IF EXISTS "VistaReporteCajaVariable"`
    
    await sql`
      CREATE VIEW "VistaReporteCajaVariable" AS
      SELECT 
          p."IdPago",
          EXTRACT(MONTH FROM p."Fecha")::INTEGER as "Mes",
          EXTRACT(YEAR FROM p."Fecha")::INTEGER as "Año",
          CASE EXTRACT(MONTH FROM p."Fecha")
              WHEN 1 THEN 'ENERO'
              WHEN 2 THEN 'FEBRERO' 
              WHEN 3 THEN 'MARZO'
              WHEN 4 THEN 'ABRIL'
              WHEN 5 THEN 'MAYO'
              WHEN 6 THEN 'JUNIO'
              WHEN 7 THEN 'JULIO'
              WHEN 8 THEN 'AGOSTO'
              WHEN 9 THEN 'SEPTIEMBRE'
              WHEN 10 THEN 'OCTUBRE'
              WHEN 11 THEN 'NOVIEMBRE'
              WHEN 12 THEN 'DICIEMBRE'
          END as "NombreMes",
          c."RazonSocial" as "Cliente",
          p."Fecha",
          COALESCE(p."DetalleServicio", p."Concepto", 'SERVICIO CONTABLE') as "DetalleServicio",
          COALESCE(p."NumeroRecibo", 'REC-' || LPAD(p."IdPago"::TEXT, 6, '0')) as "NumeroRecibo",
          COALESCE(p."MedioPago", 'EFECTIVO') as "Medio",
          COALESCE(b."Nombre", 'YAPE') as "Banco",
          p."Monto" as "MontoDevengado",
          COALESCE(p."MontoPagado", 
              CASE 
                  WHEN p."Estado" = 'COMPLETADO' THEN p."Monto"
                  WHEN p."Estado" = 'PARCIAL' THEN p."Monto" * 0.5
                  ELSE 0
              END
          ) as "MontoPagado",
          COALESCE(p."SaldoPendiente", 
              CASE 
                  WHEN p."Estado" = 'COMPLETADO' THEN 0
                  WHEN p."Estado" = 'PARCIAL' THEN p."Monto" * 0.5
                  ELSE p."Monto"
              END
          ) as "SaldoPendiente",
          COALESCE(p."Observaciones", '') as "Observaciones",
          p."Monto" as "MontoOriginal",
          p."Estado"
      FROM "Pago" p
      INNER JOIN "Cliente" c ON p."IdCliente" = c."IdCliente"
      LEFT JOIN "Banco" b ON p."IdBanco" = b."IdBanco"
      WHERE p."Estado" IN ('COMPLETADO', 'PENDIENTE', 'PARCIAL')
      ORDER BY p."Fecha" DESC, c."RazonSocial"
    `
    
    console.log('✅ Vista VistaReporteCajaVariable creada exitosamente')
    
    // Actualizar datos existentes
    console.log('\n🔄 Actualizando datos existentes...')
    
    await sql`
      UPDATE "Pago" SET 
          "MontoPagado" = CASE 
              WHEN "Estado" = 'COMPLETADO' THEN "Monto"
              WHEN "Estado" = 'PARCIAL' THEN "Monto" * 0.5
              ELSE 0
          END
      WHERE "MontoPagado" IS NULL
    `
    
    await sql`
      UPDATE "Pago" SET 
          "SaldoPendiente" = CASE 
              WHEN "Estado" = 'COMPLETADO' THEN 0
              WHEN "Estado" = 'PARCIAL' THEN "Monto" * 0.5
              ELSE "Monto"
          END
      WHERE "SaldoPendiente" IS NULL
    `
    
    await sql`
      UPDATE "Pago" SET 
          "NumeroRecibo" = 'REC-' || LPAD("IdPago"::TEXT, 6, '0')
      WHERE "NumeroRecibo" IS NULL
    `
    
    await sql`
      UPDATE "Pago" SET 
          "DetalleServicio" = "Concepto"
      WHERE "DetalleServicio" IS NULL
    `
    
    await sql`
      UPDATE "Pago" SET 
          "MedioPago" = 'EFECTIVO'
      WHERE "MedioPago" IS NULL
    `
    
    console.log('✅ Datos actualizados')
    
    // Probar la vista
    console.log('\n🧪 Probando la vista...')
    const test = await sql`SELECT COUNT(*) as total FROM "VistaReporteCajaVariable"`
    console.log(`✅ Vista funciona: ${test[0].total} registros`)
    
    if (test[0].total > 0) {
      const muestra = await sql`
        SELECT "Mes", "Año", "NombreMes", "Cliente", "MontoDevengado", "MontoPagado", "SaldoPendiente"
        FROM "VistaReporteCajaVariable" 
        LIMIT 3
      `
      
      console.log('📊 Muestra de datos:')
      muestra.forEach((row, i) => {
        console.log(`  ${i + 1}. ${row.Cliente} - ${row.NombreMes} ${row.Año} - Devengado: ${row.MontoDevengado}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
    console.error('Mensaje:', error.message)
  }
}

verificarYCrearVista()
  .then(() => {
    console.log('\n🎉 Proceso completado exitosamente')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })
