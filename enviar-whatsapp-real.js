const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function enviarRecordatorioRealWhatsApp() {
  try {
    console.log('=== ENVIANDO RECORDATORIO REAL POR WHATSAPP ===\n');
    
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
    console.log('📋 COMPROMISO:');
    console.log(`   Cliente: ${compromiso.RazonSocial}`);
    console.log(`   Teléfono: ${compromiso.Telefono}`);
    console.log(`   Fecha: ${new Date(compromiso.FechaCompromiso).toLocaleDateString('es-PE')}`);
    console.log(`   Monto: S/ ${compromiso.MontoCompromiso}`);
    
    // 2. Obtener plantilla
    const plantillas = await sql`
      SELECT * FROM "PlantillaMensaje" 
      WHERE "Nombre" ILIKE '%recordatorio%' 
      LIMIT 1
    `;
    
    const mensajePlantilla = plantillas[0]?.Contenido || 
      "Estimado/a {cliente}, le recordamos su compromiso de pago por S/ {monto} con vencimiento el {fecha}. Saludos.";
    
    // 3. Personalizar mensaje
    const mensaje = mensajePlantilla
      .replace('{cliente}', compromiso.RazonSocial)
      .replace('{monto}', compromiso.MontoCompromiso)
      .replace('{fecha}', new Date(compromiso.FechaCompromiso).toLocaleDateString('es-PE'));
    
    console.log('\n💬 MENSAJE:', mensaje);
    
    // 4. Preparar datos para WhatsApp
    const telefonoWhatsApp = compromiso.Telefono.startsWith('+51') ? 
      compromiso.Telefono : `+51${compromiso.Telefono}`;
    
    const numeroSinMas = telefonoWhatsApp.replace('+', '');
    
    console.log(`\n📱 ENVIANDO A: ${telefonoWhatsApp} (${numeroSinMas})`);
    
    // 5. ENVÍO REAL POR WHATSAPP
    const url = `${process.env.EVOLUTION_BASE_URL}${process.env.EVOLUTION_SEND_TEXT_PATH.replace('{instanceKey}', process.env.EVOLUTION_INSTANCE_KEY)}`;
    
    const datosEnvio = {
      number: numeroSinMas,
      text: mensaje
    };
    
    console.log('\n🚀 ENVIANDO...');
    console.log(`   URL: ${url}`);
    console.log(`   Datos:`, datosEnvio);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [process.env.EVOLUTION_AUTH_HEADER]: process.env.EVOLUTION_TOKEN
      },
      body: JSON.stringify(datosEnvio)
    });
    
    const resultado = await response.json();
    
    console.log('\n📤 RESULTADO EVOLUTION API:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, resultado);
    
    let estadoEnvio = 'ERROR';
    let detalleEnvio = 'Error en envío';
    
    if (response.ok && resultado) {
      if (resultado.key || resultado.message || resultado.success !== false) {
        estadoEnvio = 'ENVIADO';
        detalleEnvio = 'Enviado exitosamente';
        console.log('✅ MENSAJE ENVIADO EXITOSAMENTE');
      } else {
        detalleEnvio = resultado.message || 'Error desconocido';
        console.log('❌ ERROR EN ENVÍO:', detalleEnvio);
      }
    } else {
      detalleEnvio = `HTTP ${response.status}: ${resultado?.message || 'Error de conexión'}`;
      console.log('❌ ERROR HTTP:', detalleEnvio);
    }
    
    // 6. Actualizar base de datos con resultado real
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
        ${mensaje + ' [RESULTADO: ' + detalleEnvio + ']'},
        NOW(),
        ${estadoEnvio},
        1
      )
      RETURNING *
    `;
    
    console.log('\n💾 GUARDADO EN BD:');
    console.log(`   ID Notificación: ${notificacion[0].IdNotificacion}`);
    console.log(`   Estado: ${notificacion[0].Estado}`);
    
    console.log('\n🎯 PRUEBA COMPLETA FINALIZADA');
    console.log(`Estado final: ${estadoEnvio}`);
    console.log(`Detalle: ${detalleEnvio}`);
    
  } catch (error) {
    console.error('❌ Error general:', error);
    
    // Registrar error en BD
    try {
      await sql`
        INSERT INTO "Notificacion" (
          "IdCliente",
          "IdTipoNotificacion", 
          "Contenido",
          "FechaEnvio",
          "Estado",
          "IdResponsable"
        ) VALUES (
          4,
          1,
          ${'Error en envío: ' + error.message},
          NOW(),
          'ERROR',
          1
        )
      `;
    } catch (e) {
      console.error('Error guardando error:', e);
    }
  }
}

enviarRecordatorioRealWhatsApp();
