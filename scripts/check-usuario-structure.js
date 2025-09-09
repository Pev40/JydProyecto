const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function checkUserStructure() {
  try {
    console.log('Estructura de la tabla Usuario:');
    const columns = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Usuario' 
      ORDER BY ordinal_position
    `;
    console.table(columns);
    
    console.log('\nEjemplo de datos Usuario:');
    const users = await sql`SELECT * FROM "Usuario" LIMIT 2`;
    console.table(users);
    
    console.log('\nEstructura de la tabla Cliente:');
    const clienteColumns = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Cliente' 
      ORDER BY ordinal_position
    `;
    console.table(clienteColumns);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkUserStructure();
