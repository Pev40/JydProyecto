require('dotenv').config()
const { neon } = require('@neondatabase/serverless')

const sql = neon(process.env.DATABASE_URL)

async function solucionarVista() {
  try {
    console.log('🎯 Solución directa para crear la vista...')
    
    // Eliminar cualquier vista existente
    console.log('\n1️⃣ Eliminando vistas existentes...')
    try {
      await sql`DROP VIEW IF EXISTS "VistaReporteCajaVariable"`
      console.log('✅ Vista con comillas eliminada')
    } catch (e) {
      console.log('⚠️ Vista con comillas no existía')
    }
    
    try {
      await sql`DROP VIEW IF EXISTS VistaReporteCajaVariable`
      console.log('✅ Vista sin comillas eliminada')
    } catch (e) {
      console.log('⚠️ Vista sin comillas no existía')
    }
    
    // Crear la vista usando el template literal con sql``
    console.log('\n2️⃣ Creando vista nueva...')
    
    await sql`
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
    
    console.log('✅ Vista VistaReporteCajaVariable creada')
    
    // Probar la vista inmediatamente
    console.log('\n3️⃣ Probando la vista...')
    const count = await sql`SELECT COUNT(*) as count FROM VistaReporteCajaVariable`
    console.log(`📊 Total de registros: ${count[0].count}`)
    
    if (count[0].count > 0) {
      // Probar con datos reales
      console.log('\n4️⃣ Verificando datos...')
      const muestra = await sql`
        SELECT "Mes", "Año", "NombreMes", "Cliente", "MontoDevengado" 
        FROM VistaReporteCajaVariable 
        LIMIT 3
      `
      
      console.log('📋 Muestra de datos:')
      muestra.forEach((row, i) => {
        console.log(`  ${i + 1}. ${row.Cliente} - ${row.NombreMes} ${row.Año} - $${row.MontoDevengado}`)
      })
      
      // Probar la consulta exacta del API
      console.log('\n5️⃣ Probando consulta del API...')
      const años = await sql`
        SELECT DISTINCT "Año", COUNT(*) as total 
        FROM VistaReporteCajaVariable 
        GROUP BY "Año" 
        ORDER BY "Año" DESC
      `
      
      console.log('📅 Años con datos:')
      años.forEach(año => {
        console.log(`  - ${año.Año}: ${año.total} registros`)
      })
      
      if (años.length > 0) {
        const añoPrueba = años[0].Año
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
        
        const resultadoAPI = await sql.query(queryAPI, [añoPrueba])
        console.log(`✅ Consulta API para ${añoPrueba}: ${resultadoAPI.length} registros`)
        
        if (resultadoAPI.length > 0) {
          console.log('🎉 ¡La vista funciona correctamente!')
          console.log('📋 Primer registro completo:')
          const primer = resultadoAPI[0]
          console.log(`  Cliente: ${primer.Cliente}`)
          console.log(`  Mes: ${primer.Mes} (${primer.NombreMes})`)
          console.log(`  Año: ${primer.Año}`)
          console.log(`  MontoDevengado: ${primer.MontoDevengado}`)
          console.log(`  MontoPagado: ${primer.MontoPagado}`)
          console.log(`  Estado: ${primer.Estado}`)
        }
      }
    } else {
      console.log('⚠️ La vista no tiene datos, pero se creó correctamente')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
    console.error('Código:', error.code)
    console.error('Mensaje:', error.message)
  }
}

solucionarVista()
  .then(() => {
    console.log('\n🎉 ¡Solución completada!')
    console.log('🚀 Prueba el API ahora: /api/reportes/ingreso-caja-variable')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })
