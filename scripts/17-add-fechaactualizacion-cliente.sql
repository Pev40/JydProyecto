-- Migración 17: Agregar columna FechaActualizacion a tabla Cliente
-- Fecha: 2025-09-05
-- Descripción: Agrega la columna FechaActualizacion para rastrear cuando se actualiza un cliente

-- Agregar columna FechaActualizacion a la tabla Cliente
ALTER TABLE "Cliente" 
ADD COLUMN IF NOT EXISTS "FechaActualizacion" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Actualizar registros existentes con la fecha de registro como fecha de actualización inicial
UPDATE "Cliente" 
SET "FechaActualizacion" = "FechaRegistro" 
WHERE "FechaActualizacion" IS NULL;

-- Crear trigger para actualizar automáticamente FechaActualizacion
CREATE OR REPLACE FUNCTION update_cliente_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW."FechaActualizacion" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger en la tabla Cliente
DROP TRIGGER IF EXISTS trigger_update_cliente_fecha_actualizacion ON "Cliente";
CREATE TRIGGER trigger_update_cliente_fecha_actualizacion
    BEFORE UPDATE ON "Cliente"
    FOR EACH ROW
    EXECUTE FUNCTION update_cliente_fecha_actualizacion();

COMMENT ON COLUMN "Cliente"."FechaActualizacion" IS 'Fecha y hora de la última actualización del registro';
