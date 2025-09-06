require('dotenv').config()
const { neon } = require('@neondatabase/serverless')

const sql = neon(process.env.DATABASE_URL)

async function diagnosticarProblema() {
  try {
    console.log('🔍 Diagnosticando el problema paso a paso...')
    
    // 1. Verificar estructura de la tabla Banco
    console.log('\n1️⃣ Verificando tabla Banco...')
    const estructuraBanco = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Banco' 
      ORDER BY ordinal_position
    `
    
    if (estructuraBanco.length > 0) {
      console.log('✅ Tabla Banco existe con las siguientes columnas:')
      estructuraBanco.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`)
      })
    } else {
      console.log('❌ Tabla Banco no existe')
    }
    
    // 2. Verificar estructura de la tabla Pago
    console.log('\n2️⃣ Verificando tabla Pago...')
    const estructuraPago = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Pago' 
      ORDER BY ordinal_position
    `
    
    console.log('✅ Tabla Pago existe con las siguientes columnas:')
    estructuraPago.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`)
    })
    
    // 3. Intentar crear la vista manualmente
    console.log('\n3️⃣ Intentando crear la vista manualmente...')
    
    try {
      await sql`DROP VIEW IF EXISTS "VistaReporteCajaVariable"`
      console.log('✅ Vista anterior eliminada (si existía)')
    } catch (error) {
      console.log('⚠️ No se pudo eliminar vista anterior:', error.message)
    }
    
    // Crear la vista básica primero
    try {
      const vistaBasica = `
        CREATE VIEW "VistaReporteCajaVariable" AS
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
            COALESCE(p."Concepto", 'SERVICIO CONTABLE') as "DetalleServicio",
            'REC-' || LPAD(p."IdPago"::TEXT, 6, '0') as "NumeroRecibo",
            'EFECTIVO' as "Medio",
            'YAPE' as "Banco",
            p."Monto" as "MontoDevengado",
            CASE 
                WHEN p."Estado" = 'COMPLETADO' THEN p."Monto"
                WHEN p."Estado" = 'PARCIAL' THEN p."Monto" * 0.5
                ELSE 0
            END as "MontoPagado",
            CASE 
                WHEN p."Estado" = 'COMPLETADO' THEN 0
                WHEN p."Estado" = 'PARCIAL' THEN p."Monto" * 0.5
                ELSE p."Monto"
            END as "SaldoPendiente",
            '' as "Observaciones",
            p."Monto" as "MontoOriginal",
            p."Estado"
        FROM "Pago" p
        INNER JOIN "Cliente" c ON p."IdCliente" = c."IdCliente"
        WHERE p."Estado" IN ('COMPLETADO', 'PENDIENTE', 'PARCIAL')
        ORDER BY p."Fecha" DESC, c."RazonSocial"
      `
      
      await sql.unsafe(vistaBasica)
      console.log('✅ Vista básica creada exitosamente')
      
      // Probar la vista
      const test = await sql`SELECT COUNT(*) as total FROM "VistaReporteCajaVariable"`
      console.log(`✅ Vista funciona: ${test[0].total} registros`)
      
      if (test[0].total > 0) {
        const muestra = await sql`
          SELECT "Mes", "Año", "NombreMes", "Cliente", "MontoDevengado" 
          FROM "VistaReporteCajaVariable" 
          LIMIT 2
        `
        
        console.log('📊 Muestra de datos:')
        muestra.forEach((row, i) => {
          console.log(`  ${i + 1}. ${row.Cliente} - ${row.NombreMes} ${row.Año} - ${row.MontoDevengado}`)
        })
      }
      
    } catch (error) {
      console.error('❌ Error creando vista básica:', error.message)
      
      // Intentar una consulta más simple para diagnosticar
      console.log('\n🔍 Intentando consulta de diagnóstico...')
      try {
        const testSimple = await sql`
          SELECT 
            p."IdPago",
            EXTRACT(MONTH FROM p."Fecha") as mes,
            c."RazonSocial" as cliente
          FROM "Pago" p
          INNER JOIN "Cliente" c ON p."IdCliente" = c."IdCliente"
          LIMIT 1
        `
        console.log('✅ Consulta de diagnóstico exitosa:', testSimple[0])
      } catch (error2) {
        console.error('❌ Error en consulta de diagnóstico:', error2.message)
      }
    }
    
    // 4. Verificar vistas existentes
    console.log('\n4️⃣ Verificando vistas existentes...')
    const vistas = await sql`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    
    console.log('📋 Vistas existentes:')
    if (vistas.length > 0) {
      vistas.forEach(vista => {
        console.log(`  - ${vista.table_name}`)
      })
    } else {
      console.log('  - No hay vistas en la base de datos')
    }
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error)
    console.error('Mensaje:', error.message)
  }
}

diagnosticarProblema()
  .then(() => {
    console.log('\n🎉 Diagnóstico completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })
