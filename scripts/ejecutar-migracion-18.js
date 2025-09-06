// Script para ejecutar la migración 18: Crear vistas de reportes
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

async function ejecutarMigracion18() {
  try {
    console.log('🔄 Iniciando migración 18: Crear vistas de reportes...')
    
    // Leer el archivo de migración
    const migracionPath = path.join(__dirname, '18-crear-vistas-reportes.sql')
    const migracionSQL = fs.readFileSync(migracionPath, 'utf8')

    console.log('📄 Ejecutando script de migración...')
    
    // Ejecutar la migración
    await sql.unsafe(migracionSQL)
    
    console.log('✅ Migración ejecutada exitosamente')
    
    // Verificar que las vistas fueron creadas
    console.log('🔍 Verificando vistas creadas...')
    
    const vistas = await sql`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name IN ('VistaReporteCajaVariable', 'VistaReporteCajaFijaProyectado')
      ORDER BY table_name
    `
    
    if (vistas.length > 0) {
      console.log('✅ Vistas creadas correctamente:')
      for (const vista of vistas) {
        console.log(`  - ${vista.table_name}`)
      }
    } else {
      console.log('❌ No se encontraron las vistas esperadas')
    }
    
    // Verificar la función
    console.log('🔍 Verificando función...')
    const funciones = await sql`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name = 'obtenerreportecajafijaproyectado'
    `
    
    if (funciones.length > 0) {
      console.log('✅ Función creada correctamente:')
      console.log(`  - ${funciones[0].routine_name}`)
    } else {
      console.log('❌ La función no fue encontrada')
    }
    
    // Verificar tablas creadas
    console.log('🔍 Verificando tablas...')
    const tablas = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('ProyeccionesCajaFija', 'ConfiguracionReportes')
      ORDER BY table_name
    `
    
    if (tablas.length > 0) {
      console.log('✅ Tablas creadas correctamente:')
      for (const tabla of tablas) {
        console.log(`  - ${tabla.table_name}`)
      }
    }
    
    console.log('\n🎉 Migración 18 completada exitosamente')
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error)
    process.exit(1)
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  ejecutarMigracion18()
}

module.exports = { ejecutarMigracion18 }
