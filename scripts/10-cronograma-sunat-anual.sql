-- =====================================================
-- SCRIPT: Cronograma SUNAT Anual Mejorado
-- DESCRIPCIÓN: Mejora el sistema de cronograma SUNAT para manejar múltiples años
-- VERSIÓN: 1.0
-- FECHA: 2024-12-19
-- =====================================================

-- Agregar columnas necesarias a la tabla existente
ALTER TABLE CronogramaSunat 
ADD COLUMN IF NOT EXISTS Año INT NOT NULL DEFAULT 2024,
ADD COLUMN IF NOT EXISTS FechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS UsuarioCreacion VARCHAR(100),
ADD COLUMN IF NOT EXISTS Estado ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO';

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_cronograma_año ON CronogramaSunat(Año);
CREATE INDEX IF NOT EXISTS idx_cronograma_año_mes ON CronogramaSunat(Año, Mes);
CREATE INDEX IF NOT EXISTS idx_cronograma_año_digito ON CronogramaSunat(Año, UltimoDigitoRuc);

-- Actualizar registros existentes para que tengan año 2024
UPDATE CronogramaSunat SET Año = 2024 WHERE Año IS NULL OR Año = 0;

-- Función para obtener años disponibles
DELIMITER //
CREATE OR REPLACE FUNCTION ObtenerAñosDisponibles()
RETURNS JSON
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE resultado JSON;
    
    SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
            'año', Año,
            'totalRegistros', COUNT(*),
            'fechaCreacion', MIN(FechaCreacion),
            'estado', 'ACTIVO'
        )
    ) INTO resultado
    FROM CronogramaSunat 
    WHERE Estado = 'ACTIVO'
    GROUP BY Año
    ORDER BY Año DESC;
    
    RETURN COALESCE(resultado, JSON_ARRAY());
END //
DELIMITER ;

-- Función para crear cronograma base para un nuevo año
DELIMITER //
CREATE OR REPLACE PROCEDURE CrearCronogramaBase(
    IN p_año INT,
    IN p_usuario VARCHAR(100)
)
BEGIN
    DECLARE v_count INT DEFAULT 0;
    
    -- Verificar si ya existe el cronograma para ese año
    SELECT COUNT(*) INTO v_count 
    FROM CronogramaSunat 
    WHERE Año = p_año AND Estado = 'ACTIVO';
    
    IF v_count > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ya existe un cronograma activo para este año';
    END IF;
    
    -- Crear cronograma base con fechas genéricas
    INSERT INTO CronogramaSunat (Año, Mes, UltimoDigitoRuc, FechaVencimiento, FechaCreacion, UsuarioCreacion, Estado)
    VALUES
    -- Enero
    (p_año, 1, '0', CONCAT(p_año + 1, '-02-14'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 1, '1', CONCAT(p_año + 1, '-02-17'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 1, '2,3', CONCAT(p_año + 1, '-02-18'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 1, '4,5', CONCAT(p_año + 1, '-02-19'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 1, '6,7', CONCAT(p_año + 1, '-02-20'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 1, '8,9', CONCAT(p_año + 1, '-02-21'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 1, 'BC', CONCAT(p_año + 1, '-02-24'), NOW(), p_usuario, 'ACTIVO'),
    
    -- Febrero
    (p_año, 2, '0', CONCAT(p_año + 1, '-03-14'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 2, '1', CONCAT(p_año + 1, '-03-17'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 2, '2,3', CONCAT(p_año + 1, '-03-18'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 2, '4,5', CONCAT(p_año + 1, '-03-19'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 2, '6,7', CONCAT(p_año + 1, '-03-20'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 2, '8,9', CONCAT(p_año + 1, '-03-21'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 2, 'BC', CONCAT(p_año + 1, '-03-24'), NOW(), p_usuario, 'ACTIVO'),
    
    -- Marzo
    (p_año, 3, '0', CONCAT(p_año + 1, '-04-14'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 3, '1', CONCAT(p_año + 1, '-04-15'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 3, '2,3', CONCAT(p_año + 1, '-04-16'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 3, '4,5', CONCAT(p_año + 1, '-04-21'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 3, '6,7', CONCAT(p_año + 1, '-04-22'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 3, '8,9', CONCAT(p_año + 1, '-04-23'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 3, 'BC', CONCAT(p_año + 1, '-04-24'), NOW(), p_usuario, 'ACTIVO'),
    
    -- Abril
    (p_año, 4, '0', CONCAT(p_año + 1, '-05-15'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 4, '1', CONCAT(p_año + 1, '-05-16'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 4, '2,3', CONCAT(p_año + 1, '-05-19'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 4, '4,5', CONCAT(p_año + 1, '-05-20'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 4, '6,7', CONCAT(p_año + 1, '-05-21'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 4, '8,9', CONCAT(p_año + 1, '-05-22'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 4, 'BC', CONCAT(p_año + 1, '-05-23'), NOW(), p_usuario, 'ACTIVO'),
    
    -- Mayo
    (p_año, 5, '0', CONCAT(p_año + 1, '-06-13'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 5, '1', CONCAT(p_año + 1, '-06-16'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 5, '2,3', CONCAT(p_año + 1, '-06-17'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 5, '4,5', CONCAT(p_año + 1, '-06-18'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 5, '6,7', CONCAT(p_año + 1, '-06-19'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 5, '8,9', CONCAT(p_año + 1, '-06-20'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 5, 'BC', CONCAT(p_año + 1, '-06-23'), NOW(), p_usuario, 'ACTIVO'),
    
    -- Junio
    (p_año, 6, '0', CONCAT(p_año + 1, '-07-14'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 6, '1', CONCAT(p_año + 1, '-07-15'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 6, '2,3', CONCAT(p_año + 1, '-07-16'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 6, '4,5', CONCAT(p_año + 1, '-07-17'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 6, '6,7', CONCAT(p_año + 1, '-07-18'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 6, '8,9', CONCAT(p_año + 1, '-07-21'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 6, 'BC', CONCAT(p_año + 1, '-07-22'), NOW(), p_usuario, 'ACTIVO'),
    
    -- Julio
    (p_año, 7, '0', CONCAT(p_año + 1, '-08-15'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 7, '1', CONCAT(p_año + 1, '-08-18'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 7, '2,3', CONCAT(p_año + 1, '-08-19'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 7, '4,5', CONCAT(p_año + 1, '-08-20'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 7, '6,7', CONCAT(p_año + 1, '-08-21'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 7, '8,9', CONCAT(p_año + 1, '-08-22'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 7, 'BC', CONCAT(p_año + 1, '-08-25'), NOW(), p_usuario, 'ACTIVO'),
    
    -- Agosto
    (p_año, 8, '0', CONCAT(p_año + 1, '-09-12'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 8, '1', CONCAT(p_año + 1, '-09-15'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 8, '2,3', CONCAT(p_año + 1, '-09-16'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 8, '4,5', CONCAT(p_año + 1, '-09-17'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 8, '6,7', CONCAT(p_año + 1, '-09-18'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 8, '8,9', CONCAT(p_año + 1, '-09-19'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 8, 'BC', CONCAT(p_año + 1, '-09-22'), NOW(), p_usuario, 'ACTIVO'),
    
    -- Septiembre
    (p_año, 9, '0', CONCAT(p_año + 1, '-10-15'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 9, '1', CONCAT(p_año + 1, '-10-16'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 9, '2,3', CONCAT(p_año + 1, '-10-17'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 9, '4,5', CONCAT(p_año + 1, '-10-20'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 9, '6,7', CONCAT(p_año + 1, '-10-21'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 9, '8,9', CONCAT(p_año + 1, '-10-22'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 9, 'BC', CONCAT(p_año + 1, '-10-23'), NOW(), p_usuario, 'ACTIVO'),
    
    -- Octubre
    (p_año, 10, '0', CONCAT(p_año + 1, '-11-14'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 10, '1', CONCAT(p_año + 1, '-11-17'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 10, '2,3', CONCAT(p_año + 1, '-11-18'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 10, '4,5', CONCAT(p_año + 1, '-11-19'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 10, '6,7', CONCAT(p_año + 1, '-11-20'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 10, '8,9', CONCAT(p_año + 1, '-11-21'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 10, 'BC', CONCAT(p_año + 1, '-11-24'), NOW(), p_usuario, 'ACTIVO'),
    
    -- Noviembre
    (p_año, 11, '0', CONCAT(p_año + 1, '-12-16'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 11, '1', CONCAT(p_año + 1, '-12-17'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 11, '2,3', CONCAT(p_año + 1, '-12-18'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 11, '4,5', CONCAT(p_año + 1, '-12-19'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 11, '6,7', CONCAT(p_año + 1, '-12-22'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 11, '8,9', CONCAT(p_año + 1, '-12-23'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 11, 'BC', CONCAT(p_año + 1, '-12-24'), NOW(), p_usuario, 'ACTIVO'),
    
    -- Diciembre
    (p_año, 12, '0', CONCAT(p_año + 2, '-01-15'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 12, '1', CONCAT(p_año + 2, '-01-16'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 12, '2,3', CONCAT(p_año + 2, '-01-19'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 12, '4,5', CONCAT(p_año + 2, '-01-20'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 12, '6,7', CONCAT(p_año + 2, '-01-21'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 12, '8,9', CONCAT(p_año + 2, '-01-22'), NOW(), p_usuario, 'ACTIVO'),
    (p_año, 12, 'BC', CONCAT(p_año + 2, '-01-23'), NOW(), p_usuario, 'ACTIVO');
    
END //
DELIMITER ;

-- Función para copiar cronograma de un año a otro
DELIMITER //
CREATE OR REPLACE PROCEDURE CopiarCronogramaSunat(
    IN p_año_origen INT,
    IN p_año_destino INT,
    IN p_usuario VARCHAR(100)
)
BEGIN
    DECLARE v_count_origen INT DEFAULT 0;
    DECLARE v_count_destino INT DEFAULT 0;
    
    -- Verificar que existe el cronograma origen
    SELECT COUNT(*) INTO v_count_origen 
    FROM CronogramaSunat 
    WHERE Año = p_año_origen AND Estado = 'ACTIVO';
    
    IF v_count_origen = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No existe cronograma activo para el año origen';
    END IF;
    
    -- Verificar que no existe el cronograma destino
    SELECT COUNT(*) INTO v_count_destino 
    FROM CronogramaSunat 
    WHERE Año = p_año_destino AND Estado = 'ACTIVO';
    
    IF v_count_destino > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ya existe un cronograma activo para el año destino';
    END IF;
    
    -- Copiar cronograma ajustando las fechas
    INSERT INTO CronogramaSunat (Año, Mes, UltimoDigitoRuc, FechaVencimiento, FechaCreacion, UsuarioCreacion, Estado)
    SELECT 
        p_año_destino,
        Mes,
        UltimoDigitoRuc,
        DATE_ADD(FechaVencimiento, INTERVAL (p_año_destino - p_año_origen) YEAR),
        NOW(),
        p_usuario,
        'ACTIVO'
    FROM CronogramaSunat 
    WHERE Año = p_año_origen AND Estado = 'ACTIVO';
    
END //
DELIMITER ;

-- Insertar cronograma oficial 2025 según imagen SUNAT
DELETE FROM CronogramaSunat WHERE Año = 2025;

INSERT INTO CronogramaSunat (Año, Mes, UltimoDigitoRuc, FechaVencimiento, FechaCreacion, UsuarioCreacion, Estado) VALUES
-- Enero 2025
(2025, 1, '0', '2026-02-14', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 1, '1', '2026-02-17', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 1, '2,3', '2026-02-18', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 1, '4,5', '2026-02-19', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 1, '6,7', '2026-02-20', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 1, '8,9', '2026-02-21', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 1, 'BC', '2026-02-24', NOW(), 'SISTEMA', 'ACTIVO'),

-- Febrero 2025
(2025, 2, '0', '2026-03-14', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 2, '1', '2026-03-17', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 2, '2,3', '2026-03-18', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 2, '4,5', '2026-03-19', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 2, '6,7', '2026-03-20', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 2, '8,9', '2026-03-21', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 2, 'BC', '2026-03-24', NOW(), 'SISTEMA', 'ACTIVO'),

-- Marzo 2025
(2025, 3, '0', '2026-04-14', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 3, '1', '2026-04-15', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 3, '2,3', '2026-04-16', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 3, '4,5', '2026-04-21', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 3, '6,7', '2026-04-22', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 3, '8,9', '2026-04-23', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 3, 'BC', '2026-04-24', NOW(), 'SISTEMA', 'ACTIVO'),

-- Abril 2025
(2025, 4, '0', '2026-05-15', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 4, '1', '2026-05-16', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 4, '2,3', '2026-05-19', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 4, '4,5', '2026-05-20', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 4, '6,7', '2026-05-21', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 4, '8,9', '2026-05-22', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 4, 'BC', '2026-05-23', NOW(), 'SISTEMA', 'ACTIVO'),

-- Mayo 2025
(2025, 5, '0', '2026-06-13', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 5, '1', '2026-06-16', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 5, '2,3', '2026-06-17', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 5, '4,5', '2026-06-18', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 5, '6,7', '2026-06-19', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 5, '8,9', '2026-06-20', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 5, 'BC', '2026-06-23', NOW(), 'SISTEMA', 'ACTIVO'),

-- Junio 2025
(2025, 6, '0', '2026-07-14', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 6, '1', '2026-07-15', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 6, '2,3', '2026-07-16', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 6, '4,5', '2026-07-17', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 6, '6,7', '2026-07-18', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 6, '8,9', '2026-07-21', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 6, 'BC', '2026-07-22', NOW(), 'SISTEMA', 'ACTIVO'),

-- Julio 2025
(2025, 7, '0', '2026-08-15', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 7, '1', '2026-08-18', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 7, '2,3', '2026-08-19', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 7, '4,5', '2026-08-20', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 7, '6,7', '2026-08-21', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 7, '8,9', '2026-08-22', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 7, 'BC', '2026-08-25', NOW(), 'SISTEMA', 'ACTIVO'),

-- Agosto 2025
(2025, 8, '0', '2026-09-12', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 8, '1', '2026-09-15', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 8, '2,3', '2026-09-16', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 8, '4,5', '2026-09-17', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 8, '6,7', '2026-09-18', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 8, '8,9', '2026-09-19', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 8, 'BC', '2026-09-22', NOW(), 'SISTEMA', 'ACTIVO'),

-- Septiembre 2025
(2025, 9, '0', '2026-10-15', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 9, '1', '2026-10-16', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 9, '2,3', '2026-10-17', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 9, '4,5', '2026-10-20', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 9, '6,7', '2026-10-21', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 9, '8,9', '2026-10-22', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 9, 'BC', '2026-10-23', NOW(), 'SISTEMA', 'ACTIVO'),

-- Octubre 2025
(2025, 10, '0', '2026-11-14', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 10, '1', '2026-11-17', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 10, '2,3', '2026-11-18', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 10, '4,5', '2026-11-19', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 10, '6,7', '2026-11-20', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 10, '8,9', '2026-11-21', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 10, 'BC', '2026-11-24', NOW(), 'SISTEMA', 'ACTIVO'),

-- Noviembre 2025
(2025, 11, '0', '2026-12-16', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 11, '1', '2026-12-17', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 11, '2,3', '2026-12-18', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 11, '4,5', '2026-12-19', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 11, '6,7', '2026-12-22', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 11, '8,9', '2026-12-23', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 11, 'BC', '2026-12-24', NOW(), 'SISTEMA', 'ACTIVO'),

-- Diciembre 2025
(2025, 12, '0', '2027-01-15', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 12, '1', '2027-01-16', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 12, '2,3', '2027-01-19', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 12, '4,5', '2027-01-20', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 12, '6,7', '2027-01-21', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 12, '8,9', '2027-01-22', NOW(), 'SISTEMA', 'ACTIVO'),
(2025, 12, 'BC', '2027-01-23', NOW(), 'SISTEMA', 'ACTIVO');

-- Crear vista mejorada para cronograma SUNAT
CREATE OR REPLACE VIEW VistaCronogramaSunat AS
SELECT 
    cs.IdCronograma,
    cs.Año,
    cs.Mes,
    CASE cs.Mes
        WHEN 1 THEN 'Enero'
        WHEN 2 THEN 'Febrero'
        WHEN 3 THEN 'Marzo'
        WHEN 4 THEN 'Abril'
        WHEN 5 THEN 'Mayo'
        WHEN 6 THEN 'Junio'
        WHEN 7 THEN 'Julio'
        WHEN 8 THEN 'Agosto'
        WHEN 9 THEN 'Septiembre'
        WHEN 10 THEN 'Octubre'
        WHEN 11 THEN 'Noviembre'
        WHEN 12 THEN 'Diciembre'
    END AS NombreMes,
    cs.UltimoDigitoRuc,
    CASE cs.UltimoDigitoRuc
        WHEN '0' THEN 'Dígito 0'
        WHEN '1' THEN 'Dígito 1'
        WHEN '2,3' THEN 'Dígitos 2 y 3'
        WHEN '4,5' THEN 'Dígitos 4 y 5'
        WHEN '6,7' THEN 'Dígitos 6 y 7'
        WHEN '8,9' THEN 'Dígitos 8 y 9'
        WHEN 'BC' THEN 'Buenos Contribuyentes y UESP'
        ELSE cs.UltimoDigitoRuc
    END AS DescripcionDigito,
    cs.FechaVencimiento,
    DATE_FORMAT(cs.FechaVencimiento, '%d/%m/%Y') AS FechaVencimientoFormateada,
    DAYNAME(cs.FechaVencimiento) AS DiaSemana,
    cs.FechaCreacion,
    cs.UsuarioCreacion,
    cs.Estado
FROM CronogramaSunat cs
WHERE cs.Estado = 'ACTIVO'
ORDER BY cs.Año DESC, cs.Mes ASC, 
    CASE cs.UltimoDigitoRuc
        WHEN '0' THEN 1
        WHEN '1' THEN 2
        WHEN '2,3' THEN 3
        WHEN '4,5' THEN 4
        WHEN '6,7' THEN 5
        WHEN '8,9' THEN 6
        WHEN 'BC' THEN 7
        ELSE 8
    END;

-- Función para obtener cronograma por año
DELIMITER //
CREATE OR REPLACE FUNCTION ObtenerCronogramaPorAño(p_año INT)
RETURNS JSON
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE resultado JSON;
    
    SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
            'idCronograma', IdCronograma,
            'año', Año,
            'mes', Mes,
            'nombreMes', NombreMes,
            'ultimoDigitoRuc', UltimoDigitoRuc,
            'descripcionDigito', DescripcionDigito,
            'fechaVencimiento', FechaVencimiento,
            'fechaVencimientoFormateada', FechaVencimientoFormateada,
            'diaSemana', DiaSemana,
            'estado', Estado
        )
    ) INTO resultado
    FROM VistaCronogramaSunat
    WHERE Año = p_año
    ORDER BY Mes ASC, 
        CASE UltimoDigitoRuc
            WHEN '0' THEN 1
            WHEN '1' THEN 2
            WHEN '2,3' THEN 3
            WHEN '4,5' THEN 4
            WHEN '6,7' THEN 5
            WHEN '8,9' THEN 6
            WHEN 'BC' THEN 7
            ELSE 8
        END;
    
    RETURN COALESCE(resultado, JSON_ARRAY());
END //
DELIMITER ;

-- Función para obtener estadísticas del cronograma
DELIMITER //
CREATE OR REPLACE FUNCTION ObtenerEstadisticasCronograma(p_año INT)
RETURNS JSON
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE resultado JSON;
    
    SELECT JSON_OBJECT(
        'totalRegistros', COUNT(*),
        'mesesCompletos', COUNT(DISTINCT Mes),
        'digitosConfigurados', COUNT(DISTINCT UltimoDigitoRuc),
        'fechaCreacion', MIN(FechaCreacion),
        'fechaUltimaModificacion', MAX(FechaCreacion),
        'estado', 'ACTIVO'
    ) INTO resultado
    FROM CronogramaSunat
    WHERE Año = p_año AND Estado = 'ACTIVO';
    
    RETURN COALESCE(resultado, JSON_OBJECT());
END //
DELIMITER ;

-- Insertar datos de configuración
INSERT IGNORE INTO ConfiguracionSistema (Clave, Valor, Descripcion, Categoria) VALUES
('CRONOGRAMA_SUNAT_AÑOS_DISPONIBLES', '2024,2025', 'Años disponibles para cronograma SUNAT', 'CRONOGRAMA'),
('CRONOGRAMA_SUNAT_AÑO_ACTUAL', '2025', 'Año actual del cronograma SUNAT', 'CRONOGRAMA'),
('CRONOGRAMA_SUNAT_NOTIFICAR_VENCIMIENTOS', 'true', 'Notificar vencimientos del cronograma SUNAT', 'CRONOGRAMA'),
('CRONOGRAMA_SUNAT_DIAS_ANTICIPACION', '7', 'Días de anticipación para notificar vencimientos', 'CRONOGRAMA');

-- Mensaje de confirmación
SELECT 'Cronograma SUNAT anual configurado correctamente' AS Mensaje,
       'Se ha cargado el cronograma oficial 2025 según imagen SUNAT' AS Detalle,
       'Funciones CrearCronogramaBase() y CopiarCronogramaSunat() disponibles' AS Funcionalidades;
