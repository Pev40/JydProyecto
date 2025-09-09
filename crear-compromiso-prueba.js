const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function crearCompromisoPago() {
  try {
    console.log('=== CREANDO COMPROMISO DE PAGO PARA CLIENTE 4 ===\n');
    
    // Crear compromiso de pago para mañana
    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1);
    
    const resultado = await sql`
      INSERT INTO "CompromisoPago" (
        "IdCliente",
        "FechaCompromiso", 
        "MontoCompromiso",
        "Estado",
        "FechaRegistro",
        "Observaciones"
      ) VALUES (
        4,
        ${mañana.toISOString().split('T')[0]},
        150.00,
        'Pendiente',
        NOW(),
        'Compromiso de prueba para sistema de recordatorios WhatsApp'
      )
      RETURNING *
    `;
    
    console.log('✅ Compromiso creado exitosamente:');
    console.log(`   ID Compromiso: ${resultado[0].IdCompromiso}`);
    console.log(`   Cliente: 4 (PIERO EMILIANO VIZCARRA VARGAS)`);
    console.log(`   Fecha: ${new Date(resultado[0].FechaCompromiso).toLocaleDateString('es-PE')}`);
    console.log(`   Monto: S/ ${resultado[0].MontoCompromiso}`);
    console.log(`   Estado: ${resultado[0].Estado}`);
    
    // Verificar que se creó correctamente
    const verificacion = await sql`
      SELECT * FROM "CompromisoPago" 
      WHERE "IdCliente" = 4 AND "Estado" = 'Pendiente'
      ORDER BY "FechaRegistro" DESC
    `;
    
    console.log(`\n📋 Total compromisos pendientes para cliente 4: ${verificacion.length}`);
    
    console.log('\n🎯 LISTO PARA PROBAR RECORDATORIOS');
    console.log('Ahora puedes:');
    console.log('1. Ir a la aplicación web');
    console.log('2. Navegar a Compromisos');
    console.log('3. Crear un recordatorio para este compromiso');
    console.log('4. Enviar por WhatsApp');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

crearCompromisoPago();
