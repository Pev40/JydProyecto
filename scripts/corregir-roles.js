const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function corregirRoles() {
  try {
    console.log('=== CORRIGIENDO SISTEMA DE ROLES ===');

    // 1. Agregar rol CLIENTE si no existe
    console.log('\n1. Agregando rol CLIENTE...');
    await sql`
      INSERT INTO "Rol" ("Nombre", "Descripcion")
      SELECT 'CLIENTE', 'Acceso al portal de cliente'
      WHERE NOT EXISTS (
        SELECT 1 FROM "Rol" WHERE "Nombre" = 'CLIENTE'
      )
    `;

    // 2. Actualizar nombres de roles para consistencia
    console.log('2. Actualizando nombres de roles...');
    await sql`UPDATE "Rol" SET "Nombre" = 'ADMIN' WHERE "Nombre" = 'Administrador'`;
    await sql`UPDATE "Rol" SET "Nombre" = 'EMPLOYEE' WHERE "Nombre" = 'Encargado Cobranza'`;
    await sql`UPDATE "Rol" SET "Nombre" = 'MANAGER' WHERE "Nombre" = 'Gerente'`;

    // 3. Corregir el usuario cliente que tiene rol incorrecto
    console.log('3. Corrigiendo usuario cliente...');
    const rolCliente = await sql`SELECT "IdRol" FROM "Rol" WHERE "Nombre" = 'CLIENTE'`;
    if (rolCliente.length > 0) {
      await sql`
        UPDATE "Usuario" 
        SET "IdRol" = ${rolCliente[0].IdRol}
        WHERE "Email" = 'cliente@empresa.com'
      `;
    }

    // 4. Verificar cambios
    console.log('\n=== VERIFICANDO CAMBIOS ===');
    const rolesActualizados = await sql`SELECT * FROM "Rol" ORDER BY "IdRol"`;
    console.table(rolesActualizados);

    const usuariosActualizados = await sql`
      SELECT u."IdUsuario", u."NombreCompleto", u."Email", r."Nombre" as "Rol"
      FROM "Usuario" u
      LEFT JOIN "Rol" r ON u."IdRol" = r."IdRol"
      ORDER BY u."IdUsuario"
    `;
    console.table(usuariosActualizados);

    console.log('\n✅ Roles corregidos exitosamente');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

corregirRoles();
