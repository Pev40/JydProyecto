-- Crear tabla de roles
CREATE TABLE IF NOT EXISTS Roles (
    IdRol SERIAL PRIMARY KEY,
    NombreRol VARCHAR(50) UNIQUE NOT NULL,
    Descripcion TEXT,
    FechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de permisos
CREATE TABLE IF NOT EXISTS Permisos (
    IdPermiso SERIAL PRIMARY KEY,
    NombrePermiso VARCHAR(100) UNIQUE NOT NULL,
    Descripcion TEXT,
    Modulo VARCHAR(50),
    FechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de relación roles-permisos
CREATE TABLE IF NOT EXISTS RolPermisos (
    IdRol INTEGER REFERENCES Roles(IdRol) ON DELETE CASCADE,
    IdPermiso INTEGER REFERENCES Permisos(IdPermiso) ON DELETE CASCADE,
    PRIMARY KEY (IdRol, IdPermiso)
);

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS Usuarios (
    IdUsuario SERIAL PRIMARY KEY,
    Email VARCHAR(255) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    Nombre VARCHAR(255) NOT NULL,
    IdRol INTEGER REFERENCES Roles(IdRol),
    IdCliente INTEGER REFERENCES Clientes(IdCliente),
    Activo BOOLEAN DEFAULT true,
    UltimoAcceso TIMESTAMP,
    FechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FechaActualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar roles básicos
INSERT INTO Roles (NombreRol, Descripcion) VALUES 
('ADMIN', 'Administrador del sistema con acceso completo'),
('EMPLEADO', 'Empleado con acceso limitado a funciones operativas'),
('CLIENTE', 'Cliente con acceso solo a su portal personal')
ON CONFLICT (NombreRol) DO NOTHING;

-- Insertar permisos
INSERT INTO Permisos (NombrePermiso, Descripcion, Modulo) VALUES 
('CLIENTES_VER', 'Ver lista de clientes', 'CLIENTES'),
('CLIENTES_CREAR', 'Crear nuevos clientes', 'CLIENTES'),
('CLIENTES_EDITAR', 'Editar información de clientes', 'CLIENTES'),
('CLIENTES_ELIMINAR', 'Eliminar clientes', 'CLIENTES'),
('PAGOS_VER', 'Ver pagos', 'PAGOS'),
('PAGOS_CREAR', 'Registrar pagos', 'PAGOS'),
('PAGOS_EDITAR', 'Editar pagos', 'PAGOS'),
('REPORTES_VER', 'Ver reportes', 'REPORTES'),
('REPORTES_EXPORTAR', 'Exportar reportes', 'REPORTES'),
('NOTIFICACIONES_ENVIAR', 'Enviar notificaciones', 'NOTIFICACIONES'),
('COMPROMISOS_GESTIONAR', 'Gestionar compromisos', 'COMPROMISOS'),
('USUARIOS_GESTIONAR', 'Gestionar usuarios', 'USUARIOS'),
('CONFIGURACION_ACCEDER', 'Acceder a configuración', 'CONFIGURACION'),
('PORTAL_CLIENTE', 'Acceso al portal del cliente', 'PORTAL')
ON CONFLICT (NombrePermiso) DO NOTHING;

-- Asignar permisos a roles
-- ADMIN: todos los permisos
INSERT INTO RolPermisos (IdRol, IdPermiso)
SELECT r.IdRol, p.IdPermiso
FROM Roles r, Permisos p
WHERE r.NombreRol = 'ADMIN'
ON CONFLICT DO NOTHING;

-- EMPLEADO: permisos operativos
INSERT INTO RolPermisos (IdRol, IdPermiso)
SELECT r.IdRol, p.IdPermiso
FROM Roles r, Permisos p
WHERE r.NombreRol = 'EMPLEADO' 
AND p.NombrePermiso IN (
    'CLIENTES_VER', 'CLIENTES_CREAR', 'CLIENTES_EDITAR',
    'PAGOS_VER', 'PAGOS_CREAR', 'PAGOS_EDITAR',
    'REPORTES_VER', 'NOTIFICACIONES_ENVIAR', 'COMPROMISOS_GESTIONAR'
)
ON CONFLICT DO NOTHING;

-- CLIENTE: solo portal
INSERT INTO RolPermisos (IdRol, IdPermiso)
SELECT r.IdRol, p.IdPermiso
FROM Roles r, Permisos p
WHERE r.NombreRol = 'CLIENTE' 
AND p.NombrePermiso = 'PORTAL_CLIENTE'
ON CONFLICT DO NOTHING;

-- Crear usuario administrador por defecto
INSERT INTO Usuarios (Email, Password, Nombre, IdRol)
SELECT 
    'admin@jdconsultores.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password
    'Administrador',
    r.IdRol
FROM Roles r
WHERE r.NombreRol = 'ADMIN'
ON CONFLICT (Email) DO NOTHING;

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON Usuarios(Email);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON Usuarios(Activo);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON Usuarios(IdRol);
