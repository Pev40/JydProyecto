const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

(async () => {
  try {
    console.log('Probando la consulta completa de getClientes corregida:');
    
    const result = await sql`
      SELECT 
        c."IdCliente",
        c."RazonSocial",
        c."NombreContacto",
        c."RucDni",
        c."UltimoDigitoRUC",
        c."IdClasificacion",
        cl."Codigo" as "ClasificacionCodigo",
        cl."Descripcion" as "ClasificacionDescripcion",
        cl."Color" as "ClasificacionColor",
        c."IdCartera",
        ca."Nombre" as "CarteraNombre",
        c."IdEncargado",
        u."NombreCompleto" as "EncargadoNombre",
        c."IdServicio",
        s."Nombre" as "ServicioNombre",
        c."MontoFijoMensual",
        c."AplicaMontoFijo",
        c."IdCategoriaEmpresa",
        ce."Nombre" as "CategoriaEmpresa",
        c."FechaRegistro",
        c."FechaVencimiento",
        c."Email",
        c."Telefono",
        c."Estado",
        COALESCE(
          (SELECT SUM(cp."MontoCompromiso") 
           FROM "CompromisoPago" cp 
           WHERE cp."IdCliente" = c."IdCliente" 
           AND cp."Estado" = 'PENDIENTE'), 0
        ) as "SaldoPendiente"
      FROM "Cliente" c
      LEFT JOIN "Clasificacion" cl ON c."IdClasificacion" = cl."IdClasificacion"
      LEFT JOIN "Cartera" ca ON c."IdCartera" = ca."IdCartera"
      LEFT JOIN "Usuario" u ON c."IdEncargado" = u."IdUsuario"
      LEFT JOIN "Servicio" s ON c."IdServicio" = s."IdServicio"
      LEFT JOIN "CategoriaEmpresa" ce ON c."IdCategoriaEmpresa" = ce."IdCategoriaEmpresa"
      ORDER BY c."FechaRegistro" DESC, c."RazonSocial" ASC
      LIMIT 3
    `;
    
    console.log('Resultados:', result);
    console.log('Cantidad de resultados:', result.length);
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
})();
