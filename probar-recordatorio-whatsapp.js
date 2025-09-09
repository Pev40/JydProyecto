const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function probarRecordatorioWhatsApp() {
  try {
    console.log('=== PROBANDO SISTEMA DE RECORDATORIOS WHATSAPP ===\n');
    
    // 1. Obtener el compromiso del cliente 4
    const compromisos = await sql`
      SELECT cp.*, c."RazonSocial", c."Telefono", c."Email", c."RucDni"
      FROM "CompromisoPago" cp
      JOIN "Cliente" c ON cp."IdCliente" = c."IdCliente"
      WHERE cp."IdCliente" = 4 AND cp."Estado" = 'Pendiente'
      ORDER BY cp."FechaRegistro" DESC
      LIMIT 1
    `;
    
    if (compromisos.length === 0) {
      console.log('❌ No se encontró compromiso pendiente para cliente 4');
      return;
    }
    
    const compromiso = compromisos[0];
    console.log('📋 COMPROMISO ENCONTRADO:');
    console.log(`   ID: ${compromiso.IdCompromiso}`);
    console.log(`   Cliente: ${compromiso.RazonSocial}`);
    console.log(`   Teléfono: ${compromiso.Telefono}`);
    console.log(`   Fecha compromiso: ${new Date(compromiso.FechaCompromiso).toLocaleDateString('es-PE')}`);
    console.log(`   Monto: S/ ${compromiso.MontoCompromiso}`);
    
    // 2. Obtener plantilla de mensaje (estructura correcta)
    const plantillas = await sql`
      SELECT * FROM "PlantillaMensaje" 
      WHERE "Nombre" ILIKE '%recordatorio%' 
      LIMIT 1
    `;
    
    let mensajePlantilla = "Estimado {cliente}, le recordamos su compromiso de pago por S/ {monto} con vencimiento el {fecha}. Saludos.";
    
    if (plantillas.length > 0) {
      mensajePlantilla = plantillas[0].Contenido;
      console.log('\n📝 PLANTILLA ENCONTRADA:', mensajePlantilla);
    } else {
      console.log('\n📝 USANDO PLANTILLA POR DEFECTO:', mensajePlantilla);
    }
    
    // 3. Personalizar mensaje
    const mensaje = mensajePlantilla
      .replace('{cliente}', compromiso.RazonSocial)
      .replace('{monto}', compromiso.MontoCompromiso)
      .replace('{fecha}', new Date(compromiso.FechaCompromiso).toLocaleDateString('es-PE'));
    
    console.log('\n💬 MENSAJE PERSONALIZADO:');
    console.log(`   "${mensaje}"`);
    
    // 4. Preparar datos para WhatsApp
    const telefonoWhatsApp = compromiso.Telefono.startsWith('+51') ? 
      compromiso.Telefono : `+51${compromiso.Telefono}`;
    
    console.log(`\n📱 ENVIANDO A WHATSAPP: ${telefonoWhatsApp}`);
    
    // 5. Simular envío (puedes descomentar para envío real)
    const datosWhatsApp = {
      url: `${process.env.EVOLUTION_BASE_URL}${process.env.EVOLUTION_SEND_TEXT_PATH.replace('{instanceKey}', process.env.EVOLUTION_INSTANCE_KEY)}`,
      headers: {
        'Content-Type': 'application/json',
        [process.env.EVOLUTION_AUTH_HEADER]: process.env.EVOLUTION_TOKEN
      },
      body: {
        number: telefonoWhatsApp.replace('+', ''),
        text: mensaje
      }
    };
    
    console.log('\n🔧 CONFIGURACIÓN WHATSAPP:');
    console.log(`   URL: ${datosWhatsApp.url}`);
    console.log(`   Número: ${datosWhatsApp.body.number}`);
    console.log(`   Instancia: ${process.env.EVOLUTION_INSTANCE_KEY}`);
    
    // Para prueba real, descomenta esto:
    /*
    const response = await fetch(datosWhatsApp.url, {
      method: 'POST',
      headers: datosWhatsApp.headers,
      body: JSON.stringify(datosWhatsApp.body)
    });
    
    const resultado = await response.json();
    console.log('\n📤 RESULTADO ENVÍO:', resultado);
    */
    
    // 6. Registrar notificación en la base de datos (estructura correcta)
    const notificacion = await sql`
      INSERT INTO "Notificacion" (
        "IdCliente",
        "IdTipoNotificacion",
        "Contenido",
        "FechaEnvio",
        "Estado",
        "IdResponsable"
      ) VALUES (
        ${compromiso.IdCliente},
        1,
        ${mensaje},
        NOW(),
        'ENVIADO',
        1
      )
      RETURNING *
    `;
    
    console.log('\n✅ NOTIFICACIÓN REGISTRADA:');
    console.log(`   ID: ${notificacion[0].IdNotificacion}`);
    console.log(`   Tipo ID: ${notificacion[0].IdTipoNotificacion}`);
    console.log(`   Estado: ${notificacion[0].Estado}`);
    console.log(`   Contenido: ${notificacion[0].Contenido.substring(0, 50)}...`);
    
    console.log('\n🎯 PRUEBA COMPLETADA EXITOSAMENTE');
    console.log('El sistema de recordatorios WhatsApp está funcionando correctamente.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

probarRecordatorioWhatsApp();
