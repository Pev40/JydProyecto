-- Migración 18: Corregir y crear vistas de reportes de caja (sin comillas)
-- Fecha: 2025-09-05
-- Descripción: Corrige las vistas faltantes para los reportes de caja variable y fija proyectado

-- 1. Crear tabla para proyecciones mensuales de caja fija
CREATE TABLE IF NOT EXISTS ProyeccionesCajaFija (
    IdProyeccion SERIAL PRIMARY KEY,
    IdCliente INTEGER NOT NULL,
    Año INTEGER NOT NULL,
    Mes INTEGER NOT NULL CHECK (Mes BETWEEN 1 AND 12),
    MontoProyectado DECIMAL(10,2) DEFAULT 0,
    Estado VARCHAR(20) DEFAULT 'PENDIENTE', -- PENDIENTE, PAGADO, VENCIDO
    FechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FechaActualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (IdCliente) REFERENCES "Cliente"("IdCliente") ON DELETE CASCADE,
    UNIQUE(IdCliente, Año, Mes)
);

-- 2. Crear tabla para configuración de reportes
CREATE TABLE IF NOT EXISTS ConfiguracionReportes (
    IdConfiguracion SERIAL PRIMARY KEY,
    TipoReporte VARCHAR(50) NOT NULL,
    Parametro VARCHAR(100) NOT NULL,
    Valor TEXT,
    Descripcion TEXT,
    FechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(TipoReporte, Parametro)
);

-- 3. Vista para reporte de caja variable
DROP VIEW IF EXISTS VistaReporteCajaVariable;
CREATE VIEW VistaReporteCajaVariable AS
SELECT 
    c."IdCliente",
    c."RazonSocial" as Concepto,
    c."RucDni" as CodigoCliente,
    p."Fecha" as FechaPago,
    p."Monto" as ImportePago,
    p."Concepto" as DetallePago,
    s."Nombre" as Servicio,
    cl."Descripcion" as Clasificacion,
    ca."Nombre" as Cartera,
    u."NombreCompleto" as Encargado,
    CASE 
        WHEN p."Monto" > 0 THEN 'PAGADO'
        ELSE 'PENDIENTE'
    END as EstadoPago,
    -- Campos adicionales para compatibilidad
    CAST(NULL AS DATE) as FechaVencimiento,
    CAST(0 AS DECIMAL(10,2)) as MontoDevengado,
    CAST(0 AS DECIMAL(10,2)) as SaldoPendiente
FROM "Cliente" c
LEFT JOIN "Pago" p ON c."IdCliente" = p."IdCliente"
LEFT JOIN "Servicio" s ON c."IdServicio" = s."IdServicio"
LEFT JOIN "Clasificacion" cl ON c."IdClasificacion" = cl."IdClasificacion"
LEFT JOIN "Cartera" ca ON c."IdCartera" = ca."IdCartera"
LEFT JOIN "Usuario" u ON c."IdEncargado" = u."IdUsuario"
WHERE p."IdPago" IS NOT NULL;

-- 4. Vista para reporte de caja fija proyectado
DROP VIEW IF EXISTS VistaReporteCajaFijaProyectado;
CREATE VIEW VistaReporteCajaFijaProyectado AS
SELECT 
    c."IdCliente",
    c."RazonSocial" as Concepto,
    c."RucDni" as CodigoCliente,
    c."FechaRegistro" as FechaInicioServicio,
    '31' as FechaCorte,
    CAST(0 AS DECIMAL(12,2)) as SaldoAnterior,
    c."MontoFijoMensual" as ImporteServicioFijo,
    CAST(0 AS DECIMAL(12,2)) as ImporteVariable,
    c."MontoFijoMensual" as ImporteAcumulado,
    'FACTURA' as TipoComprobante,
    'DIGITAL' as MedioDocumento,
    s."Descripcion" as VariableDescripcion,
    CAST(NULL AS DATE) as FechaUltimaConsulta,
    (
        SELECT MAX(p."Fecha"::DATE)
        FROM "Pago" p 
        WHERE p."IdCliente" = c."IdCliente"
    ) as FechaUltimoPago,
    CASE 
        WHEN c."AplicaMontoFijo" = true AND c."MontoFijoMensual" > 0 THEN 'ACTIVO'
        ELSE 'INACTIVO'
    END as EstadoDeuda
FROM "Cliente" c
LEFT JOIN "Servicio" s ON c."IdServicio" = s."IdServicio"
WHERE c."AplicaMontoFijo" = true;

-- 5. Función para obtener reporte de caja fija proyectado
CREATE OR REPLACE FUNCTION obtenerReporteCajaFijaProyectado(p_año INTEGER)
RETURNS TABLE(
    IdCliente INTEGER,
    Concepto TEXT,
    CodigoCliente VARCHAR,
    FechaInicioServicio TIMESTAMP,
    FechaCorte VARCHAR,
    SaldoAnterior DECIMAL,
    ImporteServicioFijo DECIMAL,
    ImporteVariable DECIMAL,
    ImporteAcumulado DECIMAL,
    TipoComprobante VARCHAR,
    MedioDocumento VARCHAR,
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
        -- Generar JSON básico con proyecciones mensuales
        CASE 
            WHEN v.ImporteServicioFijo > 0 THEN
                '{"ENE-25":' || v.ImporteServicioFijo || ',"FEB-25":' || v.ImporteServicioFijo || 
                ',"MAR-25":' || v.ImporteServicioFijo || ',"ABR-25":' || v.ImporteServicioFijo ||
                ',"MAY-25":' || v.ImporteServicioFijo || ',"JUN-25":' || v.ImporteServicioFijo ||
                ',"JUL-25":' || v.ImporteServicioFijo || ',"AGO-25":' || v.ImporteServicioFijo ||
                ',"SEP-25":' || v.ImporteServicioFijo || ',"OCT-25":' || v.ImporteServicioFijo ||
                ',"NOV-25":' || v.ImporteServicioFijo || ',"DIC-25":' || v.ImporteServicioFijo || '}'
            ELSE
                '{}'
        END::TEXT as ProyeccionesJSON
    FROM VistaReporteCajaFijaProyectado v
    ORDER BY v.Concepto;
END;
$$ LANGUAGE plpgsql;

-- 6. Comentarios
COMMENT ON VIEW VistaReporteCajaVariable IS 'Vista optimizada para el reporte de ingresos de caja variable';
COMMENT ON VIEW VistaReporteCajaFijaProyectado IS 'Vista optimizada para el reporte de caja fija proyectado';
COMMENT ON FUNCTION obtenerReporteCajaFijaProyectado(INTEGER) IS 'Función que retorna el reporte de caja fija proyectado con proyecciones mensuales';

-- Insertar configuraciones básicas de reportes
INSERT INTO ConfiguracionReportes (TipoReporte, Parametro, Valor, Descripcion)
VALUES 
    ('CAJA_VARIABLE', 'MONEDA_DEFAULT', 'PEN', 'Moneda por defecto para reportes de caja variable'),
    ('CAJA_FIJA', 'MONEDA_DEFAULT', 'PEN', 'Moneda por defecto para reportes de caja fija'),
    ('GENERAL', 'FECHA_CORTE_DEFAULT', '31', 'Día de corte por defecto para reportes mensuales')
ON CONFLICT (TipoReporte, Parametro) DO NOTHING;
