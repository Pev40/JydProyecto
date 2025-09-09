require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function migratePostgresCronogramaSunat() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('🔧 Iniciando migración de CronogramaSunat a estructura PostgreSQL...');
    
    // Verificar estructura actual
    console.log('\n📊 Estructura actual:');
    const structure = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'CronogramaSunat'
      ORDER BY ordinal_position;
    `;
    console.log(structure);
    
    // Eliminar tabla existente y recrear con estructura correcta
    console.log('\n🗑️ Eliminando tabla existente...');
    await sql`DROP TABLE IF EXISTS "CronogramaSunat"`;
    
    console.log('🔨 Creando tabla con estructura correcta...');
    await sql`
      CREATE TABLE "CronogramaSunat" (
        "IdCronograma" SERIAL PRIMARY KEY,
        "Año" INTEGER NOT NULL,
        "Mes" INTEGER NOT NULL CHECK ("Mes" >= 1 AND "Mes" <= 12),
        "DigitoRUC" INTEGER NOT NULL CHECK ("DigitoRUC" IN (0,1,2,3,4,5,6,7,8,9,99)),
        "Dia" INTEGER NOT NULL CHECK ("Dia" >= 1 AND "Dia" <= 31),
        "MesVencimiento" INTEGER NOT NULL CHECK ("MesVencimiento" >= 1 AND "MesVencimiento" <= 12),
        "FechaCreacion" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "FechaModificacion" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "UsuarioCreacion" VARCHAR(100),
        "Estado" VARCHAR(20) DEFAULT 'ACTIVO' CHECK ("Estado" IN ('ACTIVO', 'INACTIVO')),
        UNIQUE("Año", "Mes", "DigitoRUC")
      )
    `;
    
    console.log('📋 Creando índices...');
    await sql`CREATE INDEX idx_cronograma_año ON "CronogramaSunat"("Año")`;
    await sql`CREATE INDEX idx_cronograma_año_mes ON "CronogramaSunat"("Año", "Mes")`;
    await sql`CREATE INDEX idx_cronograma_digito ON "CronogramaSunat"("DigitoRUC")`;
    
    console.log('📅 Insertando cronograma 2025...');
    // Insertar cronograma base 2025
    const cronograma2025 = [
      // Enero 2025
      [2025, 1, 0, 14, 2], [2025, 1, 1, 15, 2], [2025, 1, 2, 16, 2], 
      [2025, 1, 4, 17, 2], [2025, 1, 6, 20, 2], [2025, 1, 8, 21, 2], [2025, 1, 99, 22, 2],
      // Febrero 2025
      [2025, 2, 0, 13, 3], [2025, 2, 1, 14, 3], [2025, 2, 2, 17, 3], 
      [2025, 2, 4, 18, 3], [2025, 2, 6, 19, 3], [2025, 2, 8, 20, 3], [2025, 2, 99, 21, 3],
      // Marzo 2025
      [2025, 3, 0, 14, 4], [2025, 3, 1, 17, 4], [2025, 3, 2, 18, 4], 
      [2025, 3, 4, 19, 4], [2025, 3, 6, 20, 4], [2025, 3, 8, 21, 4], [2025, 3, 99, 24, 4],
      // Abril 2025
      [2025, 4, 0, 14, 5], [2025, 4, 1, 15, 5], [2025, 4, 2, 16, 5], 
      [2025, 4, 4, 17, 5], [2025, 4, 6, 20, 5], [2025, 4, 8, 21, 5], [2025, 4, 99, 22, 5],
      // Mayo 2025
      [2025, 5, 0, 13, 6], [2025, 5, 1, 14, 6], [2025, 5, 2, 15, 6], 
      [2025, 5, 4, 16, 6], [2025, 5, 6, 19, 6], [2025, 5, 8, 20, 6], [2025, 5, 99, 21, 6],
      // Junio 2025
      [2025, 6, 0, 13, 7], [2025, 6, 1, 16, 7], [2025, 6, 2, 17, 7], 
      [2025, 6, 4, 18, 7], [2025, 6, 6, 19, 7], [2025, 6, 8, 20, 7], [2025, 6, 99, 23, 7],
      // Julio 2025
      [2025, 7, 0, 14, 8], [2025, 7, 1, 15, 8], [2025, 7, 2, 16, 8], 
      [2025, 7, 4, 17, 8], [2025, 7, 6, 18, 8], [2025, 7, 8, 21, 8], [2025, 7, 99, 22, 8],
      // Agosto 2025
      [2025, 8, 0, 13, 9], [2025, 8, 1, 14, 9], [2025, 8, 2, 15, 9], 
      [2025, 8, 4, 18, 9], [2025, 8, 6, 19, 9], [2025, 8, 8, 20, 9], [2025, 8, 99, 21, 9],
      // Septiembre 2025
      [2025, 9, 0, 15, 10], [2025, 9, 1, 16, 10], [2025, 9, 2, 17, 10], 
      [2025, 9, 4, 18, 10], [2025, 9, 6, 19, 10], [2025, 9, 8, 22, 10], [2025, 9, 99, 23, 10],
      // Octubre 2025
      [2025, 10, 0, 13, 11], [2025, 10, 1, 14, 11], [2025, 10, 2, 15, 11], 
      [2025, 10, 4, 16, 11], [2025, 10, 6, 17, 11], [2025, 10, 8, 20, 11], [2025, 10, 99, 21, 11],
      // Noviembre 2025
      [2025, 11, 0, 13, 12], [2025, 11, 1, 14, 12], [2025, 11, 2, 17, 12], 
      [2025, 11, 4, 18, 12], [2025, 11, 6, 19, 12], [2025, 11, 8, 20, 12], [2025, 11, 99, 21, 12],
      // Diciembre 2025
      [2025, 12, 0, 15, 1], [2025, 12, 1, 16, 1], [2025, 12, 2, 17, 1], 
      [2025, 12, 4, 18, 1], [2025, 12, 6, 19, 1], [2025, 12, 8, 20, 1], [2025, 12, 99, 21, 1]
    ];
    
    for (const [año, mes, digito, dia, mesVenc] of cronograma2025) {
      await sql`
        INSERT INTO "CronogramaSunat" 
        ("Año", "Mes", "DigitoRUC", "Dia", "MesVencimiento", "UsuarioCreacion", "Estado") 
        VALUES (${año}, ${mes}, ${digito}, ${dia}, ${mesVenc}, 'SISTEMA', 'ACTIVO')
      `;
    }
    
    console.log('✅ Migración completada exitosamente');
    
    // Verificar resultados
    const count = await sql`SELECT COUNT(*) as total FROM "CronogramaSunat"`;
    console.log(`📈 Total registros insertados: ${count[0].total}`);
    
    const años = await sql`
      SELECT DISTINCT "Año", COUNT(*) as registros 
      FROM "CronogramaSunat" 
      GROUP BY "Año" 
      ORDER BY "Año"
    `;
    console.log('📅 Años disponibles:');
    años.forEach(a => console.log(`  ${a.Año}: ${a.registros} registros`));
    
  } catch (error) {
    console.error('❌ Error en migración:', error);
  }
}

migratePostgresCronogramaSunat();
