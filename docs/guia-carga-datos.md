### Guía para cargar datos reales en el Sistema de Cobranza (paso a paso)

Esta guía explica, para un usuario sin conocimiento técnico, cómo preparar la base de datos, configurar la app y subir datos reales (catálogos, clientes, usuarios, pagos, compromisos, notificaciones y comprobantes).

## 1) Requisitos previos
- **Base de datos**: PostgreSQL en Neon (recomendado) con `DATABASE_URL` accesible.
- **Node.js 18+** para ejecutar scripts y correr la app.
- (Opcional) **AWS S3** si desea subir comprobantes de pago a la nube.

Variables de entorno mínimas en `.env`:
```env
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# Solo si usará S3 para comprobantes
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxxx
AWS_SECRET_ACCESS_KEY=xxxx
AWS_S3_BUCKET_NAME=mi-bucket-comprobantes
```

## 2) Crear/actualizar la base de datos
Ejecute los scripts SQL incluidos en `scripts/` en este orden recomendado:

1. `01-create-database.sql`  Crea toda la estructura base (tablas y claves foráneas)
2. `02-seed-data.sql`        Inserta catálogos iniciales (clasificaciones, bancos, servicios, etc.)
3. `03-add-detalle-pago-servicio.sql` Añade detalle de pagos por servicio y Observaciones en pagos
4. `16-create-servicio-adicional.sql` Crea tabla de servicios adicionales e índices
5. (Opcional) `10-cronograma-sunat-anual.sql` Si desea cronogramas por año (alternativo a los datos base)
6. (Opcional) `14-migrar-estructura-pagos.sql` Garantiza estructura extendida para pagos/detalles
7. (Opcional) `18-crear-vistas-reportes.sql` o `18-crear-vistas-reportes-v2.sql` si usará reportes avanzados

Formas de ejecutar:

- Desde la consola de Neon: pegue el contenido de cada archivo y ejecútelo.
- Desde el proyecto con el script de ayuda:
```bash
node scripts/run-sql.js 01-create-database.sql
node scripts/run-sql.js 02-seed-data.sql
node scripts/run-sql.js 03-add-detalle-pago-servicio.sql
node scripts/run-sql.js 16-create-servicio-adicional.sql
```

Notas importantes:
- La aplicación usa tablas entre comillas como "Cliente", "Pago", "Usuario", "Rol" (creadas por `01-create-database.sql`).
- Los scripts `04-auth-system.sql` y `12-create-usuarios.sql` definen tablas alternativas (`Usuarios`, `Roles`); no son requeridos para el flujo principal. Úselos solo si sabe por qué los necesita.

## 3) Catálogos mínimos (si no usó `02-seed-data.sql`)
Si prefiere cargar catálogos reales, puede hacerlo por SQL o con COPY (CSV). Campos mínimos:

- `Clasificacion`: Codigo (A/B/C/...), Descripcion, Color
- `CategoriaEmpresa`: Nombre, Descripcion
- `Banco`: Nombre
- `Servicio`: Nombre, Descripcion
- (Opcional) `Cartera`: Nombre, IdEncargado

Ejemplo CSV para bancos:
```csv
Nombre
BCP
BBVA
Interbank
```
Carga por COPY (ejecutar en Neon):
```sql
-- Ajuste la ruta al CSV accesible por su cliente SQL
COPY "Banco" ("Nombre") FROM STDIN WITH (FORMAT csv, HEADER true);
```

## 4) Cargar clientes
Puede cargar clientes por la interfaz o por SQL/CSV.

Rutas UI:
- Dashboard → Acciones rápidas → "Nuevo Cliente" o Menú → Clientes → "Nuevo"

Campos clave en "Cliente":
- RazonSocial (requerido)
- RucDni (requerido, único) → el sistema calcula `UltimoDigitoRUC`
- IdClasificacion (opcional, por defecto 1)
- IdCartera, IdEncargado, IdServicio (opcionales)
- MontoFijoMensual, AplicaMontoFijo (opcional)
- IdCategoriaEmpresa (opcional), Email, Telefono

Plantilla CSV sugerida:
```csv
RazonSocial,NombreContacto,RucDni,IdClasificacion,IdCartera,IdEncargado,IdServicio,MontoFijoMensual,AplicaMontoFijo,IdCategoriaEmpresa,Email,Telefono
EMPRESA ABC SAC,Juan Perez,20123456789,1,1,1,1,500.00,true,2,contacto@abc.com,999888777
```

Inserción por SQL (calculando `UltimoDigitoRUC`):
```sql
INSERT INTO "Cliente" (
  "RazonSocial","NombreContacto","RucDni","UltimoDigitoRUC",
  "IdClasificacion","IdCartera","IdEncargado","IdServicio",
  "MontoFijoMensual","AplicaMontoFijo","IdCategoriaEmpresa","Email","Telefono"
)
SELECT
  RazonSocial, NombreContacto, RucDni,
  RIGHT(RucDni,1)::smallint AS UltimoDigitoRUC,
  IdClasificacion, IdCartera, IdEncargado, IdServicio,
  MontoFijoMensual, AplicaMontoFijo, IdCategoriaEmpresa, Email, Telefono
FROM staging_clientes; -- tabla temporal que usted cargó vía CSV
```

## 5) Crear usuarios internos (equipo)
UI: Menú → Usuarios → "Nuevo" (requiere rol ADMIN).

Tabla usada por la app: "Usuario" con campos:
- NombreCompleto, Username, HashContrasena, IdRol, Estado, Email

Recomendación:
- Use la UI para validar y hashear contraseñas automáticamente.
- Roles existentes del seed: "Administrador", "Gerente", "Encargado Cobranza" (tabla "Rol").

## 6) Cargar pagos históricos
UI: Dashboard → "Registrar Pago" o Menú → Pagos → "Nuevo".

Tabla "Pago" (mínimos):
- IdCliente (FK), Fecha (auto si omite), IdBanco, Monto, Concepto, MedioPago, MesServicio, Estado, UrlComprobante (opcional), Observaciones (opcional)

Casos:
- Un pago cubre UN mes fijo: inserte un registro en "Pago" con `MesServicio` del mes que cubre.
- Un pago cubre VARIOS meses: por UI, seleccione meses y el sistema creará detalle en "DetallePagoServicio" automáticamente. Por carga masiva SQL, inserte en "Pago" y luego cree varias filas en "DetallePagoServicio" referenciando el `IdPago`.

CSV (pagos simples, un mes por fila):
```csv
IdCliente,Fecha,IdBanco,Monto,Concepto,MedioPago,MesServicio,Estado,UrlComprobante,Observaciones
1,2024-06-05,1,500.00,"Pago mensual junio","TRANSFERENCIA",2024-06-01,CONFIRMADO,,"Nro op 123456"
```

Detalle de pagos por servicio (si un pago cubre varios meses o servicios):
```csv
IdPago,MesServicio,Servicio,Monto
101,2024-05-01,"Contabilidad",500.00
101,2024-06-01,"Contabilidad",500.00
```

## 7) Compromisos de pago
UI: Cliente → Compromisos → "Nuevo" o Menú → Compromisos → "Nuevo".

Tabla "CompromisoPago": IdCliente, FechaCompromiso, MontoCompromiso, IdResponsable, Observaciones, Estado (por defecto PENDIENTE).

CSV:
```csv
IdCliente,FechaCompromiso,MontoCompromiso,IdResponsable,Observaciones,Estado
1,2024-07-15,800.00,1,"Fraccionar en 2 cuotas",PENDIENTE
```

## 8) Notificaciones históricas (opcional)
UI: Menú → Notificaciones → "Enviar".

Tabla "Notificacion": IdCliente, IdTipoNotificacion (WhatsApp/Email/SMS), Contenido, IdResponsable, Estado.

Para registro histórico, puede insertar con Estado = 'ENVIADO' y fecha manual en `FechaEnvio`.

## 9) Servicios adicionales (opcional)
Tabla "ServicioAdicional": IdCliente, NombreServicio, Descripcion, Monto, Fecha, Estado.
- Si un pago los cubre, añada filas en "DetallePagoServicio" con `IdServicioAdicional`.

## 10) Comprobantes (S3) y archivos
Opciones:
1) Ya tiene URLs públicas de comprobantes → complete `UrlComprobante` en la fila de "Pago".
2) Subir archivos a S3 desde la app (UI) → el formulario llama al endpoint `/api/upload` y guarda la URL.
3) Subir por API (carga masiva):
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@./mi-comprobante.pdf" \
  -F "type=comprobantes"
```
Requiere variables de AWS configuradas.

## 11) Verificación y control de calidad
- Verificar conexión: GET `/api/database/status` debe responder `connected: true`.
- Dashboard muestra KPIs; revise Clientes, Pagos y Notificaciones.
- SQL útiles:
```sql
SELECT COUNT(*) FROM "Cliente";
SELECT COUNT(*) FROM "Pago" WHERE "Estado"='CONFIRMADO';
SELECT * FROM "Pago" ORDER BY "Fecha" DESC LIMIT 5;
```

## 12) Buenas prácticas y consideraciones
- Respete unicidad de `RucDni` en "Cliente" y `Email` en "Usuario".
- Cargue primero catálogos y usuarios, luego clientes, y al final pagos/compromisos.
- Guarde respaldos (export CSV/SQL) antes de cargas masivas.
- Para pagos que abarcan varios meses, use detalle por servicio para análisis correcto.

## 13) Mapa de entidades y relaciones (resumen)
- "Cliente" se relaciona con: "Clasificacion", "Cartera", "Usuario" (IdEncargado), "Servicio", "CategoriaEmpresa".
- "Pago" referencia a "Cliente" y "Banco"; puede tener muchos "DetallePagoServicio".
- "CompromisoPago" referencia a "Cliente" y "Usuario" (IdResponsable).
- "Notificacion" referencia a "Cliente", "TipoNotificacion" y "Usuario" (IdResponsable).
- "ServicioAdicional" referencia a "Cliente" y opcionalmente se vincula en "DetallePagoServicio".

## 14) Flujo sugerido para un usuario nuevo (sin conocimientos)
1. Cree una cuenta en Neon y obtenga su `DATABASE_URL`.
2. En el proyecto, cree `.env` y pegue `DATABASE_URL`.
3. Ejecute los scripts: `01`, `02`, `03` y `16` (en ese orden).
4. Inicie la app: `pnpm dev` o `npm run dev` y abra `http://localhost:3000`.
5. Vaya a Usuarios y cree usuarios del equipo.
6. Vaya a Catálogos si desea agregar/ajustar bancos/servicios.
7. Cargue Clientes (por UI o por SQL/CSV según su volumen).
8. Registre Pagos (por UI). Si son históricos, puede importarlos por SQL/CSV.
9. Opcional: registre Compromisos y Notificaciones.
10. Si usará comprobantes, configure AWS y suba archivos desde la UI o por API.

Con esto, la base queda lista con datos reales y el sistema operativo para el día a día.


