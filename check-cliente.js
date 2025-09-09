require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function checkClienteStructure() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('🔍 Verificando estructura de la tabla Cliente...');
    
    const structure = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Cliente'
      ORDER BY ordinal_position;
    `;
    
    console.log('\n📊 Estructura de Cliente:');
    structure.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });
    
    // Verificar si hay campo relacionado con RUC
    const rucColumns = structure.filter(col => 
      col.column_name.toLowerCase().includes('ruc') || 
      col.column_name.toLowerCase().includes('digito')
    );
    
    console.log('\n🔍 Columnas relacionadas con RUC:');
    rucColumns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });
    
    // Muestra de datos
    const sample = await sql`SELECT * FROM "Cliente" LIMIT 3`;
    console.log('\n📋 Muestra de datos:');
    console.log(sample);
    
  } catch (error) {
    console.error('❌ Error verificando Cliente:', error);
  }
}

checkClienteStructure();
