require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function checkCronogramaSunatStructure() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('🔍 Verificando estructura de la tabla CronogramaSunat...');
    
    // Verificar estructura de la tabla
    const structure = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'CronogramaSunat'
      ORDER BY ordinal_position;
    `;
    
    console.log('\n📊 Estructura de CronogramaSunat:');
    structure.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    });
    
    // Verificar si hay datos existentes
    const count = await sql`SELECT COUNT(*) as total FROM "CronogramaSunat"`;
    console.log(`\n📈 Total registros en CronogramaSunat: ${count[0].total}`);
    
    if (count[0].total > 0) {
      const sample = await sql`
        SELECT * FROM "CronogramaSunat" 
        LIMIT 5
      `;
      console.log('\n📋 Muestra de datos:');
      console.log(sample);
    }
    
    // Verificar años disponibles
    const years = await sql`
      SELECT DISTINCT "Año" FROM "CronogramaSunat" 
      WHERE "Estado" = 'ACTIVO'
      ORDER BY "Año"
    `;
    console.log('\n📅 Años disponibles:', years.map(y => y.Año));
    
  } catch (error) {
    console.error('❌ Error verificando CronogramaSunat:', error);
  }
}

checkCronogramaSunatStructure();
