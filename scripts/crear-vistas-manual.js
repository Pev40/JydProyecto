require('dotenv').config()
const { neon } = require('@neondatabase/serverless')

const sql = neon(process.env.DATABASE_URL)

async function crearVistas() {
  try {
    console.log('🔄 Creando vista VistaReporteCajaVariable...')
    
    await sql`
      DROP VIEW IF EXISTS VistaReporteCajaVariable;
    `
    
    await sql`
      CREATE VIEW VistaReporteCajaVariable AS
      SELECT 
          c."IdCliente",
          c."RazonSocial" as Concepto,
          c."RucDni" as CodigoCliente,
          p."Fecha" as FechaPago,
          p."Monto" as ImportePago,
          p."Concepto" as DetallePago,
          s."Nombre" as Servicio,
          cl."Descripcion" as Clasificacion,
          ca."Nombre" as Cartera,
          u."NombreCompleto" as Encargado,
          CASE 
              WHEN p."Monto" > 0 THEN 'PAGADO'
              ELSE 'PENDIENTE'
          END as EstadoPago,
          CAST(NULL AS DATE) as FechaVencimiento,
          CAST(0 AS DECIMAL(10,2)) as MontoDevengado,
          CAST(0 AS DECIMAL(10,2)) as SaldoPendiente
      FROM "Cliente" c
      LEFT JOIN "Pago" p ON c."IdCliente" = p."IdCliente"
      LEFT JOIN "Servicio" s ON c."IdServicio" = s."IdServicio"
      LEFT JOIN "Clasificacion" cl ON c."IdClasificacion" = cl."IdClasificacion"
      LEFT JOIN "Cartera" ca ON c."IdCartera" = ca."IdCartera"
      LEFT JOIN "Usuario" u ON c."IdEncargado" = u."IdUsuario"
      WHERE p."IdPago" IS NOT NULL;
    `
    
    console.log('✅ Vista VistaReporteCajaVariable creada')
    
    console.log('🔄 Creando vista VistaReporteCajaFijaProyectado...')
    
    await sql`
      DROP VIEW IF EXISTS VistaReporteCajaFijaProyectado;
    `
    
    await sql`
      CREATE VIEW VistaReporteCajaFijaProyectado AS
      SELECT 
          c."IdCliente",
          c."RazonSocial" as Concepto,
          c."RucDni" as CodigoCliente,
          c."FechaRegistro" as FechaInicioServicio,
          '31' as FechaCorte,
          CAST(0 AS DECIMAL(12,2)) as SaldoAnterior,
          c."MontoFijoMensual" as ImporteServicioFijo,
          CAST(0 AS DECIMAL(12,2)) as ImporteVariable,
          c."MontoFijoMensual" as ImporteAcumulado,
          'FACTURA' as TipoComprobante,
          'DIGITAL' as MedioDocumento,
          s."Descripcion" as VariableDescripcion,
          CAST(NULL AS DATE) as FechaUltimaConsulta,
          (
              SELECT MAX(p."Fecha"::DATE)
              FROM "Pago" p 
              WHERE p."IdCliente" = c."IdCliente"
          ) as FechaUltimoPago,
          CASE 
              WHEN c."AplicaMontoFijo" = true AND c."MontoFijoMensual" > 0 THEN 'ACTIVO'
              ELSE 'INACTIVO'
          END as EstadoDeuda
      FROM "Cliente" c
      LEFT JOIN "Servicio" s ON c."IdServicio" = s."IdServicio"
      WHERE c."AplicaMontoFijo" = true;
    `
    
    console.log('✅ Vista VistaReporteCajaFijaProyectado creada')
    
    // Verificar las vistas
    const vistas = await sql`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    
    console.log('📋 Todas las vistas:')
    for (const vista of vistas) {
      console.log(`  - ${vista.table_name}`)
    }
    
    // Probar las vistas
    console.log('🔍 Probando VistaReporteCajaVariable...')
    const test1 = await sql`SELECT COUNT(*) as total FROM VistaReporteCajaVariable`
    console.log(`✅ VistaReporteCajaVariable: ${test1[0].total} registros`)
    
    console.log('🔍 Probando VistaReporteCajaFijaProyectado...')
    const test2 = await sql`SELECT COUNT(*) as total FROM VistaReporteCajaFijaProyectado`
    console.log(`✅ VistaReporteCajaFijaProyectado: ${test2[0].total} registros`)
    
    console.log('\n🎉 Vistas creadas exitosamente')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

crearVistas()
