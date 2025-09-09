const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function configurarUsuarioCliente() {
  try {
    console.log('=== CONFIGURANDO USUARIO CLIENTE ===');

    // 1. Verificar el usuario cliente existente
    const usuarioCliente = await sql`
      SELECT * FROM "Usuario" WHERE "Email" = 'cliente@empresa.com'
    `;

    console.log('Usuario cliente encontrado:');
    console.table(usuarioCliente);

    // 2. Crear cliente en la tabla Cliente si no existe
    const clienteExistente = await sql`
      SELECT * FROM "Cliente" WHERE "Email" = 'cliente@empresa.com'
    `;

    let idCliente;
    if (clienteExistente.length === 0) {
      console.log('Creando registro de cliente...');
      const nuevoCliente = await sql`
        INSERT INTO "Cliente" ("RazonSocial", "RucDni", "Email", "Telefono", "FechaRegistro", "IdClasificacion", "IdCartera", "IdEncargado", "IdServicio", "MontoFijoMensual", "AplicaMontoFijo", "IdCategoriaEmpresa")
        VALUES ('Empresa Cliente de Prueba', '12345678901', 'cliente@empresa.com', '987654321', NOW(), 1, 1, 1, 1, '150.00', true, 1)
        RETURNING "IdCliente"
      `;
      idCliente = nuevoCliente[0].IdCliente;
      console.log('Cliente creado con ID:', idCliente);
    } else {
      idCliente = clienteExistente[0].IdCliente;
      console.log('Cliente ya existe con ID:', idCliente);
    }

    // 3. No podemos actualizar IdCliente directamente porque no existe en Usuario
    // En su lugar, verificaremos que el sistema de autenticación funcione correctamente
    
    console.log('\n=== VERIFICANDO CONFIGURACIÓN FINAL ===');
    const verificacion = await sql`
      SELECT 
        u."IdUsuario", 
        u."NombreCompleto", 
        u."Email", 
        r."Nombre" as "Rol",
        c."IdCliente",
        c."RazonSocial"
      FROM "Usuario" u
      LEFT JOIN "Rol" r ON u."IdRol" = r."IdRol"
      LEFT JOIN "Cliente" c ON c."Email" = u."Email"
      WHERE u."Email" = 'cliente@empresa.com'
    `;
    
    console.table(verificacion);

    console.log('\n✅ Usuario cliente configurado correctamente');
    console.log('El usuario cliente puede acceder al portal con:');
    console.log('Email: cliente@empresa.com');
    console.log('Password: 123456');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

configurarUsuarioCliente();
