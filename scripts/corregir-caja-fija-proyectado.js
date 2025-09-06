require('dotenv').config()
const { neon } = require('@neondatabase/serverless')

const sql = neon(process.env.DATABASE_URL)

async function corregirCajaFijaProyectado() {
  try {
    console.log('🔧 Corrigiendo vista y función de caja fija proyectado...')
    
    // 1. Verificar qué vistas existen
    console.log('\n1️⃣ Verificando vistas existentes...')
    const vistas = await sql`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name ILIKE '%fija%'
      ORDER BY table_name
    `
    
    console.log('Vistas relacionadas con caja fija:')
    vistas.forEach(vista => {
      console.log(`  - ${vista.table_name}`)
    })
    
    // 2. Verificar funciones existentes
    console.log('\n2️⃣ Verificando funciones existentes...')
    const funciones = await sql`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name ILIKE '%caja%fija%'
      ORDER BY routine_name
    `
    
    console.log('Funciones relacionadas con caja fija:')
    funciones.forEach(func => {
      console.log(`  - ${func.routine_name}`)
    })
    
    // 3. Eliminar función problemática si existe
    console.log('\n3️⃣ Eliminando función problemática...')
    await sql`DROP FUNCTION IF EXISTS obtenerreportecajafijaproyectado(INTEGER) CASCADE`
    await sql`DROP FUNCTION IF EXISTS ObtenerReporteCajaFijaProyectado(INTEGER) CASCADE`
    console.log('✅ Funciones eliminadas')
    
    // 4. Eliminar vista problemática si existe
    console.log('\n4️⃣ Eliminando vista problemática...')
    await sql`DROP VIEW IF EXISTS VistaReporteCajaFijaProyectado CASCADE`
    await sql`DROP VIEW IF EXISTS vistareportecajafijaproyectado CASCADE`
    console.log('✅ Vistas eliminadas')
    
    // 5. Crear la vista corregida
    console.log('\n5️⃣ Creando vista VistaReporteCajaFijaProyectado...')
    
    await sql`
      CREATE VIEW VistaReporteCajaFijaProyectado AS
      SELECT 
          c."IdCliente",
          c."RazonSocial" as "Concepto",
          c."IdCliente"::TEXT as "CodigoCliente",
          COALESCE(c."FechaRegistro", CURRENT_DATE - INTERVAL '6 months') as "FechaInicioServicio",
          '15' as "FechaCorte",
          0 as "SaldoAnterior",
          COALESCE(c."MontoFijoMensual", 0) as "ImporteServicioFijo",
          COALESCE(c."MontoFijoMensual", 0) as "ImporteVariable",
          COALESCE(c."MontoFijoMensual" * 12, 0) as "ImporteAcumulado",
          'FACTURA' as "TipoComprobante",
          'DIGITAL' as "MedioDocumento",
          'Servicio contable mensual' as "VariableDescripcion",
          CURRENT_DATE - INTERVAL '5 days' as "FechaUltimaConsulta",
          (
              SELECT MAX(p."Fecha"::DATE)
              FROM "Pago" p 
              WHERE p."IdCliente" = c."IdCliente"
          ) as "FechaUltimoPago",
          CASE 
              WHEN c."AplicaMontoFijo" = true AND c."MontoFijoMensual" > 0 THEN 'ACTIVO'
              ELSE 'INACTIVO'
          END as "EstadoDeuda"
      FROM "Cliente" c
      WHERE c."AplicaMontoFijo" = true
      ORDER BY c."RazonSocial"
    `
    
    console.log('✅ Vista VistaReporteCajaFijaProyectado creada')
    
    // 6. Crear tabla ProyeccionesCajaFija si no existe
    console.log('\n6️⃣ Verificando tabla ProyeccionesCajaFija...')
    
    await sql`
      CREATE TABLE IF NOT EXISTS "ProyeccionesCajaFija" (
          "IdProyeccion" SERIAL PRIMARY KEY,
          "IdCliente" INTEGER NOT NULL,
          "Año" INTEGER NOT NULL,
          "Mes" INTEGER NOT NULL CHECK ("Mes" BETWEEN 1 AND 12),
          "MontoProyectado" DECIMAL(10,2) DEFAULT 0,
          "Estado" VARCHAR(20) DEFAULT 'PENDIENTE',
          "FechaCreacion" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "FechaActualizacion" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("IdCliente") REFERENCES "Cliente"("IdCliente") ON DELETE CASCADE,
          UNIQUE("IdCliente", "Año", "Mes")
      )
    `
    
    console.log('✅ Tabla ProyeccionesCajaFija verificada')
    
    // 7. Crear la función corregida
    console.log('\n7️⃣ Creando función ObtenerReporteCajaFijaProyectado...')
    
    const funcionSQL = `
      CREATE OR REPLACE FUNCTION ObtenerReporteCajaFijaProyectado(p_año INTEGER)
      RETURNS TABLE (
          "IdCliente" INTEGER,
          "Concepto" TEXT,
          "CodigoCliente" TEXT,
          "FechaInicioServicio" DATE,
          "FechaCorte" TEXT,
          "SaldoAnterior" DECIMAL(10,2),
          "ImporteServicioFijo" DECIMAL(10,2),
          "ImporteVariable" DECIMAL(10,2),
          "ImporteAcumulado" DECIMAL(10,2),
          "TipoComprobante" TEXT,
          "MedioDocumento" TEXT,
          "VariableDescripcion" TEXT,
          "FechaUltimaConsulta" DATE,
          "FechaUltimoPago" DATE,
          "EstadoDeuda" TEXT,
          "ProyeccionesJSON" TEXT
      ) AS $$
      BEGIN
          RETURN QUERY
          SELECT 
              v."IdCliente",
              v."Concepto",
              v."CodigoCliente",
              v."FechaInicioServicio",
              v."FechaCorte",
              v."SaldoAnterior",
              v."ImporteServicioFijo",
              v."ImporteVariable",
              v."ImporteAcumulado",
              v."TipoComprobante",
              v."MedioDocumento",
              v."VariableDescripcion",
              v."FechaUltimaConsulta",
              v."FechaUltimoPago",
              v."EstadoDeuda",
              COALESCE((
                  SELECT json_object_agg(
                      CONCAT(
                          CASE p."Mes"
                              WHEN 1 THEN 'ENE' WHEN 2 THEN 'FEB' WHEN 3 THEN 'MAR'
                              WHEN 4 THEN 'ABR' WHEN 5 THEN 'MAY' WHEN 6 THEN 'JUN'
                              WHEN 7 THEN 'JUL' WHEN 8 THEN 'AGO' WHEN 9 THEN 'SEP'
                              WHEN 10 THEN 'OCT' WHEN 11 THEN 'NOV' WHEN 12 THEN 'DIC'
                          END,
                          '-',
                          RIGHT(p."Año"::TEXT, 2)
                      ),
                      p."MontoProyectado"
                  )::TEXT
                  FROM "ProyeccionesCajaFija" p
                  WHERE p."IdCliente" = v."IdCliente" AND p."Año" = p_año
              ), '{}') as "ProyeccionesJSON"
          FROM VistaReporteCajaFijaProyectado v
          ORDER BY v."Concepto";
      END;
      $$ LANGUAGE plpgsql;
    `
    
    await sql.unsafe(funcionSQL)
    console.log('✅ Función ObtenerReporteCajaFijaProyectado creada')
    
    // 8. Probar la vista
    console.log('\n8️⃣ Probando la vista...')
    const countVista = await sql`SELECT COUNT(*) as total FROM VistaReporteCajaFijaProyectado`
    console.log(`✅ Vista funciona: ${countVista[0].total} registros`)
    
    // 9. Generar algunas proyecciones de prueba
    console.log('\n9️⃣ Generando datos de proyección para prueba...')
    
    // Obtener clientes con monto fijo
    const clientesConMontoFijo = await sql`
      SELECT "IdCliente", "MontoFijoMensual" 
      FROM "Cliente" 
      WHERE "AplicaMontoFijo" = true AND "MontoFijoMensual" > 0
      LIMIT 3
    `
    
    console.log(`Clientes con monto fijo: ${clientesConMontoFijo.length}`)
    
    // Crear proyecciones para 2025
    for (const cliente of clientesConMontoFijo) {
      for (let mes = 1; mes <= 12; mes++) {
        await sql`
          INSERT INTO "ProyeccionesCajaFija" ("IdCliente", "Año", "Mes", "MontoProyectado")
          VALUES (${cliente.IdCliente}, 2025, ${mes}, ${cliente.MontoFijoMensual})
          ON CONFLICT ("IdCliente", "Año", "Mes") DO NOTHING
        `
      }
    }
    
    console.log('✅ Proyecciones de prueba generadas')
    
    // 10. Probar la función
    console.log('\n🔟 Probando la función...')
    const resultFuncion = await sql`SELECT * FROM ObtenerReporteCajaFijaProyectado(2025) LIMIT 3`
    console.log(`✅ Función funciona: ${resultFuncion.length} registros`)
    
    if (resultFuncion.length > 0) {
      console.log('📋 Primer registro:')
      const primer = resultFuncion[0]
      console.log(`  Concepto: ${primer.Concepto}`)
      console.log(`  ImporteServicioFijo: ${primer.ImporteServicioFijo}`)
      console.log(`  ProyeccionesJSON: ${primer.ProyeccionesJSON || 'vacío'}`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
    console.error('Mensaje:', error.message)
  }
}

corregirCajaFijaProyectado()
  .then(() => {
    console.log('\n🎉 ¡Corrección de caja fija proyectado completada!')
    console.log('🚀 Prueba el API: /api/reportes/ingreso-caja-fija-proyectado?año=2025')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })
