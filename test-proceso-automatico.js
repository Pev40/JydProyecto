require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function testProcesoAutomatico() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('🤖 Probando conexión entre CronogramaSunat y proceso automático...');
    
    const fechaHoy = new Date();
    const año = fechaHoy.getFullYear();
    const mes = fechaHoy.getMonth() + 1;
    const dia = fechaHoy.getDate();
    
    console.log(`📅 Fecha de prueba: ${año}-${mes}-${dia}`);
    
    // Verificar qué clientes tendrían corte hoy (simulado)
    const clientesCorteHoy = await sql`
      SELECT 
        c."IdCliente",
        c."RazonSocial",
        c."Email",
        c."UltimoDigitoRUC",
        c."MontoFijoMensual",
        s."Nombre" as "ServicioNombre",
        cs."Dia" as "DiaCorte",
        cs."MesVencimiento"
      FROM "Cliente" c
      JOIN "Servicio" s ON c."IdServicio" = s."IdServicio"
      JOIN "CronogramaSunat" cs ON (
        (c."UltimoDigitoRUC" = cs."DigitoRUC") OR 
        (c."UltimoDigitoRUC" IN (2,3) AND cs."DigitoRUC" = 2) OR
        (c."UltimoDigitoRUC" IN (4,5) AND cs."DigitoRUC" = 4) OR
        (c."UltimoDigitoRUC" IN (6,7) AND cs."DigitoRUC" = 6) OR
        (c."UltimoDigitoRUC" IN (8,9) AND cs."DigitoRUC" = 8)
      )
      WHERE cs."Año" = ${año}
        AND cs."Mes" = ${mes}
        AND cs."Dia" = ${dia}
      ORDER BY c."RazonSocial"
    `;
    
    console.log(`🎯 Clientes con corte HOY (${dia}/${mes}/${año}): ${clientesCorteHoy.length}`);
    clientesCorteHoy.forEach(cliente => {
      console.log(`  - ${cliente.RazonSocial} (RUC dígito: ${cliente.UltimoDigitoRUC})`);
    });
    
    // Verificar cronograma completo del mes actual
    console.log(`\n📊 Cronograma completo para ${mes}/${año}:`);
    const cronogramaMes = await sql`
      SELECT DISTINCT "DigitoRUC", "Dia"
      FROM "CronogramaSunat"
      WHERE "Año" = ${año} AND "Mes" = ${mes}
      ORDER BY "Dia", "DigitoRUC"
    `;
    
    cronogramaMes.forEach(item => {
      console.log(`  Día ${item.Dia}: Dígitos ${item.DigitoRUC}`);
    });
    
    // Probar con un día específico que sabemos que tiene datos
    console.log(`\n🔍 Probando con días que tienen actividad en el cronograma:`);
    const diasConActividad = await sql`
      SELECT DISTINCT "Dia", COUNT(*) as "ClientesPotenciales"
      FROM "CronogramaSunat" cs
      WHERE cs."Año" = ${año} AND cs."Mes" = ${mes}
      GROUP BY "Dia"
      ORDER BY "Dia"
    `;
    
    for (const diaTest of diasConActividad.slice(0, 3)) {
      const clientesPorDia = await sql`
        SELECT 
          c."RazonSocial",
          c."UltimoDigitoRUC",
          cs."DigitoRUC",
          cs."Dia"
        FROM "Cliente" c
        JOIN "CronogramaSunat" cs ON (
          (c."UltimoDigitoRUC" = cs."DigitoRUC") OR 
          (c."UltimoDigitoRUC" IN (2,3) AND cs."DigitoRUC" = 2) OR
          (c."UltimoDigitoRUC" IN (4,5) AND cs."DigitoRUC" = 4) OR
          (c."UltimoDigitoRUC" IN (6,7) AND cs."DigitoRUC" = 6) OR
          (c."UltimoDigitoRUC" IN (8,9) AND cs."DigitoRUC" = 8)
        )
        WHERE cs."Año" = ${año}
          AND cs."Mes" = ${mes}
          AND cs."Dia" = ${diaTest.Dia}
      `;
      
      console.log(`  Día ${diaTest.Dia}: ${clientesPorDia.length} clientes con corte`);
      clientesPorDia.forEach(c => {
        console.log(`    - ${c.RazonSocial} (dígito ${c.UltimoDigitoRUC} → cronograma ${c.DigitoRUC})`);
      });
    }
    
    console.log('\n✅ Prueba de conexión completada');
    
  } catch (error) {
    console.error('❌ Error en prueba:', error);
  }
}

testProcesoAutomatico();
