require('dotenv').config()
const { neon } = require('@neondatabase/serverless')

const sql = neon(process.env.DATABASE_URL)

async function verificarYCorregirVistas() {
  try {
    console.log('🔍 Verificando las dos vistas duplicadas...')
    
    // Verificar estructura de ambas vistas
    console.log('\n1️⃣ Verificando VistaReporteCajaVariable (mayúsculas)...')
    try {
      const columnas1 = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'VistaReporteCajaVariable' 
        ORDER BY ordinal_position
      `
      
      console.log('✅ Columnas de VistaReporteCajaVariable:')
      columnas1.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`)
      })
      
      const count1 = await sql`SELECT COUNT(*) as total FROM "VistaReporteCajaVariable"`
      console.log(`📊 Registros: ${count1[0].total}`)
      
    } catch (error) {
      console.log('❌ Error con VistaReporteCajaVariable:', error.message)
    }
    
    console.log('\n2️⃣ Verificando vistareportecajavariable (minúsculas)...')
    try {
      const columnas2 = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'vistareportecajavariable' 
        ORDER BY ordinal_position
      `
      
      console.log('✅ Columnas de vistareportecajavariable:')
      columnas2.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`)
      })
      
      const count2 = await sql`SELECT COUNT(*) as total FROM vistareportecajavariable`
      console.log(`📊 Registros: ${count2[0].total}`)
      
    } catch (error) {
      console.log('❌ Error con vistareportecajavariable:', error.message)
    }
    
    // Eliminar la vista incorrecta (minúsculas) y recrear la correcta
    console.log('\n3️⃣ Eliminando vista incorrecta...')
    await sql`DROP VIEW IF EXISTS vistareportecajavariable`
    console.log('✅ Vista en minúsculas eliminada')
    
    // Asegurar que también tenemos la vista sin comillas
    console.log('\n4️⃣ Recreando vista sin comillas...')
    await sql`DROP VIEW IF EXISTS VistaReporteCajaVariable`
    
    const vistaCompleta = `
      CREATE VIEW VistaReporteCajaVariable AS
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
    
    await sql.unsafe(vistaCompleta)
    console.log('✅ Vista VistaReporteCajaVariable recreada sin comillas')
    
    // Probar la nueva vista
    console.log('\n5️⃣ Probando la nueva vista...')
    const test = await sql`SELECT COUNT(*) as total FROM VistaReporteCajaVariable`
    console.log(`✅ Vista funciona: ${test[0].total} registros`)
    
    // Probar la consulta exacta del API
    console.log('\n6️⃣ Probando consulta exacta del API...')
    const queryAPI = `
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
    
    const resultAPI = await sql.query(queryAPI, [2025])
    console.log(`✅ Consulta API exitosa: ${resultAPI.length} registros`)
    
    if (resultAPI.length === 0) {
      // Buscar datos en cualquier año
      const anyYear = await sql`SELECT * FROM VistaReporteCajaVariable LIMIT 3`
      console.log(`📊 Datos disponibles: ${anyYear.length} registros`)
      if (anyYear.length > 0) {
        console.log('📋 Muestra:')
        anyYear.forEach((row, i) => {
          console.log(`  ${i + 1}. ${row.Cliente} - ${row.NombreMes} ${row.Año} - ${row.MontoDevengado}`)
        })
      }
    }
    
    // Listar vistas finales
    console.log('\n7️⃣ Vistas finales:')
    const vistasFinal = await sql`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    
    vistasFinal.forEach(vista => {
      console.log(`  - ${vista.table_name}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
    console.error('Mensaje:', error.message)
  }
}

verificarYCorregirVistas()
  .then(() => {
    console.log('\n🎉 Corrección completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })
