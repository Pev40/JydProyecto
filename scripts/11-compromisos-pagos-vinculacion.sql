-- =====================================================
-- Script: Vinculación de Compromisos con Pagos
-- Descripción: Agrega funcionalidad para vincular compromisos de pago con pagos reales
-- Autor: Sistema de Cobranza J&D Consultores
-- Fecha: 2024
-- =====================================================

-- 1. Agregar columna para vincular compromisos con pagos
ALTER TABLE "CompromisoPago" 
ADD COLUMN IF NOT EXISTS "IdPagoVinculado" INTEGER REFERENCES "Pago"("IdPago");

-- 2. Agregar columna de fecha de actualización
ALTER TABLE "CompromisoPago" 
ADD COLUMN IF NOT EXISTS "FechaActualizacion" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 3. Agregar columna en Pago para referenciar compromiso (opcional)
ALTER TABLE "Pago" 
ADD COLUMN IF NOT EXISTS "IdCompromisoVinculado" INTEGER REFERENCES "CompromisoPago"("IdCompromisoPago");

-- 4. Crear tabla de historial de compromisos
CREATE TABLE IF NOT EXISTS "HistorialCompromiso" (
    "IdHistorial" SERIAL PRIMARY KEY,
    "IdCompromisoPago" INTEGER NOT NULL REFERENCES "CompromisoPago"("IdCompromisoPago"),
    "EstadoAnterior" VARCHAR(20),
    "EstadoNuevo" VARCHAR(20) NOT NULL,
    "IdPagoVinculado" INTEGER REFERENCES "Pago"("IdPago"),
    "FechaCambio" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "Observaciones" TEXT
);

-- 5. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS "idx_compromiso_pago_vinculado" ON "CompromisoPago"("IdPagoVinculado");
CREATE INDEX IF NOT EXISTS "idx_pago_compromiso_vinculado" ON "Pago"("IdCompromisoVinculado");
CREATE INDEX IF NOT EXISTS "idx_historial_compromiso_fecha" ON "HistorialCompromiso"("FechaCambio");

-- 6. Actualizar vista de compromisos para incluir información de pagos vinculados
CREATE OR REPLACE VIEW "VistaCompromisosPago" AS
SELECT 
    cp."IdCompromisoPago",
    cp."IdCliente",
    cp."FechaCompromiso",
    cp."MontoCompromiso",
    cp."Estado",
    cp."IdResponsable",
    cp."Observaciones",
    cp."FechaRegistro",
    cp."FechaActualizacion",
    cp."IdPagoVinculado",
    c."RazonSocial" as "ClienteRazonSocial",
    c."RucDni" as "ClienteRucDni",
    u."NombreCompleto" as "ResponsableNombre",
    p."Monto" as "MontoPagoVinculado",
    p."Fecha" as "FechaPagoVinculado",
    p."Estado" as "EstadoPagoVinculado",
    CASE 
        WHEN cp."Estado" = 'PENDIENTE' AND cp."FechaCompromiso" < CURRENT_DATE THEN 'VENCIDO'
        ELSE cp."Estado"
    END as "EstadoCalculado",
    CASE 
        WHEN cp."IdPagoVinculado" IS NOT NULL THEN true
        ELSE false
    END as "TienePagoVinculado"
FROM "CompromisoPago" cp
LEFT JOIN "Cliente" c ON cp."IdCliente" = c."IdCliente"
LEFT JOIN "Usuario" u ON cp."IdResponsable" = u."IdUsuario"
LEFT JOIN "Pago" p ON cp."IdPagoVinculado" = p."IdPago";

-- 7. Función para obtener compromisos pendientes de un cliente
CREATE OR REPLACE FUNCTION "ObtenerCompromisosPendientesCliente"(cliente_id INTEGER)
RETURNS TABLE (
    "IdCompromisoPago" INTEGER,
    "FechaCompromiso" DATE,
    "MontoCompromiso" DECIMAL(10,2),
    "Observaciones" TEXT,
    "DiasVencido" INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cp."IdCompromisoPago",
        cp."FechaCompromiso"::DATE,
        cp."MontoCompromiso",
        cp."Observaciones",
        CASE 
            WHEN cp."FechaCompromiso" < CURRENT_DATE THEN 
                EXTRACT(DAY FROM (CURRENT_DATE - cp."FechaCompromiso"::DATE))::INTEGER
            ELSE 0
        END as "DiasVencido"
    FROM "CompromisoPago" cp
    WHERE cp."IdCliente" = cliente_id 
        AND cp."Estado" = 'PENDIENTE'
        AND cp."IdPagoVinculado" IS NULL
    ORDER BY cp."FechaCompromiso" ASC;
END;
$$ LANGUAGE plpgsql;

-- 8. Función para vincular automáticamente compromiso con pago
CREATE OR REPLACE FUNCTION "VincularCompromisoPago"(
    compromiso_id INTEGER,
    pago_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    compromiso_existe BOOLEAN := FALSE;
    pago_existe BOOLEAN := FALSE;
BEGIN
    -- Verificar que el compromiso existe y está pendiente
    SELECT EXISTS(
        SELECT 1 FROM "CompromisoPago" 
        WHERE "IdCompromisoPago" = compromiso_id 
            AND "Estado" = 'PENDIENTE'
            AND "IdPagoVinculado" IS NULL
    ) INTO compromiso_existe;
    
    -- Verificar que el pago existe
    SELECT EXISTS(
        SELECT 1 FROM "Pago" 
        WHERE "IdPago" = pago_id
    ) INTO pago_existe;
    
    IF NOT compromiso_existe THEN
        RAISE EXCEPTION 'Compromiso no encontrado o no está disponible para vinculación';
    END IF;
    
    IF NOT pago_existe THEN
        RAISE EXCEPTION 'Pago no encontrado';
    END IF;
    
    -- Realizar la vinculación
    UPDATE "CompromisoPago" 
    SET 
        "IdPagoVinculado" = pago_id,
        "Estado" = 'CUMPLIDO',
        "FechaActualizacion" = CURRENT_TIMESTAMP
    WHERE "IdCompromisoPago" = compromiso_id;
    
    -- Actualizar el pago también
    UPDATE "Pago"
    SET "IdCompromisoVinculado" = compromiso_id
    WHERE "IdPago" = pago_id;
    
    -- Registrar en historial
    INSERT INTO "HistorialCompromiso" (
        "IdCompromisoPago",
        "EstadoAnterior",
        "EstadoNuevo",
        "IdPagoVinculado",
        "Observaciones"
    ) VALUES (
        compromiso_id,
        'PENDIENTE',
        'CUMPLIDO',
        pago_id,
        'Compromiso cumplido automáticamente mediante pago vinculado'
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger para actualizar fecha de modificación
CREATE OR REPLACE FUNCTION "ActualizarFechaCompromiso"()
RETURNS TRIGGER AS $$
BEGIN
    NEW."FechaActualizacion" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "trigger_actualizar_fecha_compromiso" ON "CompromisoPago";
CREATE TRIGGER "trigger_actualizar_fecha_compromiso"
    BEFORE UPDATE ON "CompromisoPago"
    FOR EACH ROW
    EXECUTE FUNCTION "ActualizarFechaCompromiso"();

-- 10. Insertar datos de prueba para compromisos vinculados
INSERT INTO "CompromisoPago" (
    "IdCliente",
    "FechaCompromiso", 
    "MontoCompromiso",
    "Estado",
    "IdResponsable",
    "Observaciones"
) VALUES 
(1, '2024-01-20', 500.00, 'PENDIENTE', 1, 'Compromiso de pago mensual - Enero'),
(2, '2024-01-25', 800.00, 'PENDIENTE', 1, 'Compromiso de pago mensual - Enero'),
(3, '2024-01-15', 300.00, 'PENDIENTE', 2, 'Compromiso de regularización de deuda')
ON CONFLICT DO NOTHING;

-- 11. Comentarios y documentación
COMMENT ON COLUMN "CompromisoPago"."IdPagoVinculado" IS 'ID del pago que cumple este compromiso';
COMMENT ON COLUMN "Pago"."IdCompromisoVinculado" IS 'ID del compromiso que este pago cumple';
COMMENT ON TABLE "HistorialCompromiso" IS 'Historial de cambios en compromisos de pago';
COMMENT ON FUNCTION "VincularCompromisoPago" IS 'Vincula automáticamente un compromiso con un pago y actualiza estados';

-- =====================================================
-- Fin del script
-- =====================================================

SELECT 'Script de vinculación compromisos-pagos ejecutado exitosamente' as resultado;
