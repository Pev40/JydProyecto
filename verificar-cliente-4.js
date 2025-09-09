const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function verificarCliente4() {
  try {
    console.log('=== VERIFICANDO CLIENTE 4 ===\n');
    
    // Verificar datos del cliente 4
    const cliente = await sql`SELECT * FROM "Cliente" WHERE "IdCliente" = 4`;
    
    if (cliente.length === 0) {
      console.log('❌ Cliente 4 no encontrado');
      return;
    }
    
    const clienteData = cliente[0];
    console.log('📋 DATOS DEL CLIENTE:');
    console.log(`   Razón Social: ${clienteData.RazonSocial}`);
    console.log(`   Nombre Contacto: ${clienteData.NombreContacto}`);
    console.log(`   RUC/DNI: ${clienteData.RucDni}`);
    console.log(`   Teléfono: ${clienteData.Telefono}`);
    console.log(`   Email: ${clienteData.Email}`);
    console.log(`   Monto Fijo Mensual: S/ ${clienteData.MontoFijoMensual}`);
    console.log(`   Último Dígito RUC: ${clienteData.UltimoDigitoRUC}`);
    
    // Verificar compromisos pendientes
    const compromisos = await sql`
      SELECT * FROM "CompromisoPago" 
      WHERE "IdCliente" = 4 AND "Estado" = 'Pendiente'
      ORDER BY "FechaCompromiso" DESC
    `;
    
    console.log('\n💼 COMPROMISOS PENDIENTES:');
    console.log(`   Total: ${compromisos.length}`);
    
    if (compromisos.length > 0) {
      compromisos.forEach((c, i) => {
        const fecha = new Date(c.FechaCompromiso).toLocaleDateString('es-PE');
        console.log(`   ${i+1}. ID: ${c.IdCompromiso} | Fecha: ${fecha} | Monto: S/ ${c.MontoCompromiso}`);
      });
    } else {
      console.log('   ℹ️  No hay compromisos pendientes');
    }
    
    // Verificar notificaciones recientes
    const notificaciones = await sql`
      SELECT * FROM "Notificacion"
      WHERE "IdCliente" = 4
      ORDER BY "FechaEnvio" DESC
      LIMIT 5
    `;
    
    console.log('\n📢 NOTIFICACIONES RECIENTES:');
    console.log(`   Total: ${notificaciones.length}`);
    
    if (notificaciones.length > 0) {
      notificaciones.forEach((n, i) => {
        const fecha = new Date(n.FechaEnvio).toLocaleString('es-PE');
        console.log(`   ${i+1}. ${n.TipoNotificacion} | ${fecha} | Estado: ${n.EstadoEnvio}`);
      });
    } else {
      console.log('   ℹ️  No hay notificaciones');
    }
    
    console.log('\n✅ Verificación completada\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verificarCliente4();
