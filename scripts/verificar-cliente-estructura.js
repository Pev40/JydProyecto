const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function verificarCliente() {
  try {
    console.log('=== VERIFICAR TABLA CLIENTE ===');
    const clientes = await sql`SELECT * FROM "Cliente" LIMIT 1`;
    
    if (clientes.length > 0) {
      console.log('Columnas de Cliente:');
      console.log(Object.keys(clientes[0]));
      console.log('\nPrimer cliente:');
      console.table(clientes);
    } else {
      console.log('No hay clientes en la tabla');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

verificarCliente();
