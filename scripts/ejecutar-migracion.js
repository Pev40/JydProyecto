// Script para ejecutar la migración de estructura de pagos
// Carga .env y se conecta directamente con Neon

require('dotenv').config()
const { neon } = require('@neondatabase/serverless')
const fs = require('fs')
const path = require('path')

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('❌ DATABASE_URL no está configurada en .env')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function ejecutarMigracion() {
  try {
    console.log('🔄 Iniciando migración de estructura de pagos...')
    
    // Leer el archivo de migración
    const migracionPath = path.join(__dirname, '14-migrar-estructura-pagos.sql')
    const migracionSQL = fs.readFileSync(migracionPath, 'utf8')

    console.log('📄 Ejecutando script de migración...')
    
    // Ejecutar la migración
    await sql.unsafe(migracionSQL)
    
    console.log('✅ Migración ejecutada exitosamente')
    
    // Verificar las tablas creadas
    console.log('🔍 Verificando estructura de tablas...')
    
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
    
    console.log('📋 Estructura de tablas:')
    let currentTable = ''
    for (const col of verificacion) {
      if (col.table_name !== currentTable) {
        console.log(`\n📊 Tabla: ${col.table_name}`)
        currentTable = col.table_name
      }
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`)
    }
    
    console.log('\n🎉 Migración completada exitosamente')
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error)
    process.exit(1)
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  ejecutarMigracion()
}

module.exports = { ejecutarMigracion }
