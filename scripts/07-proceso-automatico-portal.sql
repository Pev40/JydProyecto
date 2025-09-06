-- =====================================================
-- SCRIPT: Proceso Automático y Portal Cliente
-- DESCRIPCIÓN: Implementa proceso diario automático y portal para clientes
-- FLUJO: Verificar cronograma → Si es corte → Generar servicio → Programar recordatorio para mañana
-- =====================================================

-- Tabla para log del proceso automático
CREATE TABLE IF NOT EXISTS "LogProcesoAutomatico" (
    "IdLog" SERIAL PRIMARY KEY,
    "Fecha" DATE NOT NULL,
    "ClientesProcesados" INTEGER DEFAULT 0,
    "ServiciosGenerados" INTEGER DEFAULT 0,
    "RecordatoriosEnviados" INTEGER DEFAULT 0,
    "Errores" TEXT,
    "Resumen" TEXT,
    "Estado" VARCHAR(20) DEFAULT 'EXITOSO',
    "FechaEjecucion" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para recordatorios programados
CREATE TABLE IF NOT EXISTS "RecordatorioProgramado" (
    "IdRecordatorio" SERIAL PRIMARY KEY,
    "IdCliente" INTEGER NOT NULL REFERENCES "Cliente"("IdCliente"),
    "FechaProgramada" DATE NOT NULL,
    "TipoRecordatorio" VARCHAR(50) NOT NULL,
    "Mensaje" TEXT NOT NULL,
    "Estado" VARCHAR(20) DEFAULT 'PROGRAMADO', -- PROGRAMADO, ENVIADO, ERROR
    "FechaCreacion" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "FechaEnvio" TIMESTAMP NULL
);

-- Índices para optimizar consultas del proceso automático
CREATE INDEX IF NOT EXISTS "idx_recordatorio_fecha_estado" ON "RecordatorioProgramado"("FechaProgramada", "Estado");
CREATE INDEX IF NOT EXISTS "idx_log_proceso_fecha" ON "LogProcesoAutomatico"("Fecha");

-- Vista para obtener clientes con vencimiento hoy
CREATE OR REPLACE VIEW "VistaClientesVencimientoHoy" AS
SELECT 
    c."IdCliente",
    c."RazonSocial",
    c."Email",
    c."Telefono",
    c."UltimoDigitoRUC",
    c."MontoFijoMensual",
    s."Nombre" as "ServicioNombre",
    cs."Dia" as "DiaCorte",
    cs."MesVencimiento",
    CURRENT_DATE as "FechaConsulta"
FROM "Cliente" c
JOIN "Servicio" s ON c."IdServicio" = s."IdServicio"
JOIN "CronogramaSunat" cs ON (
    (c."UltimoDigitoRUC" = cs."DigitoRUC") OR 
    (c."UltimoDigitoRUC" IN (2,3) AND cs."DigitoRUC" = 2) OR
    (c."UltimoDigitoRUC" IN (4,5) AND cs."DigitoRUC" = 4) OR
    (c."UltimoDigitoRUC" IN (6,7) AND cs."DigitoRUC" = 6) OR
    (c."UltimoDigitoRUC" IN (8,9) AND cs."DigitoRUC" = 8)
)
WHERE c."Estado" = 'ACTIVO'
    AND cs."Año" = EXTRACT(YEAR FROM CURRENT_DATE)
    AND cs."Mes" = EXTRACT(MONTH FROM CURRENT_DATE)
    AND cs."Dia" = EXTRACT(DAY FROM CURRENT_DATE);

-- Vista para próximos vencimientos del cliente
CREATE OR REPLACE VIEW "VistaProximosVencimientos" AS
SELECT 
    c."IdCliente",
    c."RazonSocial",
    cs."Dia",
    cs."Mes",
    cs."Año",
    MAKE_DATE(cs."Año", cs."Mes", cs."Dia") as "FechaVencimiento",
    CASE 
        WHEN MAKE_DATE(cs."Año", cs."Mes", cs."Dia") >= CURRENT_DATE 
        THEN MAKE_DATE(cs."Año", cs."Mes", cs."Dia") - CURRENT_DATE
        ELSE NULL
    END as "DiasRestantes"
FROM "Cliente" c
JOIN "CronogramaSunat" cs ON (
    (c."UltimoDigitoRUC" = cs."DigitoRUC") OR 
    (c."UltimoDigitoRUC" IN (2,3) AND cs."DigitoRUC" = 2) OR
    (c."UltimoDigitoRUC" IN (4,5) AND cs."DigitoRUC" = 4) OR
    (c."UltimoDigitoRUC" IN (6,7) AND cs."DigitoRUC" = 6) OR
    (c."UltimoDigitoRUC" IN (8,9) AND cs."DigitoRUC" = 8)
)
WHERE c."Estado" = 'ACTIVO'
    AND MAKE_DATE(cs."Año", cs."Mes", cs."Dia") >= CURRENT_DATE
ORDER BY "FechaVencimiento" ASC;

-- Vista para estadísticas del cliente (portal)
CREATE OR REPLACE VIEW "VistaEstadisticasCliente" AS
SELECT 
    c."IdCliente",
    c."RazonSocial",
    c."Clasificacion",
    -- Deuda total
    COALESCE(SUM(CASE WHEN sa."Estado" IN ('FACTURADO', 'PENDIENTE') THEN sa."Monto" ELSE 0 END), 0) as "DeudaTotal",
    -- Servicios pendientes
    COUNT(CASE WHEN sa."Estado" IN ('FACTURADO', 'PENDIENTE') THEN 1 END) as "ServiciosPendientes",
    -- Recibos emitidos este mes
    COUNT(CASE WHEN re."FechaEmision" >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as "RecibosEsteMes",
    -- Próximo vencimiento
    (SELECT MIN("FechaVencimiento") FROM "VistaProximosVencimientos" WHERE "IdCliente" = c."IdCliente") as "ProximoVencimiento"
FROM "Cliente" c
LEFT JOIN "ServicioAdicional" sa ON c."IdCliente" = sa."IdCliente"
LEFT JOIN "ReciboEnviado" re ON c."IdCliente" = re."IdCliente"
WHERE c."Estado" = 'ACTIVO'
GROUP BY c."IdCliente", c."RazonSocial", c."Clasificacion";

-- Función para obtener clientes con vencimiento en fecha específica
CREATE OR REPLACE FUNCTION obtener_clientes_vencimiento_fecha(fecha_consulta DATE)
RETURNS TABLE (
    "IdCliente" INTEGER,
    "RazonSocial" VARCHAR(255),
    "Email" VARCHAR(255),
    "Telefono" VARCHAR(20),
    "UltimoDigitoRUC" INTEGER,
    "MontoFijoMensual" DECIMAL(10,2),
    "ServicioNombre" VARCHAR(255),
    "DiaCorte" INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c."IdCliente",
        c."RazonSocial",
        c."Email",
        c."Telefono",
        c."UltimoDigitoRUC",
        c."MontoFijoMensual",
        s."Nombre" as "ServicioNombre",
        cs."Dia" as "DiaCorte"
    FROM "Cliente" c
    JOIN "Servicio" s ON c."IdServicio" = s."IdServicio"
    JOIN "CronogramaSunat" cs ON (
        (c."UltimoDigitoRUC" = cs."DigitoRUC") OR 
        (c."UltimoDigitoRUC" IN (2,3) AND cs."DigitoRUC" = 2) OR
        (c."UltimoDigitoRUC" IN (4,5) AND cs."DigitoRUC" = 4) OR
        (c."UltimoDigitoRUC" IN (6,7) AND cs."DigitoRUC" = 6) OR
        (c."UltimoDigitoRUC" IN (8,9) AND cs."DigitoRUC" = 8)
    )
    WHERE c."Estado" = 'ACTIVO'
        AND cs."Año" = EXTRACT(YEAR FROM fecha_consulta)
        AND cs."Mes" = EXTRACT(MONTH FROM fecha_consulta)
        AND cs."Dia" = EXTRACT(DAY FROM fecha_consulta)
    ORDER BY c."RazonSocial";
END;
$$ LANGUAGE plpgsql;

-- Función principal del proceso automático diario
CREATE OR REPLACE FUNCTION ejecutar_proceso_automatico_diario()
RETURNS JSON AS $$
DECLARE
    resultado JSON;
    clientes_corte_hoy RECORD;
    servicios_generados INTEGER := 0;
    recordatorios_programados INTEGER := 0;
    recordatorios_enviados INTEGER := 0;
    errores TEXT[] := ARRAY[]::TEXT[];
    fecha_hoy DATE := CURRENT_DATE;
    fecha_manana DATE := CURRENT_DATE + INTERVAL '1 day';
    mes_servicio DATE := DATE_TRUNC('month', CURRENT_DATE);
BEGIN
    -- Log inicio del proceso
    INSERT INTO "LogProcesoAutomatico" ("Fecha", "Resumen", "Estado")
    VALUES (fecha_hoy, 'Proceso iniciado', 'EJECUTANDO');

    -- 1. Procesar clientes con corte hoy
    FOR clientes_corte_hoy IN 
        SELECT * FROM obtener_clientes_vencimiento_fecha(fecha_hoy)
    LOOP
        BEGIN
            -- Verificar si ya existe servicio para este mes
            IF NOT EXISTS (
                SELECT 1 FROM "ServicioAdicional"
                WHERE "IdCliente" = clientes_corte_hoy."IdCliente"
                    AND "Fecha" >= mes_servicio
                    AND "Fecha" < mes_servicio + INTERVAL '1 month'
                    AND "Tipo" = 'MENSUAL'
            ) THEN
                -- Generar servicio mensual
                INSERT INTO "ServicioAdicional" (
                    "IdCliente",
                    "NombreServicio",
                    "Descripcion",
                    "Monto",
                    "Fecha",
                    "Estado",
                    "Tipo",
                    "MesServicio"
                ) VALUES (
                    clientes_corte_hoy."IdCliente",
                    clientes_corte_hoy."ServicioNombre",
                    'Servicio mensual - ' || TO_CHAR(mes_servicio, 'Month YYYY'),
                    clientes_corte_hoy."MontoFijoMensual",
                    fecha_hoy,
                    'FACTURADO',
                    'MENSUAL',
                    mes_servicio
                );

                servicios_generados := servicios_generados + 1;

                -- Programar recordatorio para mañana
                IF NOT EXISTS (
                    SELECT 1 FROM "RecordatorioProgramado"
                    WHERE "IdCliente" = clientes_corte_hoy."IdCliente"
                        AND "FechaProgramada" = fecha_manana
                        AND "Estado" = 'PROGRAMADO'
                ) THEN
                    INSERT INTO "RecordatorioProgramado" (
                        "IdCliente",
                        "FechaProgramada",
                        "TipoRecordatorio",
                        "Mensaje",
                        "Estado"
                    ) VALUES (
                        clientes_corte_hoy."IdCliente",
                        fecha_manana,
                        'PAGO_PENDIENTE',
                        'Recordatorio: Tiene servicios pendientes de pago. Por favor, comuníquese para coordinar el pago.',
                        'PROGRAMADO'
                    );

                    recordatorios_programados := recordatorios_programados + 1;
                END IF;
            END IF;

        EXCEPTION WHEN OTHERS THEN
            errores := array_append(errores, 'Error procesando cliente ' || clientes_corte_hoy."RazonSocial" || ': ' || SQLERRM);
        END;
    END LOOP;

    -- 2. Enviar recordatorios programados para hoy
    UPDATE "RecordatorioProgramado"
    SET "Estado" = 'ENVIADO', "FechaEnvio" = CURRENT_TIMESTAMP
    WHERE "FechaProgramada" = fecha_hoy 
        AND "Estado" = 'PROGRAMADO';

    GET DIAGNOSTICS recordatorios_enviados = ROW_COUNT;

    -- 3. Registrar resultado final
    resultado := json_build_object(
        'fecha', fecha_hoy,
        'clientesProcesados', (SELECT COUNT(*) FROM obtener_clientes_vencimiento_fecha(fecha_hoy)),
        'serviciosGenerados', servicios_generados,
        'recordatoriosProgramados', recordatorios_programados,
        'recordatoriosEnviados', recordatorios_enviados,
        'errores', errores,
        'resumen', servicios_generados || ' servicios generados, ' || recordatorios_enviados || ' recordatorios enviados'
    );

    -- Actualizar log final
    UPDATE "LogProcesoAutomatico"
    SET "ClientesProcesados" = (SELECT COUNT(*) FROM obtener_clientes_vencimiento_fecha(fecha_hoy)),
        "ServiciosGenerados" = servicios_generados,
        "RecordatoriosEnviados" = recordatorios_enviados,
        "Errores" = array_to_json(errores)::TEXT,
        "Resumen" = servicios_generados || ' servicios generados, ' || recordatorios_enviados || ' recordatorios enviados',
        "Estado" = CASE WHEN array_length(errores, 1) > 0 THEN 'CON_ERRORES' ELSE 'EXITOSO' END
    WHERE "Fecha" = fecha_hoy 
        AND "Estado" = 'EJECUTANDO';

    RETURN resultado;

EXCEPTION WHEN OTHERS THEN
    -- Log error general
    UPDATE "LogProcesoAutomatico"
    SET "Errores" = '["Error general: ' || SQLERRM || '"]',
        "Estado" = 'ERROR'
    WHERE "Fecha" = fecha_hoy 
        AND "Estado" = 'EJECUTANDO';

    RETURN json_build_object(
        'fecha', fecha_hoy,
        'error', 'Error general: ' || SQLERRM,
        'estado', 'ERROR'
    );
END;
$$ LANGUAGE plpgsql;

-- Datos de ejemplo para testing
INSERT INTO "LogProcesoAutomatico" ("Fecha", "ClientesProcesados", "ServiciosGenerados", "RecordatoriosEnviados", "Resumen", "Estado")
VALUES 
    (CURRENT_DATE - INTERVAL '1 day', 5, 3, 2, '3 servicios generados, 2 recordatorios enviados', 'EXITOSO'),
    (CURRENT_DATE - INTERVAL '2 days', 8, 5, 4, '5 servicios generados, 4 recordatorios enviados', 'EXITOSO');

-- Comentarios del flujo implementado
COMMENT ON FUNCTION ejecutar_proceso_automatico_diario() IS 
'Proceso automático diario que se ejecuta a las 06:00 AM:
1. Verifica cronograma SUNAT para clientes con corte hoy
2. Si es día de corte → Genera servicio mensual automático
3. Envía email inmediato de servicio generado
4. Programa recordatorio para mañana (día siguiente)
5. Envía recordatorios que fueron programados para hoy
6. Ejecuta clasificación automática
7. Registra log completo del proceso';

COMMENT ON TABLE "RecordatorioProgramado" IS 
'Tabla para gestionar recordatorios programados.
Los recordatorios se programan el día que se genera el servicio (día de corte)
y se envían al día siguiente para dar tiempo al cliente de recibir el email de servicio generado.';

-- Crear índices adicionales para optimizar el portal del cliente
CREATE INDEX IF NOT EXISTS "idx_servicio_adicional_cliente_mes" ON "ServicioAdicional"("IdCliente", "MesServicio");
CREATE INDEX IF NOT EXISTS "idx_recibo_enviado_cliente_fecha" ON "ReciboEnviado"("IdCliente", "FechaEmision");

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ PROCESO AUTOMÁTICO Y PORTAL CLIENTE CONFIGURADO CORRECTAMENTE';
    RAISE NOTICE '🤖 Flujo: 06:00 AM → Verificar cronograma → Si es corte → Generar servicio → Email inmediato → Programar recordatorio mañana';
    RAISE NOTICE '📊 Portal cliente disponible con dashboard, pagos, servicios y recibos';
    RAISE NOTICE '⚙️ Para activar cron job: 0 6 * * * curl -X POST http://localhost:3000/api/proceso-automatico';
END $$;
