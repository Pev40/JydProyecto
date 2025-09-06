-- =====================================================
-- SCRIPT: Estructura para Reportes de Caja
-- DESCRIPCIÓN: Agrega tablas y campos necesarios para los reportes de caja variable y fija proyectado
-- FECHA: 2025-01-09
-- =====================================================

-- 1. Agregar campos faltantes a la tabla Clientes para caja fija
ALTER TABLE Clientes ADD COLUMN IF NOT EXISTS FechaInicioServicio DATE;
ALTER TABLE Clientes ADD COLUMN IF NOT EXISTS FechaCorte VARCHAR(10);
ALTER TABLE Clientes ADD COLUMN IF NOT EXISTS SaldoAnterior DECIMAL(10,2) DEFAULT 0;
ALTER TABLE Clientes ADD COLUMN IF NOT EXISTS ImporteServicioFijo DECIMAL(10,2) DEFAULT 0;
ALTER TABLE Clientes ADD COLUMN IF NOT EXISTS ImporteVariable DECIMAL(10,2) DEFAULT 0;
ALTER TABLE Clientes ADD COLUMN IF NOT EXISTS ImporteAcumulado DECIMAL(10,2) DEFAULT 0;
ALTER TABLE Clientes ADD COLUMN IF NOT EXISTS TipoComprobante VARCHAR(20);
ALTER TABLE Clientes ADD COLUMN IF NOT EXISTS MedioDocumento VARCHAR(50);
ALTER TABLE Clientes ADD COLUMN IF NOT EXISTS VariableDescripcion TEXT;
ALTER TABLE Clientes ADD COLUMN IF NOT EXISTS FechaUltimaConsulta DATE;
ALTER TABLE Clientes ADD COLUMN IF NOT EXISTS FechaUltimoPago DATE;

-- 2. Crear tabla para proyecciones mensuales de caja fija
CREATE TABLE IF NOT EXISTS ProyeccionesCajaFija (
    IdProyeccion SERIAL PRIMARY KEY,
    IdCliente INTEGER NOT NULL,
    Año INTEGER NOT NULL,
    Mes INTEGER NOT NULL CHECK (Mes BETWEEN 1 AND 12),
    MontoProyectado DECIMAL(10,2) DEFAULT 0,
    Estado VARCHAR(20) DEFAULT 'PENDIENTE', -- PENDIENTE, PAGADO, VENCIDO
    FechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FechaActualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (IdCliente) REFERENCES Clientes(IdCliente) ON DELETE CASCADE,
    UNIQUE(IdCliente, Año, Mes)
);

-- 3. Agregar campos faltantes a la tabla Pagos para caja variable
ALTER TABLE Pagos ADD COLUMN IF NOT EXISTS NumeroRecibo VARCHAR(50);
ALTER TABLE Pagos ADD COLUMN IF NOT EXISTS DetalleServicio TEXT;
ALTER TABLE Pagos ADD COLUMN IF NOT EXISTS MontoDevengado DECIMAL(10,2) DEFAULT 0;
ALTER TABLE Pagos ADD COLUMN IF NOT EXISTS MontoPagado DECIMAL(10,2) DEFAULT 0;
ALTER TABLE Pagos ADD COLUMN IF NOT EXISTS SaldoPendiente DECIMAL(10,2) DEFAULT 0;
ALTER TABLE Pagos ADD COLUMN IF NOT EXISTS Observaciones TEXT;

-- 4. Crear tabla para configuración de reportes
CREATE TABLE IF NOT EXISTS ConfiguracionReportes (
    IdConfiguracion SERIAL PRIMARY KEY,
    TipoReporte VARCHAR(50) NOT NULL,
    Parametro VARCHAR(100) NOT NULL,
    Valor TEXT,
    Descripcion TEXT,
    FechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(TipoReporte, Parametro)
);

-- 5. Insertar configuraciones por defecto para reportes
INSERT INTO ConfiguracionReportes (TipoReporte, Parametro, Valor, Descripcion) VALUES
('CAJA_VARIABLE', 'COLUMNAS_VISIBLES', 'MES,CLIENTE,FECHA,DETALLE_SERVICIO,NRO_RECIBO,MEDIO,BANCO,DEVENGADO,PAGADO,SALDO_PENDIENTE,OBSERVACION', 'Columnas visibles en reporte de caja variable'),
('CAJA_FIJA', 'MESES_PROYECCION', '12', 'Número de meses a proyectar'),
('CAJA_FIJA', 'COLOR_AL_DIA', '#22c55e', 'Color para clientes al día'),
('CAJA_FIJA', 'COLOR_1_MES', '#f97316', 'Color para clientes con 1 mes de deuda'),
('CAJA_FIJA', 'COLOR_2_MESES', '#eab308', 'Color para clientes con 2 meses de deuda'),
('CAJA_FIJA', 'COLOR_3_MAS_MESES', '#ef4444', 'Color para clientes con 3+ meses de deuda')
ON CONFLICT (TipoReporte, Parametro) DO NOTHING;

-- 6. Crear vista para reporte de caja variable
CREATE OR REPLACE VIEW VistaReporteCajaVariable AS
SELECT 
    p.IdPago,
    EXTRACT(MONTH FROM p.Fecha) as Mes,
    EXTRACT(YEAR FROM p.Fecha) as Año,
    TO_CHAR(p.Fecha, 'Month') as NombreMes,
    c.RazonSocial as Cliente,
    p.Fecha,
    COALESCE(p.DetalleServicio, p.Concepto) as DetalleServicio,
    p.NumeroRecibo,
    p.MedioPago as Medio,
    b.Nombre as Banco,
    p.MontoDevengado,
    p.MontoPagado,
    p.SaldoPendiente,
    p.Observaciones,
    p.Monto as MontoOriginal,
    p.Estado
FROM Pagos p
INNER JOIN Clientes c ON p.IdCliente = c.IdCliente
LEFT JOIN Bancos b ON p.IdBanco = b.IdBanco
WHERE p.Estado IN ('COMPLETADO', 'PENDIENTE', 'PARCIAL')
ORDER BY p.Fecha DESC, c.RazonSocial;

-- 7. Crear vista para reporte de caja fija proyectado
CREATE OR REPLACE VIEW VistaReporteCajaFijaProyectado AS
SELECT 
    c.IdCliente,
    c.RazonSocial as Concepto,
    c.IdCliente::TEXT as CodigoCliente,
    c.FechaInicioServicio,
    c.FechaCorte,
    c.SaldoAnterior,
    c.ImporteServicioFijo,
    c.ImporteVariable,
    c.ImporteAcumulado,
    c.TipoComprobante,
    c.MedioDocumento,
    c.VariableDescripcion,
    c.FechaUltimaConsulta,
    c.FechaUltimoPago,
    c.MontoFijoMensual,
    -- Calcular estado de deuda basado en última fecha de pago
    CASE 
        WHEN c.FechaUltimoPago IS NULL THEN 'SIN_PAGOS'
        WHEN c.FechaUltimoPago >= CURRENT_DATE - INTERVAL '30 days' THEN 'AL_DIA'
        WHEN c.FechaUltimoPago >= CURRENT_DATE - INTERVAL '60 days' THEN 'UN_MES'
        WHEN c.FechaUltimoPago >= CURRENT_DATE - INTERVAL '90 days' THEN 'DOS_MESES'
        ELSE 'TRES_MAS_MESES'
    END as EstadoDeuda
FROM Clientes c
WHERE c.AplicaMontoFijo = true
ORDER BY c.RazonSocial;

-- 8. Función para generar proyecciones automáticas
CREATE OR REPLACE FUNCTION GenerarProyeccionesCajaFija(
    p_año INTEGER,
    p_id_cliente INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    cliente_record RECORD;
    mes_actual INTEGER;
    proyecciones_creadas INTEGER := 0;
BEGIN
    -- Si no se especifica cliente, procesar todos los clientes con monto fijo
    FOR cliente_record IN 
        SELECT IdCliente, MontoFijoMensual, FechaInicioServicio
        FROM Clientes 
        WHERE AplicaMontoFijo = true 
        AND (p_id_cliente IS NULL OR IdCliente = p_id_cliente)
    LOOP
        -- Generar proyección para cada mes del año
        FOR mes_actual IN 1..12 LOOP
            INSERT INTO ProyeccionesCajaFija (IdCliente, Año, Mes, MontoProyectado)
            VALUES (
                cliente_record.IdCliente,
                p_año,
                mes_actual,
                cliente_record.MontoFijoMensual
            )
            ON CONFLICT (IdCliente, Año, Mes) 
            DO UPDATE SET 
                MontoProyectado = cliente_record.MontoFijoMensual,
                FechaActualizacion = CURRENT_TIMESTAMP;
            
            proyecciones_creadas := proyecciones_creadas + 1;
        END LOOP;
    END LOOP;
    
    RETURN proyecciones_creadas;
END;
$$ LANGUAGE plpgsql;

-- 9. Función para obtener datos del reporte de caja fija proyectado
CREATE OR REPLACE FUNCTION ObtenerReporteCajaFijaProyectado(p_año INTEGER)
RETURNS TABLE (
    IdCliente INTEGER,
    Concepto VARCHAR(255),
    CodigoCliente TEXT,
    FechaInicioServicio DATE,
    FechaCorte VARCHAR(10),
    SaldoAnterior DECIMAL(10,2),
    ImporteServicioFijo DECIMAL(10,2),
    ImporteVariable DECIMAL(10,2),
    ImporteAcumulado DECIMAL(10,2),
    TipoComprobante VARCHAR(20),
    MedioDocumento VARCHAR(50),
    VariableDescripcion TEXT,
    FechaUltimaConsulta DATE,
    FechaUltimoPago DATE,
    EstadoDeuda TEXT,
    ProyeccionesJSON TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.IdCliente,
        v.Concepto,
        v.CodigoCliente,
        v.FechaInicioServicio,
        v.FechaCorte,
        v.SaldoAnterior,
        v.ImporteServicioFijo,
        v.ImporteVariable,
        v.ImporteAcumulado,
        v.TipoComprobante,
        v.MedioDocumento,
        v.VariableDescripcion,
        v.FechaUltimaConsulta,
        v.FechaUltimoPago,
        v.EstadoDeuda,
        -- Generar JSON con proyecciones mensuales
        (
            SELECT json_object_agg(
                CONCAT(
                    CASE p.Mes
                        WHEN 1 THEN 'ENE' WHEN 2 THEN 'FEB' WHEN 3 THEN 'MAR'
                        WHEN 4 THEN 'ABR' WHEN 5 THEN 'MAY' WHEN 6 THEN 'JUN'
                        WHEN 7 THEN 'JUL' WHEN 8 THEN 'AGO' WHEN 9 THEN 'SEP'
                        WHEN 10 THEN 'OCT' WHEN 11 THEN 'NOV' WHEN 12 THEN 'DIC'
                    END,
                    '-',
                    RIGHT(p.Año::TEXT, 2)
                ),
                p.MontoProyectado
            )::TEXT
            FROM ProyeccionesCajaFija p
            WHERE p.IdCliente = v.IdCliente AND p.Año = p_año
        ) as ProyeccionesJSON
    FROM VistaReporteCajaFijaProyectado v
    ORDER BY v.Concepto;
END;
$$ LANGUAGE plpgsql;

-- 10. Insertar datos de ejemplo para testing
-- Actualizar algunos clientes existentes con datos para caja fija
UPDATE Clientes SET 
    FechaInicioServicio = '2025-01-15',
    FechaCorte = '15',
    ImporteServicioFijo = MontoFijoMensual,
    ImporteVariable = MontoFijoMensual,
    ImporteAcumulado = MontoFijoMensual * 12,
    TipoComprobante = 'FACTURA',
    MedioDocumento = 'DIGITAL',
    FechaUltimaConsulta = CURRENT_DATE - INTERVAL '5 days',
    FechaUltimoPago = CURRENT_DATE - INTERVAL '15 days'
WHERE AplicaMontoFijo = true;

-- Generar proyecciones para 2025
SELECT GenerarProyeccionesCajaFija(2025);

-- 11. Insertar algunos pagos de ejemplo para caja variable
INSERT INTO Pagos (IdCliente, Fecha, Monto, Concepto, MedioPago, MesServicio, Estado, NumeroRecibo, DetalleServicio, MontoDevengado, MontoPagado, SaldoPendiente, Observaciones)
SELECT 
    IdCliente,
    CURRENT_DATE - INTERVAL '30 days' + (RANDOM() * INTERVAL '60 days'),
    MontoFijoMensual + (RANDOM() * 1000)::DECIMAL(10,2),
    'Servicio mensual',
    CASE (RANDOM() * 4)::INTEGER
        WHEN 0 THEN 'EFECTIVO'
        WHEN 1 THEN 'TRANSFERENCIA'
        WHEN 2 THEN 'YAPE'
        ELSE 'PLIN'
    END,
    TO_CHAR(CURRENT_DATE, 'YYYY-MM'),
    CASE (RANDOM() * 3)::INTEGER
        WHEN 0 THEN 'COMPLETADO'
        WHEN 1 THEN 'PENDIENTE'
        ELSE 'PARCIAL'
    END,
    'REC-' || LPAD((ROW_NUMBER() OVER())::TEXT, 6, '0'),
    'Activación de ficha RUC y servicios contables',
    MontoFijoMensual,
    CASE (RANDOM() * 3)::INTEGER
        WHEN 0 THEN MontoFijoMensual
        WHEN 1 THEN MontoFijoMensual * 0.5
        ELSE 0
    END,
    CASE (RANDOM() * 3)::INTEGER
        WHEN 0 THEN 0
        WHEN 1 THEN MontoFijoMensual * 0.5
        ELSE MontoFijoMensual
    END,
    CASE (RANDOM() * 2)::INTEGER
        WHEN 0 THEN 'Pago completo'
        ELSE 'Pago pendiente de completar'
    END
FROM Clientes 
WHERE IdCliente <= 10
ON CONFLICT DO NOTHING;

-- 12. Crear índices para optimizar consultas de reportes
CREATE INDEX IF NOT EXISTS idx_pagos_fecha_cliente ON Pagos(Fecha, IdCliente);
CREATE INDEX IF NOT EXISTS idx_proyecciones_cliente_año ON ProyeccionesCajaFija(IdCliente, Año);
CREATE INDEX IF NOT EXISTS idx_clientes_monto_fijo ON Clientes(AplicaMontoFijo) WHERE AplicaMontoFijo = true;

-- 13. Comentarios de documentación
COMMENT ON TABLE ProyeccionesCajaFija IS 'Tabla para almacenar proyecciones mensuales de ingresos de caja fija por cliente';
COMMENT ON FUNCTION GenerarProyeccionesCajaFija IS 'Función para generar automáticamente las proyecciones de caja fija para un año específico';
COMMENT ON VIEW VistaReporteCajaVariable IS 'Vista optimizada para el reporte de ingresos de caja variable';
COMMENT ON VIEW VistaReporteCajaFijaProyectado IS 'Vista optimizada para el reporte de caja fija proyectado';

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Script ejecutado correctamente. Estructura para reportes de caja creada.';
    RAISE NOTICE 'Tablas creadas: ProyeccionesCajaFija, ConfiguracionReportes';
    RAISE NOTICE 'Vistas creadas: VistaReporteCajaVariable, VistaReporteCajaFijaProyectado';
    RAISE NOTICE 'Funciones creadas: GenerarProyeccionesCajaFija, ObtenerReporteCajaFijaProyectado';
END $$;
