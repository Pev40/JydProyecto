const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function crearPlantillaRecordatorio() {
  try {
    console.log('=== CREANDO PLANTILLA DE RECORDATORIO ===\n');
    
    // Crear plantilla de recordatorio
    const plantilla = await sql`
      INSERT INTO "PlantillaMensaje" (
        "IdClasificacion",
        "Nombre",
        "Contenido"
      ) VALUES (
        1,
        'Recordatorio Compromiso de Pago',
        'Estimado/a {cliente}, le recordamos su compromiso de pago por S/ {monto} con fecha de vencimiento el {fecha}. Para cualquier consulta, contáctenos. Gracias por su atención.'
      )
      RETURNING *
    `;
    
    console.log('✅ Plantilla creada exitosamente:');
    console.log(`   ID: ${plantilla[0].IdPlantillaMensaje}`);
    console.log(`   Nombre: ${plantilla[0].Nombre}`);
    console.log(`   Contenido: ${plantilla[0].Contenido}`);
    
    console.log('\n🎯 PLANTILLA LISTA PARA USAR');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

crearPlantillaRecordatorio();
