require('dotenv').config()
const { neon } = require('@neondatabase/serverless')

const sql = neon(process.env.DATABASE_URL)

async function verificarVistas() {
  try {
    console.log('🔍 Verificando vistas existentes...')
    
    const vistas = await sql`
      SELECT table_name, view_definition
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    
    console.log('📋 Vistas encontradas:')
    for (const vista of vistas) {
      console.log(`  - ${vista.table_name}`)
    }
    
    // Verificar específicamente las vistas que necesitamos
    const vistasEspecificas = await sql`
      SELECT table_name
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND (table_name ILIKE '%reportecaja%' OR table_name ILIKE '%vista%')
      ORDER BY table_name
    `
    
    console.log('\n📋 Vistas relacionadas con reportes:')
    for (const vista of vistasEspecificas) {
      console.log(`  - ${vista.table_name}`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

verificarVistas()
