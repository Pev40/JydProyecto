const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function verificarEstructuraCliente() {
  try {
    console.log('=== ESTRUCTURA TABLA CLIENTE ===');
    const estructura = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Cliente' 
      ORDER BY ordinal_position
    `;
    console.table(estructura);

    console.log('\n=== DATOS DE EJEMPLO ===');
    const datos = await sql`SELECT * FROM "Cliente" LIMIT 3`;
    console.table(datos);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

verificarEstructuraCliente();
