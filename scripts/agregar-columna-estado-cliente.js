const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function agregarColumnaEstadoCliente() {
  try {
    console.log('=== AGREGANDO COLUMNA ESTADO A TABLA CLIENTE ===');

    // 1. Agregar la columna Estado
    console.log('1. Agregando columna Estado...');
    await sql`
      ALTER TABLE "Cliente" 
      ADD COLUMN IF NOT EXISTS "Estado" VARCHAR(20) DEFAULT 'ACTIVO'
    `;

    // 2. Actualizar todos los clientes existentes a ACTIVO
    console.log('2. Actualizando clientes existentes a ACTIVO...');
    await sql`
      UPDATE "Cliente" 
      SET "Estado" = 'ACTIVO' 
      WHERE "Estado" IS NULL
    `;

    // 3. Agregar constraint para validar valores
    console.log('3. Agregando constraint para validar valores...');
    try {
      await sql`
        ALTER TABLE "Cliente" 
        ADD CONSTRAINT "chk_cliente_estado" 
        CHECK ("Estado" IN ('ACTIVO', 'INACTIVO'))
      `;
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
      console.log('   - Constraint ya existe, continuando...');
    }

    // 4. Verificar cambios
    console.log('\n=== VERIFICANDO CAMBIOS ===');
    const estructura = await sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'Cliente' AND column_name = 'Estado'
    `;
    console.table(estructura);

    const clientesConEstado = await sql`
      SELECT "IdCliente", "RazonSocial", "Estado", "FechaRegistro"
      FROM "Cliente" 
      ORDER BY "IdCliente" 
      LIMIT 5
    `;
    console.table(clientesConEstado);

    console.log('\n✅ Columna Estado agregada exitosamente');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

agregarColumnaEstadoCliente();
