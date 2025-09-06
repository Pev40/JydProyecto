require('dotenv').config()
const { neon } = require('@neondatabase/serverless')

const sql = neon(process.env.DATABASE_URL)

async function probarVistaDesdeApp() {
  try {
    console.log('🔍 Probando la vista desde la misma conexión que usa la app...')
    
    // Usar la misma consulta que está fallando en el API
    const query = `
      SELECT 
        "Mes",
        "Año",
        "NombreMes",
        "Cliente",
        "Fecha",
        "DetalleServicio",
        "NumeroRecibo",
        "Medio",
        "Banco",
        "MontoDevengado",
        "MontoPagado",
        "SaldoPendiente",
        "Observaciones",
        "MontoOriginal",
        "Estado"
      FROM VistaReporteCajaVariable
      WHERE "Año" = $1
    `

    console.log('📄 Ejecutando consulta exacta del API...')
    
    const result = await sql.query(query, [2025])
    
    console.log('✅ Consulta exitosa!')
    console.log(`📊 Resultados: ${result.length} registros`)
    
    if (result.length > 0) {
      console.log('📋 Primer registro:')
      console.log(result[0])
    } else {
      console.log('⚠️  No hay datos para el año 2025')
      
      // Buscar datos en otros años
      const allData = await sql`SELECT "Año", COUNT(*) as total FROM VistaReporteCajaVariable GROUP BY "Año" ORDER BY "Año"`
      console.log('📊 Datos por año:')
      allData.forEach(row => {
        console.log(`  - Año ${row.Año}: ${row.total} registros`)
      })
    }
    
    // Probar sin comillas en el nombre de la vista
    console.log('\n🔍 Probando sin comillas...')
    try {
      const resultSinComillas = await sql`SELECT COUNT(*) FROM VistaReporteCajaVariable`
      console.log(`✅ Sin comillas funciona: ${resultSinComillas[0].count} registros`)
    } catch (error) {
      console.log('❌ Sin comillas falla:', error.message)
    }
    
    // Probar con comillas dobles
    console.log('\n🔍 Probando con comillas dobles...')
    try {
      const resultConComillas = await sql`SELECT COUNT(*) FROM "VistaReporteCajaVariable"`
      console.log(`✅ Con comillas funciona: ${resultConComillas[0].count} registros`)
    } catch (error) {
      console.log('❌ Con comillas falla:', error.message)
    }
    
  } catch (error) {
    console.error('❌ Error probando vista:', error)
    console.error('Código de error:', error.code)
    console.error('Mensaje:', error.message)
    
    // Si falla, listar todas las vistas disponibles
    console.log('\n📋 Listando vistas disponibles...')
    try {
      const vistas = await sql`
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
        ORDER BY viewname
      `
      
      console.log('Vistas encontradas:')
      vistas.forEach(vista => {
        console.log(`  - ${vista.schemaname}.${vista.viewname}`)
      })
      
      // Intentar listar con information_schema
      const vistas2 = await sql`
        SELECT table_name 
        FROM information_schema.views 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `
      
      console.log('\nVistas (information_schema):')
      vistas2.forEach(vista => {
        console.log(`  - ${vista.table_name}`)
      })
      
    } catch (error2) {
      console.error('❌ Error listando vistas:', error2.message)
    }
  }
}

probarVistaDesdeApp()
  .then(() => {
    console.log('\n🎉 Prueba completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })
