-- Insertar datos iniciales

-- Clasificaciones
INSERT INTO "Clasificacion" ("Codigo", "Descripcion", "Color") VALUES
('A', 'Cliente al día', 'green'),
('B', 'Cliente con deuda 1-2 meses', 'orange'),
('C', 'Cliente moroso +3 meses', 'red');

-- Categorías de empresa
INSERT INTO "CategoriaEmpresa" ("Nombre", "Descripcion") VALUES
('Grande', 'Empresas que facturan más de 100k mensual'),
('Mediana', 'Empresas que facturan de 50k a 100k mensual'),
('Pequeña', 'Empresas que facturan menos de 50k mensual');

-- Bancos
INSERT INTO "Banco" ("Nombre") VALUES
('BCP'),
('BBVA'),
('Interbank'),
('Scotiabank'),
('BanBif'),
('Yape'),
('Plin');

-- Servicios
INSERT INTO "Servicio" ("Nombre", "Descripcion") VALUES
('Contabilidad', 'Servicios de contabilidad general'),
('Consultoría Tributaria', 'Asesoría en temas tributarios'),
('Auditoría', 'Servicios de auditoría'),
('Consultoría Empresarial', 'Asesoría empresarial integral');

-- Roles
INSERT INTO "Rol" ("Nombre", "Descripcion") VALUES
('Administrador', 'Acceso completo al sistema'),
('Gerente', 'Acceso a reportes y supervisión'),
('Encargado Cobranza', 'Gestión de cobranza y clientes');

-- Tipos de notificación
INSERT INTO "TipoNotificacion" ("Nombre", "Descripcion") VALUES
('WhatsApp', 'Notificación por WhatsApp'),
('Email', 'Notificación por correo electrónico'),
('SMS', 'Notificación por mensaje de texto');

-- Cronograma SUNAT 2024
INSERT INTO "CronogramaSunat" ("UltimoDigito", "Anio", "FechaVencimiento") VALUES
(0, 2024, '2024-01-12'),
(1, 2024, '2024-01-15'),
(2, 2024, '2024-01-16'),
(3, 2024, '2024-01-17'),
(4, 2024, '2024-01-18'),
(5, 2024, '2024-01-19'),
(6, 2024, '2024-01-22'),
(7, 2024, '2024-01-23'),
(8, 2024, '2024-01-24'),
(9, 2024, '2024-01-25');

-- Usuario administrador inicial
INSERT INTO "Usuario" ("NombreCompleto", "Username", "HashContrasena", "IdRol", "Email") VALUES
('Wilson David Burgos Rios', 'admin', '$2b$10$rOzJqQqQqQqQqQqQqQqQqO', 1, 'admin@jdconsultores.com'),
('Rosa Administradora', 'rosa', '$2b$10$rOzJqQqQqQqQqQqQqQqQqO', 1, 'rosa@jdconsultores.com'),
('Lucero Administradora', 'lucero', '$2b$10$rOzJqQqQqQqQqQqQqQqQqO', 1, 'lucero@jdconsultores.com');

-- Carteras
INSERT INTO "Cartera" ("Nombre", "IdEncargado") VALUES
('Cartera Arequipa', 1),
('Cartera Trujillo', 2),
('Cartera Morosos', 3);

-- Plantillas de mensajes
INSERT INTO "PlantillaMensaje" ("IdClasificacion", "Nombre", "Contenido") VALUES
(1, 'Recordatorio Cliente A', 'Estimado {cliente}, le recordamos que su pago de {monto} vence el {fecha}. Gracias por su puntualidad.'),
(2, 'Recordatorio Cliente B', 'Estimado {cliente}, tiene una deuda pendiente de {monto}. Por favor regularice su situación a la brevedad.'),
(3, 'Recordatorio Cliente C', 'Estimado {cliente}, su cuenta presenta una deuda vencida de {monto}. Comuníquese urgentemente para evitar el corte del servicio.');

-- Clientes de ejemplo
INSERT INTO "Cliente" ("RazonSocial", "NombreContacto", "RucDni", "UltimoDigitoRUC", "IdClasificacion", "IdCartera", "IdEncargado", "IdServicio", "MontoFijoMensual", "AplicaMontoFijo", "IdCategoriaEmpresa", "Email", "Telefono") VALUES
('EMPRESA DEMO SAC', 'Juan Pérez', '20123456780', 0, 1, 1, 1, 1, 500.00, true, 2, 'juan@empresademo.com', '987654321'),
('CONSULTORA ABC EIRL', 'María García', '20987654321', 1, 2, 1, 1, 2, 800.00, true, 1, 'maria@abc.com', '987654322'),
('SERVICIOS XYZ SRL', 'Carlos López', '20456789012', 2, 3, 2, 2, 1, 300.00, true, 3, 'carlos@xyz.com', '987654323');
