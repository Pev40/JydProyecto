require('dotenv').config()
const { neon } = require('@neondatabase/serverless')

const sql = neon(process.env.DATABASE_URL)

async function verificarDatos() {
  try {
    console.log('🔍 Verificando los datos en las tablas...')
    
    // Verificar estados de pagos
    console.log('\n1️⃣ Estados de pagos disponibles:')
    const estados = await sql`
      SELECT "Estado", COUNT(*) as total 
      FROM "Pago" 
      GROUP BY "Estado" 
      ORDER BY total DESC
    `
    
    estados.forEach(estado => {
      console.log(`  - ${estado.Estado || 'NULL'}: ${estado.total} registros`)
    })
    
    // Verificar algunos pagos específicos
    console.log('\n2️⃣ Muestra de pagos:')
    const pagos = await sql`
      SELECT "IdPago", "IdCliente", "Estado", "Fecha", "Monto", "Concepto"
      FROM "Pago" 
      ORDER BY "IdPago" 
      LIMIT 5
    `
    
    pagos.forEach(pago => {
      console.log(`  - Pago ${pago.IdPago}: Cliente ${pago.IdCliente}, Estado: ${pago.Estado}, Monto: ${pago.Monto}`)
    })
    
    // Verificar clientes
    console.log('\n3️⃣ Clientes disponibles:')
    const clientes = await sql`
      SELECT "IdCliente", "RazonSocial"
      FROM "Cliente" 
      ORDER BY "IdCliente" 
      LIMIT 5
    `
    
    clientes.forEach(cliente => {
      console.log(`  - Cliente ${cliente.IdCliente}: ${cliente.RazonSocial}`)
    })
    
    // Crear vista sin filtro de estado para incluir todos los pagos
    console.log('\n4️⃣ Recreando vista sin filtro de estado...')
    
    await sql`DROP VIEW IF EXISTS VistaReporteCajaVariable`
    
    const vistaSinFiltro = `
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
                  ELSE p."Monto"
              END
          ) as "MontoPagado",
          COALESCE(p."SaldoPendiente", 
              CASE 
                  WHEN p."Estado" = 'COMPLETADO' THEN 0
                  WHEN p."Estado" = 'PARCIAL' THEN p."Monto" * 0.5
                  ELSE 0
              END
          ) as "SaldoPendiente",
          COALESCE(p."Observaciones", '') as "Observaciones",
          p."Monto" as "MontoOriginal",
          COALESCE(p."Estado", 'PENDIENTE') as "Estado"
      FROM "Pago" p
      INNER JOIN "Cliente" c ON p."IdCliente" = c."IdCliente"
      LEFT JOIN "Banco" b ON p."IdBanco" = b."IdBanco"
      ORDER BY p."Fecha" DESC, c."RazonSocial"
    `
    
    await sql.unsafe(vistaSinFiltro)
    console.log('✅ Vista recreada sin filtro de estado')
    
    // Probar la nueva vista
    console.log('\n5️⃣ Probando la nueva vista...')
    const test = await sql`SELECT COUNT(*) as total FROM VistaReporteCajaVariable`
    console.log(`✅ Vista funciona: ${test[0].total} registros`)
    
    if (test[0].total > 0) {
      // Probar la consulta exacta del API
      console.log('\n6️⃣ Probando consulta del API...')
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
      console.log(`✅ Consulta API exitosa: ${resultAPI.length} registros para 2025`)
      
      // Si no hay datos para 2025, buscar en otros años
      if (resultAPI.length === 0) {
        const anyYear = await sql`
          SELECT "Año", COUNT(*) as total 
          FROM VistaReporteCajaVariable 
          GROUP BY "Año" 
          ORDER BY "Año" DESC
        `
        
        console.log('📊 Datos por año:')
        anyYear.forEach(row => {
          console.log(`  - Año ${row.Año}: ${row.total} registros`)
        })
        
        if (anyYear.length > 0) {
          const añoDisponible = anyYear[0].Año
          const datosAño = await sql.query(queryAPI, [añoDisponible])
          console.log(`📋 Muestra para año ${añoDisponible}:`)
          datosAño.slice(0, 2).forEach((row, i) => {
            console.log(`  ${i + 1}. ${row.Cliente} - ${row.NombreMes} ${row.Año} - ${row.MontoDevengado}`)
          })
        }
      } else {
        console.log('📋 Muestra para 2025:')
        resultAPI.slice(0, 2).forEach((row, i) => {
          console.log(`  ${i + 1}. ${row.Cliente} - ${row.NombreMes} ${row.Año} - ${row.MontoDevengado}`)
        })
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
    console.error('Mensaje:', error.message)
  }
}

verificarDatos()
  .then(() => {
    console.log('\n🎉 Verificación completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })
