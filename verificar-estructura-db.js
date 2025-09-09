const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function verificarEstructuraDB() {
  try {
    console.log('=== VERIFICANDO ESTRUCTURA DE BASE DE DATOS ===\n');
    
    // Listar todas las tablas
    const tablas = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('📋 TABLAS DISPONIBLES:');
    tablas.forEach((tabla, i) => {
      console.log(`   ${i+1}. ${tabla.table_name}`);
    });
    
    // Verificar estructura de tabla Cliente
    console.log('\n🔍 ESTRUCTURA TABLA CLIENTE:');
    const columnasCliente = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Cliente' 
      ORDER BY ordinal_position
    `;
    
    if (columnasCliente.length > 0) {
      columnasCliente.forEach(col => {
        console.log(`   ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
      });
    } else {
      console.log('   ❌ Tabla Cliente no encontrada');
    }
    
    // Verificar datos del cliente 4
    console.log('\n👤 DATOS CLIENTE 4:');
    const cliente4 = await sql`SELECT * FROM "Cliente" WHERE "IdCliente" = 4`;
    
    if (cliente4.length > 0) {
      console.log('   Datos encontrados:');
      Object.entries(cliente4[0]).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
    } else {
      console.log('   ❌ Cliente 4 no encontrado');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verificarEstructuraDB();
