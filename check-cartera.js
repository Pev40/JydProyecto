require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function checkCarteraStructure() {
  try {
    console.log('Verificando estructura de la tabla Cartera...');
    
    const columns = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Cartera' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    console.log('Columnas de Cartera:');
    columns.forEach(col => {
      console.log(`${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
    });
    
    // Intentar obtener algunos registros
    console.log('\nIntentando obtener registros...');
    const records = await sql`SELECT * FROM "Cartera" LIMIT 3`;
    console.log('Registros encontrados:', records.length);
    if (records.length > 0) {
      console.log('Primer registro:', records[0]);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkCarteraStructure();
