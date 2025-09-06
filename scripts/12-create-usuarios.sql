-- Crear tabla Usuarios si no existe (estándar usado por la app)
CREATE TABLE IF NOT EXISTS Usuarios (
    IdUsuario SERIAL PRIMARY KEY,
    Email VARCHAR(255) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    Nombre VARCHAR(255) NOT NULL,
    IdRol INTEGER REFERENCES Roles(IdRol),
    IdCliente INTEGER REFERENCES "Cliente"("IdCliente"),
    Activo BOOLEAN DEFAULT true,
    UltimoAcceso TIMESTAMP,
    FechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FechaActualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON Usuarios(Email);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON Usuarios(Activo);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON Usuarios(IdRol);

-- Usuario administrador por defecto (password = "password")
INSERT INTO Usuarios (Email, Password, Nombre, IdRol)
SELECT 
    'admin@jdconsultores.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- bcrypt("password")
    'Administrador',
    r.IdRol
FROM Roles r
WHERE r.NombreRol = 'ADMIN'
ON CONFLICT (Email) DO NOTHING;



