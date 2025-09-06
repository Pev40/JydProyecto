-- Tabla para historial de clasificaciones
CREATE TABLE IF NOT EXISTS "HistorialClasificacion" (
    "IdHistorialClasificacion" SERIAL PRIMARY KEY,
    "IdCliente" INTEGER NOT NULL REFERENCES "Cliente"("IdCliente"),
    "IdClasificacionAnterior" INTEGER REFERENCES "Clasificacion"("IdClasificacion"),
    "IdClasificacionNueva" INTEGER NOT NULL REFERENCES "Clasificacion"("IdClasificacion"),
    "IdResponsable" INTEGER REFERENCES "Usuario"("IdUsuario"),
    "Motivo" TEXT NOT NULL,
    "FechaCambio" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "MesesDeuda" INTEGER DEFAULT 0,
    "MontoDeuda" DECIMAL(10,2) DEFAULT 0
);

-- Tabla para recibos enviados (actualizada con servicios incluidos)
CREATE TABLE IF NOT EXISTS "ReciboEnviado" (
    "IdReciboEnviado" SERIAL PRIMARY KEY,
    "IdPago" INTEGER REFERENCES "Pago"("IdPago"),
    "IdCliente" INTEGER NOT NULL REFERENCES "Cliente"("IdCliente"),
    "NumeroRecibo" VARCHAR(20) NOT NULL UNIQUE,
    "EmailDestinatario" VARCHAR(255) NOT NULL,
    "Estado" VARCHAR(20) NOT NULL DEFAULT 'ENVIADO', -- ENVIADO, ERROR
    "FechaEnvio" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "MessageId" VARCHAR(255),
    "ErrorMensaje" TEXT,
    "ServiciosIncluidos" JSONB -- Almacena los servicios incluidos en el recibo
);

-- Tabla para detalle de qué servicios adicionales fueron pagados en cada pago
CREATE TABLE IF NOT EXISTS "DetallePagoServicio" (
    "IdDetallePagoServicio" SERIAL PRIMARY KEY,
    "IdPago" INTEGER NOT NULL REFERENCES "Pago"("IdPago"),
    "IdServicioAdicional" INTEGER REFERENCES "ServicioAdicional"("IdServicioAdicional"),
    "TipoServicio" VARCHAR(20) NOT NULL DEFAULT 'ADICIONAL', -- FIJO, ADICIONAL
    "Descripcion" TEXT,
    "Monto" DECIMAL(10,2) NOT NULL,
    "PeriodoServicio" DATE, -- Para servicios fijos mensuales
    "FechaRegistro" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Actualizar tabla ServicioAdicional si no existe
CREATE TABLE IF NOT EXISTS "ServicioAdicional" (
    "IdServicioAdicional" SERIAL PRIMARY KEY,
    "IdCliente" INTEGER NOT NULL REFERENCES "Cliente"("IdCliente"),
    "NombreServicio" VARCHAR(255) NOT NULL,
    "Descripcion" TEXT,
    "Monto" DECIMAL(10,2) NOT NULL,
    "Fecha" DATE NOT NULL,
    "Estado" VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE', -- PENDIENTE, FACTURADO, PAGADO, CANCELADO
    "IdResponsable" INTEGER REFERENCES "Usuario"("IdUsuario"),
    "FechaCreacion" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "FechaActualizacion" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS "idx_historial_clasificacion_cliente" ON "HistorialClasificacion"("IdCliente");
CREATE INDEX IF NOT EXISTS "idx_historial_clasificacion_fecha" ON "HistorialClasificacion"("FechaCambio");
CREATE INDEX IF NOT EXISTS "idx_recibo_enviado_cliente" ON "ReciboEnviado"("IdCliente");
CREATE INDEX IF NOT EXISTS "idx_recibo_enviado_pago" ON "ReciboEnviado"("IdPago");
CREATE INDEX IF NOT EXISTS "idx_recibo_enviado_fecha" ON "ReciboEnviado"("FechaEnvio");
CREATE INDEX IF NOT EXISTS "idx_recibo_enviado_estado" ON "ReciboEnviado"("Estado");
CREATE INDEX IF NOT EXISTS "idx_recibo_enviado_numero" ON "ReciboEnviado"("NumeroRecibo");
CREATE INDEX IF NOT EXISTS "idx_detalle_pago_servicio_pago" ON "DetallePagoServicio"("IdPago");
CREATE INDEX IF NOT EXISTS "idx_detalle_pago_servicio_adicional" ON "DetallePagoServicio"("IdServicioAdicional");
CREATE INDEX IF NOT EXISTS "idx_servicio_adicional_cliente" ON "ServicioAdicional"("IdCliente");
CREATE INDEX IF NOT EXISTS "idx_servicio_adicional_estado" ON "ServicioAdicional"("Estado");
CREATE INDEX IF NOT EXISTS "idx_servicio_adicional_fecha" ON "ServicioAdicional"("Fecha");

-- Función para generar número de recibo automático (formato: REC-YYYY-NNNNNN)
CREATE OR REPLACE FUNCTION generar_numero_recibo()
RETURNS TEXT AS $$
DECLARE
    ultimo_numero INTEGER;
    nuevo_numero TEXT;
    año_actual INTEGER;
BEGIN
    año_actual := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Obtener el último número de recibo del año actual
    SELECT COALESCE(
        MAX(CAST(SUBSTRING("NumeroRecibo" FROM 10) AS INTEGER)), 
        0
    ) INTO ultimo_numero
    FROM "ReciboEnviado" 
    WHERE "NumeroRecibo" ~ ('^REC-' || año_actual || '-[0-9]+$');
    
    -- Generar nuevo número
    nuevo_numero := 'REC-' || año_actual || '-' || LPAD((ultimo_numero + 1)::TEXT, 6, '0');
    
    RETURN nuevo_numero;
END;
$$ LANGUAGE plpgsql;

-- Trigger para generar número de recibo automáticamente
CREATE OR REPLACE FUNCTION trigger_generar_numero_recibo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."NumeroRecibo" IS NULL OR NEW."NumeroRecibo" = '' THEN
        NEW."NumeroRecibo" := generar_numero_recibo();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "trigger_recibo_numero"
    BEFORE INSERT ON "ReciboEnviado"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generar_numero_recibo();

-- Trigger para actualizar fecha de actualización en ServicioAdicional
CREATE OR REPLACE FUNCTION trigger_actualizar_fecha_servicio_adicional()
RETURNS TRIGGER AS $$
BEGIN
    NEW."FechaActualizacion" := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "trigger_servicio_adicional_fecha"
    BEFORE UPDATE ON "ServicioAdicional"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_actualizar_fecha_servicio_adicional();

-- Función para calcular deuda de un cliente considerando cronograma SUNAT
CREATE OR REPLACE FUNCTION calcular_deuda_cliente(cliente_id INTEGER)
RETURNS TABLE(
    meses_transcurridos INTEGER,
    monto_esperado_fijo DECIMAL(10,2),
    monto_servicios_adicionales DECIMAL(10,2),
    monto_total_esperado DECIMAL(10,2),
    monto_pagado DECIMAL(10,2),
    monto_deuda DECIMAL(10,2),
    meses_deuda INTEGER
) AS $$
DECLARE
    cliente_record RECORD;
    fecha_actual DATE;
    meses_calc INTEGER;
BEGIN
    fecha_actual := CURRENT_DATE;
    
    -- Obtener información del cliente
    SELECT 
        c."MontoFijoMensual",
        c."FechaRegistro"
    INTO cliente_record
    FROM "Cliente" c
    WHERE c."IdCliente" = cliente_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Calcular meses transcurridos desde el registro
    meses_calc := GREATEST(1, 
        EXTRACT(YEAR FROM AGE(fecha_actual, cliente_record."FechaRegistro")) * 12 + 
        EXTRACT(MONTH FROM AGE(fecha_actual, cliente_record."FechaRegistro")) + 1
    );
    
    -- Calcular monto esperado del servicio fijo
    monto_esperado_fijo := cliente_record."MontoFijoMensual" * meses_calc;
    
    -- Calcular monto de servicios adicionales facturados
    SELECT COALESCE(SUM("Monto"), 0)
    INTO monto_servicios_adicionales
    FROM "ServicioAdicional"
    WHERE "IdCliente" = cliente_id AND "Estado" = 'FACTURADO';
    
    -- Calcular monto total esperado
    monto_total_esperado := monto_esperado_fijo + monto_servicios_adicionales;
    
    -- Calcular monto pagado (confirmado)
    SELECT COALESCE(SUM("Monto"), 0)
    INTO monto_pagado
    FROM "Pago"
    WHERE "IdCliente" = cliente_id AND "Estado" = 'CONFIRMADO';
    
    -- Calcular deuda
    monto_deuda := GREATEST(0, monto_total_esperado - monto_pagado);
    
    -- Calcular meses de deuda
    meses_deuda := CASE 
        WHEN cliente_record."MontoFijoMensual" > 0 THEN
            FLOOR(monto_deuda / cliente_record."MontoFijoMensual")
        ELSE 0
    END;
    
    -- Retornar resultados
    meses_transcurridos := meses_calc;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar recibos antiguos (opcional - ejecutar manualmente)
CREATE OR REPLACE FUNCTION limpiar_recibos_antiguos(meses_antiguedad INTEGER DEFAULT 24)
RETURNS INTEGER AS $$
DECLARE
    registros_eliminados INTEGER;
BEGIN
    DELETE FROM "ReciboEnviado" 
    WHERE "FechaEnvio" < CURRENT_DATE - INTERVAL '1 month' * meses_antiguedad;
    
    GET DIAGNOSTICS registros_eliminados = ROW_COUNT;
    RETURN registros_eliminados;
END;
$$ LANGUAGE plpgsql;

-- Vista para estadísticas de recibos
CREATE OR REPLACE VIEW "VistaEstadisticasRecibos" AS
SELECT 
    COUNT(*) as "TotalRecibos",
    COUNT(CASE WHEN "Estado" = 'ENVIADO' THEN 1 END) as "RecibosEnviados",
    COUNT(CASE WHEN "Estado" = 'ERROR' THEN 1 END) as "RecibosConError",
    COUNT(CASE WHEN DATE("FechaEnvio") = CURRENT_DATE THEN 1 END) as "RecibosHoy",
    COUNT(CASE WHEN DATE("FechaEnvio") >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as "RecibosMesActual",
    COUNT(CASE WHEN DATE("FechaEnvio") >= DATE_TRUNC('year', CURRENT_DATE) THEN 1 END) as "RecibosAñoActual",
    COALESCE(SUM(
        CASE WHEN "Estado" = 'ENVIADO' THEN 
            (SELECT p."Monto" FROM "Pago" p WHERE p."IdPago" = "ReciboEnviado"."IdPago")
        END
    ), 0) as "MontoTotalRecibos"
FROM "ReciboEnviado";

-- Vista para historial de clasificaciones con nombres
CREATE OR REPLACE VIEW "VistaHistorialClasificacion" AS
SELECT 
    h."IdHistorialClasificacion",
    h."IdCliente",
    c."RazonSocial" as "ClienteNombre",
    ca."Codigo" as "ClasificacionAnterior",
    ca."Descripcion" as "DescripcionAnterior",
    cn."Codigo" as "ClasificacionNueva", 
    cn."Descripcion" as "DescripcionNueva",
    h."Motivo",
    h."FechaCambio",
    h."MesesDeuda",
    h."MontoDeuda",
    u."Nombre" as "ResponsableNombre"
FROM "HistorialClasificacion" h
JOIN "Cliente" c ON h."IdCliente" = c."IdCliente"
LEFT JOIN "Clasificacion" ca ON h."IdClasificacionAnterior" = ca."IdClasificacion"
JOIN "Clasificacion" cn ON h."IdClasificacionNueva" = cn."IdClasificacion"
LEFT JOIN "Usuario" u ON h."IdResponsable" = u."IdUsuario";

-- Vista para análisis de servicios adicionales por cliente
CREATE OR REPLACE VIEW "VistaServiciosAdicionalesCliente" AS
SELECT 
    c."IdCliente",
    c."RazonSocial",
    COUNT(sa."IdServicioAdicional") as "TotalServicios",
    COUNT(CASE WHEN sa."Estado" = 'PENDIENTE' THEN 1 END) as "ServiciosPendientes",
    COUNT(CASE WHEN sa."Estado" = 'FACTURADO' THEN 1 END) as "ServiciosFacturados",
    COUNT(CASE WHEN sa."Estado" = 'PAGADO' THEN 1 END) as "ServiciosPagados",
    COALESCE(SUM(CASE WHEN sa."Estado" = 'FACTURADO' THEN sa."Monto" END), 0) as "MontoFacturado",
    COALESCE(SUM(CASE WHEN sa."Estado" = 'PAGADO' THEN sa."Monto" END), 0) as "MontoPagado"
FROM "Cliente" c
LEFT JOIN "ServicioAdicional" sa ON c."IdCliente" = sa."IdCliente"
GROUP BY c."IdCliente", c."RazonSocial";

-- Vista para cronograma de vencimientos SUNAT
CREATE OR REPLACE VIEW "VistaVencimientosSunat" AS
SELECT 
    c."IdCliente",
    c."RazonSocial",
    c."RucDni",
    c."UltimoDigitoRUC",
    cs."Año",
    cs."Mes",
    cs."Dia",
    cs."MesVencimiento",
    MAKE_DATE(cs."Año", cs."MesVencimiento", cs."Dia") as "FechaVencimiento",
    CASE 
        WHEN MAKE_DATE(cs."Año", cs."MesVencimiento", cs."Dia") < CURRENT_DATE THEN 'VENCIDO'
        WHEN MAKE_DATE(cs."Año", cs."MesVencimiento", cs."Dia") <= CURRENT_DATE + INTERVAL '7 days' THEN 'PROXIMO'
        ELSE 'FUTURO'
    END as "EstadoVencimiento"
FROM "Cliente" c
JOIN "CronogramaSunat" cs ON (
    (c."UltimoDigitoRUC" = cs."DigitoRUC") OR 
    (c."UltimoDigitoRUC" IN (2,3) AND cs."DigitoRUC" = 2) OR
    (c."UltimoDigitoRUC" IN (4,5) AND cs."DigitoRUC" = 4) OR
    (c."UltimoDigitoRUC" IN (6,7) AND cs."DigitoRUC" = 6) OR
    (c."UltimoDigitoRUC" IN (8,9) AND cs."DigitoRUC" = 8)
)
WHERE c."Estado" = 'ACTIVO'
ORDER BY cs."Año", cs."MesVencimiento", cs."Dia";

-- Insertar algunos registros de ejemplo en el historial de clasificaciones
INSERT INTO "HistorialClasificacion" ("IdCliente", "IdClasificacionAnterior", "IdClasificacionNueva", "IdResponsable", "Motivo", "MesesDeuda", "MontoDeuda") 
SELECT 
    c."IdCliente",
    NULL,
    c."IdClasificacion",
    1,
    'Clasificación inicial del sistema',
    0,
    0
FROM "Cliente" c 
WHERE NOT EXISTS (
    SELECT 1 FROM "HistorialClasificacion" h WHERE h."IdCliente" = c."IdCliente"
)
LIMIT 10;

-- Insertar algunos servicios adicionales de ejemplo
INSERT INTO "ServicioAdicional" ("IdCliente", "NombreServicio", "Descripcion", "Monto", "Fecha", "Estado", "IdResponsable")
SELECT 
    c."IdCliente",
    'Consultoría Tributaria',
    'Asesoría especializada en temas tributarios - ' || TO_CHAR(CURRENT_DATE, 'Month YYYY'),
    500.00,
    CURRENT_DATE,
    'FACTURADO',
    1
FROM "Cliente" c
WHERE c."Estado" = 'ACTIVO'
  AND NOT EXISTS (
    SELECT 1 FROM "ServicioAdicional" sa 
    WHERE sa."IdCliente" = c."IdCliente" 
      AND sa."NombreServicio" = 'Consultoría Tributaria'
  )
LIMIT 5;

-- Comentarios en las tablas
COMMENT ON TABLE "HistorialClasificacion" IS 'Historial de cambios de clasificación de clientes con motivos y responsables';
COMMENT ON TABLE "ReciboEnviado" IS 'Registro de recibos enviados por email a los clientes con estado de entrega';
COMMENT ON TABLE "DetallePagoServicio" IS 'Detalle de qué servicios (fijos y adicionales) fueron cubiertos por cada pago';
COMMENT ON TABLE "ServicioAdicional" IS 'Servicios adicionales que se facturan a los clientes además del servicio fijo mensual';

COMMENT ON COLUMN "HistorialClasificacion"."MesesDeuda" IS 'Número de meses de deuda que motivaron el cambio de clasificación';
COMMENT ON COLUMN "HistorialClasificacion"."MontoDeuda" IS 'Monto total de deuda al momento del cambio de clasificación';
COMMENT ON COLUMN "ReciboEnviado"."NumeroRecibo" IS 'Número único del recibo generado automáticamente (REC-YYYY-NNNNNN)';
COMMENT ON COLUMN "ReciboEnviado"."MessageId" IS 'ID del mensaje de email para tracking de entrega';
COMMENT ON COLUMN "ReciboEnviado"."ServiciosIncluidos" IS 'JSON con los servicios incluidos en el recibo (fijos y adicionales)';
COMMENT ON COLUMN "DetallePagoServicio"."TipoServicio" IS 'FIJO para servicios mensuales, ADICIONAL para servicios extras';
COMMENT ON COLUMN "DetallePagoServicio"."PeriodoServicio" IS 'Mes/año al que corresponde el servicio fijo pagado';
COMMENT ON COLUMN "ServicioAdicional"."Estado" IS 'PENDIENTE: creado, FACTURADO: listo para cobrar, PAGADO: cobrado, CANCELADO: anulado';

-- Crear índices compuestos para consultas frecuentes
CREATE INDEX IF NOT EXISTS "idx_recibo_cliente_fecha" ON "ReciboEnviado"("IdCliente", "FechaEnvio" DESC);
CREATE INDEX IF NOT EXISTS "idx_historial_cliente_fecha" ON "HistorialClasificacion"("IdCliente", "FechaCambio" DESC);
CREATE INDEX IF NOT EXISTS "idx_servicio_adicional_cliente_estado" ON "ServicioAdicional"("IdCliente", "Estado");
CREATE INDEX IF NOT EXISTS "idx_detalle_pago_tipo_periodo" ON "DetallePagoServicio"("TipoServicio", "PeriodoServicio");

-- Función para obtener próximos vencimientos SUNAT
CREATE OR REPLACE FUNCTION obtener_proximos_vencimientos(dias_adelante INTEGER DEFAULT 30)
RETURNS TABLE(
    cliente_id INTEGER,
    razon_social VARCHAR(255),
    ruc_dni VARCHAR(20),
    ultimo_digito INTEGER,
    fecha_vencimiento DATE,
    dias_restantes INTEGER,
    monto_esperado DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v."IdCliente",
        v."RazonSocial",
        v."RucDni",
        v."UltimoDigitoRUC",
        v."FechaVencimiento",
        (v."FechaVencimiento" - CURRENT_DATE)::INTEGER,
        c."MontoFijoMensual"
    FROM "VistaVencimientosSunat" v
    JOIN "Cliente" c ON v."IdCliente" = c."IdCliente"
    WHERE v."FechaVencimiento" BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '1 day' * dias_adelante
      AND v."EstadoVencimiento" IN ('PROXIMO', 'FUTURO')
    ORDER BY v."FechaVencimiento", v."RazonSocial";
END;
$$ LANGUAGE plpgsql;

-- Función para ejecutar clasificación automática (llamada desde la aplicación)
CREATE OR REPLACE FUNCTION ejecutar_clasificacion_automatica()
RETURNS TABLE(
    cliente_id INTEGER,
    razon_social VARCHAR(255),
    clasificacion_actual VARCHAR(1),
    nueva_clasificacion VARCHAR(1),
    meses_deuda INTEGER,
    monto_deuda DECIMAL(10,2),
    requiere_cambio BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH deudas_cliente AS (
        SELECT * FROM calcular_deuda_cliente(c."IdCliente") cd
        JOIN "Cliente" c ON TRUE
        WHERE c."Estado" = 'ACTIVO'
    ),
    clasificaciones AS (
        SELECT 
            dc.cliente_id,
            c."RazonSocial",
            cl."Codigo" as clasificacion_actual,
            CASE 
                WHEN dc.meses_deuda = 0 THEN 'A'
                WHEN dc.meses_deuda <= 2 THEN 'B'
                ELSE 'C'
            END as nueva_clasificacion,
            dc.meses_deuda,
            dc.monto_deuda
        FROM deudas_cliente dc
        JOIN "Cliente" c ON dc.cliente_id = c."IdCliente"
        JOIN "Clasificacion" cl ON c."IdClasificacion" = cl."IdClasificacion"
    )
    SELECT 
        cls.cliente_id,
        cls."RazonSocial",
        cls.clasificacion_actual,
        cls.nueva_clasificacion,
        cls.meses_deuda,
        cls.monto_deuda,
        (cls.clasificacion_actual != cls.nueva_clasificacion) as requiere_cambio
    FROM clasificaciones cls
    ORDER BY cls."RazonSocial";
END;
$$ LANGUAGE plpgsql;

-- Crear secuencia para números de recibo si no existe
CREATE SEQUENCE IF NOT EXISTS "seq_numero_recibo" START 1;

-- Función optimizada para generar número de recibo
CREATE OR REPLACE FUNCTION generar_numero_recibo_optimizado()
RETURNS TEXT AS $$
DECLARE
    año_actual INTEGER;
    siguiente_numero INTEGER;
BEGIN
    año_actual := EXTRACT(YEAR FROM CURRENT_DATE);
    siguiente_numero := nextval('seq_numero_recibo');
    
    RETURN 'REC-' || año_actual || '-' || LPAD(siguiente_numero::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Actualizar trigger para usar la función optimizada
DROP TRIGGER IF EXISTS "trigger_recibo_numero" ON "ReciboEnviado";

CREATE OR REPLACE FUNCTION trigger_generar_numero_recibo_optimizado()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."NumeroRecibo" IS NULL OR NEW."NumeroRecibo" = '' THEN
        NEW."NumeroRecibo" := generar_numero_recibo_optimizado();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "trigger_recibo_numero_optimizado"
    BEFORE INSERT ON "ReciboEnviado"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generar_numero_recibo_optimizado();
