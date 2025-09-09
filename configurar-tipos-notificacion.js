const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function configurarTiposNotificacion() {
  try {
    console.log('=== CONFIGURANDO TIPOS DE NOTIFICACIÓN ===\n');
    
    // Verificar tipos existentes
    const tiposExistentes = await sql`SELECT * FROM "TipoNotificacion"`;
    console.log(`📋 Tipos existentes: ${tiposExistentes.length}`);
    
    if (tiposExistentes.length > 0) {
      tiposExistentes.forEach((tipo, i) => {
        console.log(`   ${i+1}. ID: ${tipo.IdTipoNotificacion} - ${tipo.Nombre || tipo.Descripcion || 'Sin nombre'}`);
      });
    }
    
    // Crear tipos básicos si no existen
    const tiposBasicos = [
      { id: 1, nombre: 'WhatsApp', descripcion: 'Notificación por WhatsApp' },
      { id: 2, nombre: 'Email', descripcion: 'Notificación por correo electrónico' },
      { id: 3, nombre: 'SMS', descripcion: 'Notificación por SMS' }
    ];
    
    for (const tipo of tiposBasicos) {
      try {
        const existe = tiposExistentes.find(t => t.IdTipoNotificacion === tipo.id);
        
        if (!existe) {
          await sql`
            INSERT INTO "TipoNotificacion" ("IdTipoNotificacion", "Nombre", "Descripcion")
            VALUES (${tipo.id}, ${tipo.nombre}, ${tipo.descripcion})
          `;
          console.log(`✅ Creado tipo: ${tipo.nombre}`);
        } else {
          console.log(`ℹ️  Ya existe tipo: ${tipo.nombre}`);
        }
      } catch (error) {
        console.log(`❌ Error creando ${tipo.nombre}:`, error.message);
      }
    }
    
    // Verificar resultado final
    const tiposFinales = await sql`SELECT * FROM "TipoNotificacion" ORDER BY "IdTipoNotificacion"`;
    console.log(`\n📋 TIPOS FINALES: ${tiposFinales.length}`);
    tiposFinales.forEach(tipo => {
      console.log(`   ${tipo.IdTipoNotificacion}. ${tipo.Nombre} - ${tipo.Descripcion}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

configurarTiposNotificacion();
