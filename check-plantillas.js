require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function testQuery() {
  try {
    console.log('Probando la consulta corregida...');
    
    const result = await sql`
      SELECT 
        pm."IdPlantillaMensaje",
        pm."Nombre",
        pm."Contenido",
        pm."IdClasificacion",
        c."Descripcion" as "ClasificacionNombre"
      FROM "PlantillaMensaje" pm
      LEFT JOIN "Clasificacion" c ON pm."IdClasificacion" = c."IdClasificacion"
      ORDER BY pm."Nombre"
    `;
    
    console.log('Consulta exitosa. Registros encontrados:', result.length);
    if (result.length > 0) {
      console.log('Primer registro:', result[0]);
    } else {
      console.log('No hay plantillas de mensajes en la base de datos.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testQuery();
