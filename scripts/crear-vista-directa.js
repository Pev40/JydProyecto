require('dotenv').config()
const { neon } = require('@neondatabase/serverless')

const sql = neon(process.env.DATABASE_URL)

async function crearVistaDirecta() {
  try {
    console.log('🔨 Creando vista de forma directa...')
    
    // Primero verificar qué vistas existen
    console.log('\n1️⃣ Verificando vistas existentes...')
    const vistasExistentes = await sql.unsafe(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)
    
    console.log('Vistas existentes:')
    vistasExistentes.forEach(vista => {
      console.log(`  - ${vista.table_name}`)
    })
    
    // Eliminar vista si existe (sin usar CASCADE para evitar problemas)
    console.log('\n2️⃣ Eliminando vista existente si existe...')
    try {
      await sql.unsafe('DROP VIEW IF EXISTS "VistaReporteCajaVariable"')
      console.log('✅ Vista con comillas eliminada')
    } catch (e) {
      console.log('⚠️ No se pudo eliminar vista con comillas:', e.message)
    }
    
    try {
      await sql.unsafe('DROP VIEW IF EXISTS VistaReporteCajaVariable')
      console.log('✅ Vista sin comillas eliminada')
    } catch (e) {
      console.log('⚠️ No se pudo eliminar vista sin comillas:', e.message)
    }
    
    // Crear la vista directamente con SQL unsafe
    console.log('\n3️⃣ Creando vista nueva...')
    const createViewSQL = `
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
    
    await sql.unsafe(createViewSQL)
    console.log('✅ Vista creada exitosamente')
    
    // Verificar que se creó
    console.log('\n4️⃣ Verificando vista creada...')
    const vistasNuevas = await sql.unsafe(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)
    
    console.log('Vistas después de creación:')
    vistasNuevas.forEach(vista => {
      console.log(`  - ${vista.table_name}`)
    })
    
    // Probar la vista directamente con diferentes variaciones del nombre
    console.log('\n5️⃣ Probando acceso a la vista...')
    
    const variacionesNombre = [
      'VistaReporteCajaVariable',
      '"VistaReporteCajaVariable"',
      'vistareportecajavariable',
      '"vistareportecajavariable"'
    ]
    
    for (const nombre of variacionesNombre) {
      try {
        const result = await sql.unsafe(`SELECT COUNT(*) as total FROM ${nombre}`)
        console.log(`✅ ${nombre}: ${result[0].total} registros`)
        
        if (result[0].total > 0) {
          // Probar la consulta completa del API
          const testAPI = await sql.unsafe(`
            SELECT "Mes", "Año", "NombreMes", "Cliente" 
            FROM ${nombre} 
            LIMIT 1
          `)
          console.log(`   📋 Datos de prueba: ${testAPI[0].Cliente} - ${testAPI[0].NombreMes} ${testAPI[0].Año}`)
        }
        break // Si funciona uno, usar ese
      } catch (e) {
        console.log(`❌ ${nombre}: ${e.message}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
    console.error('Mensaje:', error.message)
  }
}

crearVistaDirecta()
  .then(() => {
    console.log('\n🎉 Proceso completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })
