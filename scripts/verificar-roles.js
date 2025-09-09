const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function verificarRoles() {
  try {
    console.log('=== ROLES DISPONIBLES EN EL SISTEMA ===');
    const roles = await sql`SELECT * FROM "Rol" ORDER BY "IdRol"`;
    console.table(roles);

    console.log('\n=== USUARIOS Y SUS ROLES ASIGNADOS ===');
    const usuariosRoles = await sql`
      SELECT u."IdUsuario", u."NombreCompleto", u."Email", u."IdRol", r."Nombre" as "NombreRol"
      FROM "Usuario" u
      LEFT JOIN "Rol" r ON u."IdRol" = r."IdRol"
      ORDER BY u."IdUsuario"
    `;
    console.table(usuariosRoles);

    console.log('\n=== VERIFICAR ADMIN ESPECÍFICO ===');
    const adminUser = await sql`
      SELECT u."IdUsuario", u."NombreCompleto", u."Email", u."IdRol", r."Nombre" as rol
      FROM "Usuario" u
      LEFT JOIN "Rol" r ON u."IdRol" = r."IdRol"
      WHERE u."Email" = 'admin@jdconsultores.com'
    `;
    console.table(adminUser);

    console.log('\n=== PROBLEMA IDENTIFICADO ===');
    console.log('Los roles en la BD son: Administrador, Gerente, Encargado Cobranza');
    console.log('Pero el código busca roles como: ADMIN, CLIENTE');
    console.log('');
    console.log('El usuario admin@jdconsultores.com tiene rol "Administrador" (IdRol: 1)');
    console.log('Pero el código verifica user.rol === "ADMIN"');
    console.log('');
    console.log('SOLUCION: Necesitamos sincronizar los nombres de roles o ajustar las verificaciones');

    console.log('\n=== INCONSISTENCIAS EN EL CÓDIGO ===');
    console.log('auth.ts: busca user.rol === "ADMIN"');
    console.log('navigation.tsx: busca userRole === "Administrador"');
    console.log('usuarios/page.tsx: busca user.rol !== "ADMIN"');
    console.log('portal/page.tsx: busca user.rol !== "CLIENTE"');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

verificarRoles();
