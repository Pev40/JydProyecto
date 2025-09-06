// Script para ejecutar la migración 17: Agregar FechaActualizacion a Cliente
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

async function ejecutarMigracion17() {
  try {
    console.log('🔄 Iniciando migración 17: Agregar FechaActualizacion a Cliente...')
    
    // Leer el archivo de migración
    const migracionPath = path.join(__dirname, '17-add-fechaactualizacion-cliente.sql')
    const migracionSQL = fs.readFileSync(migracionPath, 'utf8')

    console.log('📄 Ejecutando script de migración...')
    
    // Ejecutar la migración
    await sql.unsafe(migracionSQL)
    
    console.log('✅ Migración ejecutada exitosamente')
    
    // Verificar que la columna fue agregada
    console.log('🔍 Verificando que la columna FechaActualizacion fue agregada...')
    
    const verificacion = await sql`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'Cliente'
      AND column_name = 'FechaActualizacion'
      AND table_schema = 'public'
    `
    
    if (verificacion.length > 0) {
      console.log('✅ Columna FechaActualizacion agregada correctamente:')
      console.log(`  - ${verificacion[0].column_name} (${verificacion[0].data_type}) ${verificacion[0].is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`)
      console.log(`  - Default: ${verificacion[0].column_default}`)
    } else {
      console.log('❌ La columna FechaActualizacion no fue encontrada')
    }
    
    // Verificar el trigger
    console.log('🔍 Verificando trigger...')
    const trigger = await sql`
      SELECT trigger_name, event_manipulation, action_timing
      FROM information_schema.triggers
      WHERE event_object_table = 'Cliente'
      AND trigger_name = 'trigger_update_cliente_fecha_actualizacion'
    `
    
    if (trigger.length > 0) {
      console.log('✅ Trigger creado correctamente:')
      console.log(`  - ${trigger[0].trigger_name} (${trigger[0].action_timing} ${trigger[0].event_manipulation})`)
    } else {
      console.log('❌ El trigger no fue encontrado')
    }
    
    console.log('\n🎉 Migración 17 completada exitosamente')
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error)
    process.exit(1)
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  ejecutarMigracion17()
}

module.exports = { ejecutarMigracion17 }
