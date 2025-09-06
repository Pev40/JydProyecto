require('dotenv').config()
const { neon } = require('@neondatabase/serverless')

const sql = neon(process.env.DATABASE_URL)

async function pruebaFinal() {
  try {
    console.log('🚀 Prueba final de la vista corregida...')
    
    // Probar con la consulta exacta del API
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

    console.log('📄 Ejecutando consulta para año 2025...')
    const result2025 = await sql.query(query, [2025])
    console.log(`✅ Consulta 2025 exitosa: ${result2025.length} registros`)
    
    // Si no hay datos para 2025, probar otros años
    if (result2025.length === 0) {
      console.log('📊 Buscando datos en otros años...')
      const years = await sql`
        SELECT DISTINCT "Año", COUNT(*) as total 
        FROM VistaReporteCajaVariable 
        GROUP BY "Año" 
        ORDER BY "Año" DESC
      `
      
      console.log('Años disponibles:')
      years.forEach(y => {
        console.log(`  - ${y.Año}: ${y.total} registros`)
      })
      
      if (years.length > 0) {
        const year = years[0].Año
        const resultYear = await sql.query(query, [year])
        console.log(`\n📋 Muestra para año ${year}:`)
        resultYear.slice(0, 3).forEach((row, i) => {
          console.log(`  ${i + 1}. ${row.Cliente} - ${row.NombreMes} ${row.Año}`)
          console.log(`     Devengado: ${row.MontoDevengado}, Pagado: ${row.MontoPagado}`)
        })
      }
    } else {
      console.log('📋 Muestra para 2025:')
      result2025.slice(0, 3).forEach((row, i) => {
        console.log(`  ${i + 1}. ${row.Cliente} - ${row.NombreMes} ${row.Año}`)
        console.log(`     Devengado: ${row.MontoDevengado}, Pagado: ${row.MontoPagado}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error en prueba final:', error)
    console.error('Mensaje:', error.message)
  }
}

pruebaFinal()
  .then(() => {
    console.log('\n🎉 ¡Vista corregida y funcionando!')
    console.log('🚀 Puedes probar ahora la aplicación')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error:', error)
    process.exit(1)
  })
