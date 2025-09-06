-- Agregar columna Observaciones a la tabla Pago
-- Script de migración para agregar funcionalidad de observaciones en pagos

-- Verificar si la columna ya existe antes de agregarla
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Pago' 
        AND column_name = 'Observaciones'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "Pago" ADD COLUMN "Observaciones" TEXT;
        RAISE NOTICE 'Columna Observaciones agregada a la tabla Pago';
    ELSE
        RAISE NOTICE 'La columna Observaciones ya existe en la tabla Pago';
    END IF;
END $$;

-- Comentario sobre la columna
COMMENT ON COLUMN "Pago"."Observaciones" IS 'Observaciones adicionales sobre el pago, como número de operación, detalles del comprobante, etc.';
