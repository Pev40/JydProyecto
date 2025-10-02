### Guía para llenar datos en Excel (plantillas por tabla)

Objetivo: que un usuario sin conocimientos técnicos pueda completar un archivo Excel con varias hojas (tabs) para cargar datos reales al sistema.

Recomendaciones generales
- Formato de fecha: YYYY-MM-DD (ej. 2024-06-05). Para MesServicio use siempre el día 01 (ej. 2024-06-01).
- Números: use punto como separador decimal (ej. 500.00).
- Booleanos: use TRUE/FALSE.
- IDs: cuando se pida IdX, debe referirse al identificador real ya existente en la base (o que será insertado por otra hoja del Excel en el mismo proceso de importación).

Hojas recomendadas en el Excel
1) Carteras
2) Clientes
3) Pagos
4) DetallePagoServicio (opcional, si un pago cubre varios meses/servicios)
5) Compromisos (opcional)
6) Notificaciones (opcional)
7) ServiciosAdicionales (opcional)

Puede agregar hojas de catálogos (Bancos, Servicios, Clasificaciones, Categorías) si necesita listar o cargar sus IDs primero.

Hoja: Carteras
- Finalidad: definir carteras de clientes.
- Columnas y reglas:
  - Nombre (requerido, texto): nombre de la cartera. Ej. "Cartera Lima".
  - IdEncargado (opcional, número): Id del usuario responsable (tabla "Usuario").
  - Estado (opcional, texto): valores sugeridos ACTIVA/INACTIVA. Por defecto ACTIVA.
- Ejemplo de filas:
  - Nombre: Cartera Lima | IdEncargado: 1 | Estado: ACTIVA
  - Nombre: Cartera Morosos | IdEncargado: 3 | Estado: ACTIVA

Hoja: Clientes
- Finalidad: alta de clientes.
- Columnas y reglas:
  - RazonSocial (requerido, texto)
  - NombreContacto (opcional, texto)
  - RucDni (requerido, texto): 8 (DNI) o 11 (RUC) dígitos. El sistema calcula "UltimoDigitoRUC" automáticamente.
  - IdClasificacion (opcional, número): si omite, el sistema usa 1. Recomendado usar IDs de su tabla "Clasificacion".
  - IdCartera (opcional, número): relacione con la hoja Carteras si la cargará antes.
  - IdEncargado (opcional, número): Id del usuario responsable (tabla "Usuario").
  - IdServicio (opcional, número): Id del servicio principal (tabla "Servicio").
  - MontoFijoMensual (opcional, número): ej. 500.00. Por defecto 0.
  - AplicaMontoFijo (opcional, boolean): TRUE/FALSE. Por defecto FALSE.
  - IdCategoriaEmpresa (opcional, número): Id en tabla "CategoriaEmpresa".
  - Email (opcional, texto)
  - Telefono (opcional, texto)
  - FechaRegistro (opcional, fecha): si omite, se usa la fecha actual.
  - FechaVencimiento (opcional, fecha)
- Ejemplo de filas:
  - RazonSocial: EMPRESA ABC SAC | NombreContacto: Juan Pérez | RucDni: 20123456789 | IdClasificacion: 1 | IdCartera: 1 | IdEncargado: 1 | IdServicio: 1 | MontoFijoMensual: 500.00 | AplicaMontoFijo: TRUE | IdCategoriaEmpresa: 2 | Email: contacto@abc.com | Telefono: 999888777 | FechaRegistro: 2024-05-10 | FechaVencimiento: 

Hoja: Pagos
- Finalidad: registrar pagos (uno por fila). Si un pago cubre varios meses, complete además la hoja DetallePagoServicio.
- Columnas y reglas:
  - IdCliente (requerido, número): Id del cliente.
  - Fecha (opcional, fecha): por defecto la hora actual. Ej. 2024-06-05.
  - IdBanco (opcional, número): Id del banco (tabla "Banco").
  - Monto (requerido, número): ej. 500.00
  - Concepto (requerido, texto): ej. "Pago mensual junio".
  - MedioPago (recomendado, texto): ej. TRANSFERENCIA, EFECTIVO, YAPE, PLIN, TARJETA.
  - UrlComprobante (opcional, texto): URL pública si ya tiene el comprobante cargado.
  - MesServicio (recomendado, fecha): si el pago cubre UN mes fijo, indique el mes con día 01. Ej. 2024-06-01.
  - Estado (opcional, texto): PENDIENTE/CONFIRMADO/CANCELADO. Si incluye UrlComprobante, el sistema puede marcar CONFIRMADO automáticamente.
  - Observaciones (opcional, texto): ej. "Nro op 123456".
- Ejemplo de filas:
  - IdCliente: 1 | Fecha: 2024-06-05 | IdBanco: 1 | Monto: 500.00 | Concepto: Pago mensual junio | MedioPago: TRANSFERENCIA | UrlComprobante:  | MesServicio: 2024-06-01 | Estado: CONFIRMADO | Observaciones: Nro op 123456

Hoja: DetallePagoServicio (opcional)
- Use esta hoja cuando UN pago cubre VARIOS meses o servicios.
- Columnas y reglas (estructura base):
  - IdPago (requerido, número): Id del pago al que pertenece cada detalle.
  - MesServicio (requerido, fecha): mes cubierto (use día 01). Ej. 2024-05-01.
  - Servicio (recomendado, texto): nombre del servicio cubierto (ej. "Contabilidad").
  - Monto (requerido, número): parte del monto del pago que corresponde a ese mes/servicio.
- Campos avanzados (si su BD tiene migraciones extendidas aplicadas):
  - IdServicioAdicional (opcional, número): si el detalle está pagando un "ServicioAdicional".
  - TipoServicio (opcional, texto): FIJO/ADICIONAL.
  - PeriodoServicio (opcional, fecha): mes del servicio fijo. Similar a MesServicio.
- Ejemplo de filas:
  - IdPago: 101 | MesServicio: 2024-05-01 | Servicio: Contabilidad | Monto: 500.00
  - IdPago: 101 | MesServicio: 2024-06-01 | Servicio: Contabilidad | Monto: 500.00

Hoja: Compromisos (opcional)
- Finalidad: registrar compromisos de pago.
- Columnas y reglas:
  - IdCliente (requerido, número)
  - FechaCompromiso (requerido, fecha)
  - MontoCompromiso (requerido, número)
  - IdResponsable (opcional, número): Id de usuario.
  - Observaciones (opcional, texto)
  - Estado (opcional, texto): por defecto PENDIENTE. Valores: PENDIENTE/CONFIRMADO/CANCELADO.
- Ejemplo de filas:
  - IdCliente: 1 | FechaCompromiso: 2024-07-15 | MontoCompromiso: 800.00 | IdResponsable: 1 | Observaciones: Fraccionar en 2 cuotas | Estado: PENDIENTE

Hoja: Notificaciones (opcional)
- Finalidad: registrar envíos históricos o preparar mensajes.
- Columnas y reglas:
  - IdCliente (requerido, número)
  - IdTipoNotificacion (requerido, número): valores de catálogo (ej. 1=WhatsApp, 2=Email, 3=SMS según su tabla "TipoNotificacion").
  - Contenido (requerido, texto): puede incluir variables si luego un proceso las reemplaza.
  - IdResponsable (opcional, número)
  - Estado (opcional, texto): ENVIADO/PENDIENTE/ERROR. Si está cargando histórico, use ENVIADO.
  - FechaEnvio (opcional, fecha): si carga histórico.
- Ejemplo de filas:
  - IdCliente: 1 | IdTipoNotificacion: 1 | Contenido: Estimado {cliente}, su pago vence el {fecha}. | IdResponsable: 1 | Estado: ENVIADO | FechaEnvio: 2024-06-10

Hoja: ServiciosAdicionales (opcional)
- Finalidad: llevar servicios fuera del fijo mensual.
- Columnas y reglas:
  - IdCliente (requerido, número)
  - NombreServicio (requerido, texto)
  - Descripcion (opcional, texto)
  - Monto (requerido, número)
  - Fecha (requerido, fecha)
  - Estado (opcional, texto): PENDIENTE/FACTURADO/PAGADO/CANCELADO (por defecto FACTURADO o PENDIENTE según su script).
  - IdResponsable (opcional, número)
- Ejemplo de filas:
  - IdCliente: 1 | NombreServicio: Declaración jurada | Descripcion: DJ agosto | Monto: 200.00 | Fecha: 2024-08-05 | Estado: FACTURADO | IdResponsable: 2

Catálogos útiles (si los cargará por Excel)
- Bancos: Nombre (único).
- Servicios: Nombre (único), Descripcion.
- Clasificaciones: Codigo (A/B/C/...), Descripcion, Color.
- Categorías de empresa: Nombre (único), Descripcion.
- Usuarios (no recomendado por Excel por contraseñas): mejor crearlos desde la UI.

Lista de valores sugeridos
- Pago.Estado: PENDIENTE, CONFIRMADO, CANCELADO.
- Compromiso.Estado: PENDIENTE, CONFIRMADO, CANCELADO.
- Notificacion.Tipo: use los IDs definidos (WhatsApp, Email, SMS).
- Notificacion.Estado: ENVIADO, PENDIENTE, ERROR.
- MedioPago: TRANSFERENCIA, EFECTIVO, YAPE, PLIN, TARJETA.
- ServicioAdicional.Estado: PENDIENTE, FACTURADO, PAGADO, CANCELADO.

Validaciones recomendadas en Excel
- RucDni: longitud 8 o 11, solo números.
- Email con formato válido.
- Fechas con formato de fecha.
- Listas desplegables para Estados y MedioPago.

Orden sugerido de llenado
1) Catálogos (Bancos, Servicios, Clasificaciones, Categorías) — si necesita nuevos valores.
2) Carteras.
3) Clientes.
4) Pagos (y DetallePagoServicio si aplica).
5) Compromisos.
6) Notificaciones y ServiciosAdicionales (si aplica).

Con estas hojas y reglas, su Excel quedará listo para importación segura y consistente con el modelo de datos.


