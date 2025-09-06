require('dotenv').config()
const { neon } = require('@neondatabase/serverless')
const fs = require('fs')
const path = require('path')

const sql = neon(process.env.DATABASE_URL)

async function ejecutarMigracion19() {
  try {
    console.log('🚀 Iniciando migración 19: Corregir vista VistaReporteCajaVariable...')
    
    // Leer el archivo SQL
    const sqlContent = fs.readFileSync(
      path.join(__dirname, '19-corregir-vista-caja-variable.sql'), 
      'utf8'
    )
    
    // Ejecutar la migración
    console.log('📄 Ejecutando script SQL...')
    await sql.unsafe(sqlContent)
    
    console.log('✅ Migración ejecutada exitosamente')
    
    // Verificar que la vista se creó correctamente
    console.log('🔍 Verificando la vista...')
    
    // Verificar estructura de la vista
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'VistaReporteCajaVariable' 
      ORDER BY ordinal_position
    `
    
    console.log('📋 Columnas de la vista VistaReporteCajaVariable:')
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`)
    })
    
    // Probar la vista con una consulta básica
    try {
      const test = await sql`SELECT COUNT(*) as total FROM "VistaReporteCajaVariable"`
      console.log(`✅ Vista funciona correctamente: ${test[0].total} registros`)
      
      // Probar las columnas específicas que necesita el API
      const testColumns = await sql`
        SELECT "Mes", "Año", "NombreMes", "Cliente", "MontoDevengado", "MontoPagado", "SaldoPendiente"
        FROM "VistaReporteCajaVariable" 
        LIMIT 1
      `
      
      if (testColumns.length > 0) {
        console.log('✅ Todas las columnas necesarias están disponibles')
        console.log('📊 Muestra de datos:', testColumns[0])
      } else {
        console.log('⚠️  No hay datos en la vista, pero la estructura es correcta')
      }
      
    } catch (error) {
      console.error('❌ Error al probar la vista:', error.message)
    }
    
    // Verificar que existen algunos pagos para mostrar
    const pagosCount = await sql`SELECT COUNT(*) as total FROM "Pago"`
    console.log(`📊 Total de pagos en la BD: ${pagosCount[0].total}`)
    
    const clientesCount = await sql`SELECT COUNT(*) as total FROM "Cliente"`
    console.log(`👥 Total de clientes en la BD: ${clientesCount[0].total}`)
    
  } catch (error) {
    console.error('❌ Error ejecutando migración 19:', error)
    console.error('Detalles:', error.message)
    
    if (error.message.includes('does not exist')) {
      console.log('💡 Sugerencia: Puede que falten tablas. Ejecutar primero las migraciones anteriores.')
    }
  }
}

// Ejecutar la migración
ejecutarMigracion19()
  .then(() => {
    console.log('🎉 Migración 19 completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })
