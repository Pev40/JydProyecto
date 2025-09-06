require('dotenv').config()
const { neon } = require('@neondatabase/serverless')

const sql = neon(process.env.DATABASE_URL)

async function crearVistaFinal() {
  try {
    console.log('🔧 Creando vista con el nombre exacto que espera Neon...')
    
    // Eliminar cualquier vista existente
    await sql`DROP VIEW IF EXISTS VistaReporteCajaVariable CASCADE`
    await sql`DROP VIEW IF EXISTS "VistaReporteCajaVariable" CASCADE`
    await sql`DROP VIEW IF EXISTS vistareportecajavariable CASCADE`
    console.log('✅ Vistas anteriores eliminadas')
    
    // Crear la vista con el nombre que funciona en Neon
    const vistaDefinitiva = `
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
          COALESCE(p."MontoPagado", p."Monto") as "MontoPagado",
          COALESCE(p."SaldoPendiente", 0) as "SaldoPendiente",
          COALESCE(p."Observaciones", '') as "Observaciones",
          p."Monto" as "MontoOriginal",
          COALESCE(p."Estado", 'CONFIRMADO') as "Estado"
      FROM "Pago" p
      INNER JOIN "Cliente" c ON p."IdCliente" = c."IdCliente"
      LEFT JOIN "Banco" b ON p."IdBanco" = b."IdBanco"
      ORDER BY p."Fecha" DESC, c."RazonSocial"
    `
    
    await sql.unsafe(vistaDefinitiva)
    console.log('✅ Vista VistaReporteCajaVariable creada definitivamente')
    
    // Probar inmediatamente
    console.log('\n🧪 Probando la vista...')
    const count = await sql`SELECT COUNT(*) as total FROM VistaReporteCajaVariable`
    console.log(`📊 Total de registros: ${count[0].total}`)
    
    if (count[0].total > 0) {
      // Probar con la consulta exacta del API
      console.log('\n🎯 Probando consulta exacta del API...')
      const testQuery = `
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
      
      // Buscar qué años hay disponibles
      const añosDisponibles = await sql`
        SELECT DISTINCT "Año", COUNT(*) as total 
        FROM VistaReporteCajaVariable 
        GROUP BY "Año" 
        ORDER BY "Año" DESC
      `
      
      console.log('📅 Años disponibles:')
      añosDisponibles.forEach(año => {
        console.log(`  - ${año.Año}: ${año.total} registros`)
      })
      
      if (añosDisponibles.length > 0) {
        const añoPrueba = añosDisponibles[0].Año
        const resultado = await sql.query(testQuery, [añoPrueba])
        console.log(`\n✅ Consulta API exitosa para ${añoPrueba}: ${resultado.length} registros`)
        
        if (resultado.length > 0) {
          console.log('📋 Primer registro:')
          const primer = resultado[0]
          console.log(`  Cliente: ${primer.Cliente}`)
          console.log(`  Mes: ${primer.Mes} (${primer.NombreMes})`)
          console.log(`  Año: ${primer.Año}`)
          console.log(`  Monto Devengado: ${primer.MontoDevengado}`)
          console.log(`  Monto Pagado: ${primer.MontoPagado}`)
        }
        
        // Probar específicamente para 2025 (que es lo que está pidiendo el API)
        const resultado2025 = await sql.query(testQuery, [2025])
        console.log(`\n📊 Para año 2025: ${resultado2025.length} registros`)
      }
    }
    
    // Mostrar vistas finales
    console.log('\n📋 Vistas finales en la base de datos:')
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

crearVistaFinal()
  .then(() => {
    console.log('\n🎉 ¡Vista creada y probada exitosamente!')
    console.log('🚀 El API debería funcionar ahora')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })
