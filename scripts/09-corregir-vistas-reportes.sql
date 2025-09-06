-- =====================================================
-- SCRIPT: Corrección de Vistas y APIs para Reportes
-- DESCRIPCIÓN: Corrige y completa las vistas y funciones para los reportes
-- FECHA: 2025-01-09
-- =====================================================

-- 1. Corregir la vista de caja variable para que coincida con lo que espera la API
DROP VIEW IF EXISTS VistaReporteCajaVariable;
CREATE OR REPLACE VIEW VistaReporteCajaVariable AS
SELECT 
    p."IdPago",
    EXTRACT(MONTH FROM p."Fecha") as "Mes",
    EXTRACT(YEAR FROM p."Fecha") as "Año",
    CASE EXTRACT(MONTH FROM p."Fecha")
        WHEN 1 THEN 'ENERO'
        WHEN 2 THEN 'FEBRERO' 
        WHEN 3 THEN 'MARZO'
        WHEN 4 THEN 'ABRIL'
        WHEN 5 THEN 'MAYO'
        WHEN 6 THEN 'JUNIO'
        WHEN 7 THEN 'JULIO'
        WHEN 8 THEN 'AGOSTO'
        WHEN 9 THEN 'SEPTIEMBRE'
        WHEN 10 THEN 'OCTUBRE'
        WHEN 11 THEN 'NOVIEMBRE'
        WHEN 12 THEN 'DICIEMBRE'
    END as "NombreMes",
    c."RazonSocial" as "Cliente",
    p."Fecha",
    COALESCE(p."Concepto", 'SERVICIO CONTABLE') as "DetalleServicio",
    'REC-' || LPAD(p."IdPago"::TEXT, 6, '0') as "NumeroRecibo",
    COALESCE(p."MedioPago", 'EFECTIVO') as "Medio",
    COALESCE(b."Nombre", 'YAPE') as "Banco",
    COALESCE(p."MontoPagado", 
        CASE 
            WHEN p."Estado" = 'COMPLETADO' THEN p."Monto"
            WHEN p."Estado" = 'PARCIAL' THEN p."Monto" * 0.5
            ELSE 0
        END
    ) as "MontoPagado",
    COALESCE(p."SaldoPendiente", 
        CASE 
            WHEN p."Estado" = 'COMPLETADO' THEN 0
            WHEN p."Estado" = 'PARCIAL' THEN p."Monto" * 0.5
            ELSE p."Monto"
        END
    ) as "SaldoPendiente",
    COALESCE(p."Observaciones", '') as "Observaciones",
    p."Monto" as "MontoOriginal",
    p."Estado"
FROM "Pago" p
INNER JOIN "Cliente" c ON p."IdCliente" = c."IdCliente"
LEFT JOIN "Banco" b ON p."IdBanco" = b."IdBanco"
WHERE p."Estado" IN ('COMPLETADO', 'PENDIENTE', 'PARCIAL')
ORDER BY p."Fecha" DESC, c."RazonSocial";

-- 2. Corregir la vista de caja fija proyectado
DROP VIEW IF EXISTS VistaReporteCajaFijaProyectado;
CREATE OR REPLACE VIEW VistaReporteCajaFijaProyectado AS
SELECT 
    c."IdCliente",
    c."RazonSocial" as "Concepto",
    c."IdCliente"::TEXT as "CodigoCliente",
    COALESCE(c."FechaInicioServicio", CURRENT_DATE - INTERVAL '30 days') as "FechaInicioServicio",
    COALESCE(c."FechaCorte", '15') as "FechaCorte",
    COALESCE(c."SaldoAnterior", 0) as "SaldoAnterior",
    COALESCE(c."ImporteServicioFijo", c."MontoFijoMensual", 0) as "ImporteServicioFijo",
    COALESCE(c."ImporteVariable", c."MontoFijoMensual", 0) as "ImporteVariable",
    COALESCE(c."ImporteAcumulado", c."MontoFijoMensual" * 12, 0) as "ImporteAcumulado",
    COALESCE(c."TipoComprobante", 'FACTURA') as "TipoComprobante",
    COALESCE(c."MedioDocumento", 'DIGITAL') as "MedioDocumento",
    COALESCE(c."VariableDescripcion", 'Servicio contable mensual') as "VariableDescripcion",
    c."FechaUltimaConsulta",
    c."FechaUltimoPago",
    c."MontoFijoMensual",
    -- Calcular estado de deuda basado en última fecha de pago
    CASE 
        WHEN c."FechaUltimoPago" IS NULL THEN 'SIN_PAGOS'
        WHEN c."FechaUltimoPago" >= CURRENT_DATE - INTERVAL '30 days' THEN 'AL_DIA'
        WHEN c."FechaUltimoPago" >= CURRENT_DATE - INTERVAL '60 days' THEN 'UN_MES'
        WHEN c."FechaUltimoPago" >= CURRENT_DATE - INTERVAL '90 days' THEN 'DOS_MESES'
        ELSE 'TRES_MAS_MESES'
    END as "EstadoDeuda"
FROM "Cliente" c
WHERE c."AplicaMontoFijo" = true
ORDER BY c."RazonSocial";

-- 3. Corregir la función para obtener el reporte de caja fija proyectado
DROP FUNCTION IF EXISTS ObtenerReporteCajaFijaProyectado(INTEGER);
CREATE OR REPLACE FUNCTION ObtenerReporteCajaFijaProyectado(p_año INTEGER)
RETURNS TABLE (
    "IdCliente" INTEGER,
    "Concepto" VARCHAR(255),
    "CodigoCliente" TEXT,
    "FechaInicioServicio" DATE,
    "FechaCorte" VARCHAR(10),
    "SaldoAnterior" DECIMAL(10,2),
    "ImporteServicioFijo" DECIMAL(10,2),
    "ImporteVariable" DECIMAL(10,2),
    "ImporteAcumulado" DECIMAL(10,2),
    "TipoComprobante" VARCHAR(20),
    "MedioDocumento" VARCHAR(50),
    "VariableDescripcion" TEXT,
    "FechaUltimaConsulta" DATE,
    "FechaUltimoPago" DATE,
    "EstadoDeuda" TEXT,
    "ProyeccionesJSON" TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v."IdCliente",
        v."Concepto",
        v."CodigoCliente",
        v."FechaInicioServicio",
        v."FechaCorte",
        v."SaldoAnterior",
        v."ImporteServicioFijo",
        v."ImporteVariable",
        v."ImporteAcumulado",
        v."TipoComprobante",
        v."MedioDocumento",
        v."VariableDescripcion",
        v."FechaUltimaConsulta",
        v."FechaUltimoPago",
        v."EstadoDeuda",
        -- Generar JSON con proyecciones mensuales
        COALESCE((
            SELECT json_object_agg(
                CONCAT(
                    CASE p."Mes"
                        WHEN 1 THEN 'ENE' WHEN 2 THEN 'FEB' WHEN 3 THEN 'MAR'
                        WHEN 4 THEN 'ABR' WHEN 5 THEN 'MAY' WHEN 6 THEN 'JUN'
                        WHEN 7 THEN 'JUL' WHEN 8 THEN 'AGO' WHEN 9 THEN 'SEP'
                        WHEN 10 THEN 'OCT' WHEN 11 THEN 'NOV' WHEN 12 THEN 'DIC'
                    END,
                    '-',
                    RIGHT(p."Año"::TEXT, 2)
                ),
                p."MontoProyectado"
            )::TEXT
            FROM "ProyeccionesCajaFija" p
            WHERE p."IdCliente" = v."IdCliente" AND p."Año" = p_año
        ), '{}') as "ProyeccionesJSON"
    FROM VistaReporteCajaFijaProyectado v
    ORDER BY v."Concepto";
END;
$$ LANGUAGE plpgsql;

-- 4. Función para generar datos de ejemplo si no existen proyecciones
CREATE OR REPLACE FUNCTION GenerarDatosEjemploReportes()
RETURNS VOID AS $$
DECLARE
    cliente_record RECORD;
    mes_actual INTEGER;
BEGIN
    -- Actualizar clientes existentes con datos para reportes
    UPDATE "Cliente" SET 
        "FechaInicioServicio" = COALESCE("FechaInicioServicio", CURRENT_DATE - INTERVAL '6 months'),
        "FechaCorte" = COALESCE("FechaCorte", '15'),
        "ImporteServicioFijo" = COALESCE("ImporteServicioFijo", "MontoFijoMensual"),
        "ImporteVariable" = COALESCE("ImporteVariable", "MontoFijoMensual"),
        "ImporteAcumulado" = COALESCE("ImporteAcumulado", "MontoFijoMensual" * 12),
        "TipoComprobante" = COALESCE("TipoComprobante", 'FACTURA'),
        "MedioDocumento" = COALESCE("MedioDocumento", 'DIGITAL'),
        "VariableDescripcion" = COALESCE("VariableDescripcion", 'Servicio contable mensual'),
        "FechaUltimaConsulta" = COALESCE("FechaUltimaConsulta", CURRENT_DATE - INTERVAL '5 days'),
        "FechaUltimoPago" = COALESCE("FechaUltimoPago", CURRENT_DATE - INTERVAL '15 days')
    WHERE "AplicaMontoFijo" = true;

    -- Generar proyecciones para 2024 y 2025 si no existen
    PERFORM GenerarProyeccionesCajaFija(2024);
    PERFORM GenerarProyeccionesCajaFija(2025);

    -- Actualizar algunos pagos existentes con datos para caja variable
    UPDATE "Pago" SET 
        "NumeroRecibo" = COALESCE("NumeroRecibo", 'REC-' || LPAD("IdPago"::TEXT, 6, '0')),
        "DetalleServicio" = COALESCE("DetalleServicio", "Concepto"),
        "MontoPagado" = COALESCE("MontoPagado", 
            CASE 
                WHEN "Estado" = 'COMPLETADO' THEN "Monto"
                WHEN "Estado" = 'PARCIAL' THEN "Monto" * 0.5
                ELSE 0
            END
        ),
        "SaldoPendiente" = COALESCE("SaldoPendiente",
            CASE 
                WHEN "Estado" = 'COMPLETADO' THEN 0
                WHEN "Estado" = 'PARCIAL' THEN "Monto" * 0.5
                ELSE "Monto"
            END
        ),
        "Observaciones" = COALESCE("Observaciones", 
            CASE 
                WHEN "Estado" = 'COMPLETADO' THEN 'Pago completo'
                WHEN "Estado" = 'PARCIAL' THEN 'Pago parcial pendiente'
                ELSE 'Pendiente de pago'
            END
        )
    WHERE "NumeroRecibo" IS NULL OR "DetalleServicio" IS NULL;

    RAISE NOTICE 'Datos de ejemplo generados correctamente para reportes';
END;
$$ LANGUAGE plpgsql;

-- 5. Ejecutar la función para generar datos de ejemplo
SELECT GenerarDatosEjemploReportes();

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Vistas y funciones corregidas correctamente';
    RAISE NOTICE 'Ejecutar: SELECT * FROM VistaReporteCajaVariable LIMIT 5;';
    RAISE NOTICE 'Ejecutar: SELECT * FROM ObtenerReporteCajaFijaProyectado(2025);';
END $$;
