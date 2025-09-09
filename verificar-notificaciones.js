const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function verificarEstructurasNotificaciones() {
  try {
    console.log('=== VERIFICANDO ESTRUCTURAS DE NOTIFICACIONES ===\n');
    
    // Verificar estructura PlantillaMensaje
    console.log('📋 ESTRUCTURA PLANTILLA MENSAJE:');
    const columnasPlantilla = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'PlantillaMensaje' 
      ORDER BY ordinal_position
    `;
    
    if (columnasPlantilla.length > 0) {
      columnasPlantilla.forEach(col => {
        console.log(`   ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.log('   ❌ Tabla PlantillaMensaje no encontrada');
    }
    
    // Verificar estructura Notificacion
    console.log('\n📢 ESTRUCTURA NOTIFICACIÓN:');
    const columnasNotif = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Notificacion' 
      ORDER BY ordinal_position
    `;
    
    if (columnasNotif.length > 0) {
      columnasNotif.forEach(col => {
        console.log(`   ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.log('   ❌ Tabla Notificacion no encontrada');
    }
    
    // Verificar datos existentes
    console.log('\n🔍 DATOS EXISTENTES:');
    
    try {
      const plantillas = await sql`SELECT * FROM "PlantillaMensaje" LIMIT 3`;
      console.log(`   Plantillas encontradas: ${plantillas.length}`);
      if (plantillas.length > 0) {
        console.log('   Primera plantilla:', Object.keys(plantillas[0]));
      }
    } catch (e) {
      console.log('   ❌ Error consultando PlantillaMensaje:', e.message);
    }
    
    try {
      const notificaciones = await sql`SELECT * FROM "Notificacion" LIMIT 3`;
      console.log(`   Notificaciones encontradas: ${notificaciones.length}`);
      if (notificaciones.length > 0) {
        console.log('   Primera notificación:', Object.keys(notificaciones[0]));
      }
    } catch (e) {
      console.log('   ❌ Error consultando Notificacion:', e.message);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

verificarEstructurasNotificaciones();
