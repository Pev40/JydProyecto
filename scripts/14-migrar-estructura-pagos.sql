-- Migración completa para estructura de pagos y servicios
-- Script para actualizar la base de datos con las tablas y columnas faltantes

-- 1. Agregar columna Observaciones a la tabla Pago (si no existe)
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

-- 2. Actualizar tabla DetallePagoServicio para incluir todas las columnas necesarias
DO $$
BEGIN
    -- Verificar si la tabla existe
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'DetallePagoServicio' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'Tabla DetallePagoServicio existe, actualizando estructura...';
        
        -- Agregar columna TipoServicio si no existe
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'DetallePagoServicio' 
            AND column_name = 'TipoServicio'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE "DetallePagoServicio" ADD COLUMN "TipoServicio" VARCHAR(20) NOT NULL DEFAULT 'FIJO';
            RAISE NOTICE 'Columna TipoServicio agregada a DetallePagoServicio';
        END IF;
        
        -- Agregar columna Descripcion si no existe
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'DetallePagoServicio' 
            AND column_name = 'Descripcion'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE "DetallePagoServicio" ADD COLUMN "Descripcion" TEXT;
            RAISE NOTICE 'Columna Descripcion agregada a DetallePagoServicio';
        END IF;
        
        -- Agregar columna PeriodoServicio si no existe
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'DetallePagoServicio' 
            AND column_name = 'PeriodoServicio'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE "DetallePagoServicio" ADD COLUMN "PeriodoServicio" DATE;
            RAISE NOTICE 'Columna PeriodoServicio agregada a DetallePagoServicio';
        END IF;
        
        -- Agregar columna IdServicioAdicional si no existe
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'DetallePagoServicio' 
            AND column_name = 'IdServicioAdicional'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE "DetallePagoServicio" ADD COLUMN "IdServicioAdicional" INTEGER;
            RAISE NOTICE 'Columna IdServicioAdicional agregada a DetallePagoServicio';
        END IF;
        
    ELSE
        RAISE NOTICE 'Tabla DetallePagoServicio no existe, creando...';
        CREATE TABLE "DetallePagoServicio" (
            "IdDetallePagoServicio" SERIAL PRIMARY KEY,
            "IdPago" INTEGER NOT NULL,
            "IdServicioAdicional" INTEGER,
            "TipoServicio" VARCHAR(20) NOT NULL DEFAULT 'FIJO',
            "Descripcion" TEXT,
            "Monto" DECIMAL(10,2) NOT NULL,
            "PeriodoServicio" DATE,
            "FechaRegistro" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY ("IdPago") REFERENCES "Pago"("IdPago")
        );
        RAISE NOTICE 'Tabla DetallePagoServicio creada';
    END IF;
END $$;

-- 3. Crear tabla ServicioAdicional si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'ServicioAdicional' 
        AND table_schema = 'public'
    ) THEN
        CREATE TABLE "ServicioAdicional" (
            "IdServicioAdicional" SERIAL PRIMARY KEY,
            "IdCliente" INTEGER NOT NULL,
            "NombreServicio" VARCHAR(255) NOT NULL,
            "Descripcion" TEXT,
            "Monto" DECIMAL(10,2) NOT NULL,
            "Fecha" DATE NOT NULL,
            "Estado" VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
            "IdResponsable" INTEGER,
            "FechaCreacion" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "FechaActualizacion" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY ("IdCliente") REFERENCES "Cliente"("IdCliente"),
            FOREIGN KEY ("IdResponsable") REFERENCES "Usuario"("IdUsuario")
        );
        RAISE NOTICE 'Tabla ServicioAdicional creada';
    ELSE
        RAISE NOTICE 'Tabla ServicioAdicional ya existe';
    END IF;
END $$;

-- 4. Agregar foreign key para IdServicioAdicional en DetallePagoServicio si existe la tabla ServicioAdicional
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'ServicioAdicional' 
        AND table_schema = 'public'
    ) AND EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'DetallePagoServicio' 
        AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'DetallePagoServicio'
        AND kcu.column_name = 'IdServicioAdicional'
        AND tc.constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE "DetallePagoServicio" 
        ADD CONSTRAINT "fk_detalle_pago_servicio_adicional" 
        FOREIGN KEY ("IdServicioAdicional") REFERENCES "ServicioAdicional"("IdServicioAdicional");
        RAISE NOTICE 'Foreign key agregada entre DetallePagoServicio y ServicioAdicional';
    END IF;
END $$;

-- 5. Crear índices para mejor rendimiento
DO $$
BEGIN
    -- Índices para DetallePagoServicio
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_detalle_pago_servicio_pago') THEN
        CREATE INDEX "idx_detalle_pago_servicio_pago" ON "DetallePagoServicio"("IdPago");
        RAISE NOTICE 'Índice idx_detalle_pago_servicio_pago creado';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_detalle_pago_servicio_adicional') THEN
        CREATE INDEX "idx_detalle_pago_servicio_adicional" ON "DetallePagoServicio"("IdServicioAdicional");
        RAISE NOTICE 'Índice idx_detalle_pago_servicio_adicional creado';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_detalle_pago_tipo_periodo') THEN
        CREATE INDEX "idx_detalle_pago_tipo_periodo" ON "DetallePagoServicio"("TipoServicio", "PeriodoServicio");
        RAISE NOTICE 'Índice idx_detalle_pago_tipo_periodo creado';
    END IF;
    
    -- Índices para ServicioAdicional
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'ServicioAdicional' AND table_schema = 'public'
    ) THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_servicio_adicional_cliente') THEN
            CREATE INDEX "idx_servicio_adicional_cliente" ON "ServicioAdicional"("IdCliente");
            RAISE NOTICE 'Índice idx_servicio_adicional_cliente creado';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_servicio_adicional_estado') THEN
            CREATE INDEX "idx_servicio_adicional_estado" ON "ServicioAdicional"("Estado");
            RAISE NOTICE 'Índice idx_servicio_adicional_estado creado';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_servicio_adicional_fecha') THEN
            CREATE INDEX "idx_servicio_adicional_fecha" ON "ServicioAdicional"("Fecha");
            RAISE NOTICE 'Índice idx_servicio_adicional_fecha creado';
        END IF;
    END IF;
END $$;

-- 6. Agregar comentarios a las tablas y columnas
COMMENT ON TABLE "DetallePagoServicio" IS 'Detalle de qué servicios (fijos y adicionales) fueron cubiertos por cada pago';
COMMENT ON COLUMN "DetallePagoServicio"."TipoServicio" IS 'FIJO para servicios mensuales, ADICIONAL para servicios extras';
COMMENT ON COLUMN "DetallePagoServicio"."PeriodoServicio" IS 'Mes/año al que corresponde el servicio fijo pagado';
COMMENT ON COLUMN "DetallePagoServicio"."IdServicioAdicional" IS 'Referencia al servicio adicional pagado (solo para TipoServicio=ADICIONAL)';

COMMENT ON TABLE "ServicioAdicional" IS 'Servicios adicionales facturados a clientes (fuera del servicio mensual fijo)';
COMMENT ON COLUMN "ServicioAdicional"."Estado" IS 'PENDIENTE, FACTURADO, PAGADO, CANCELADO';

COMMENT ON COLUMN "Pago"."Observaciones" IS 'Observaciones adicionales sobre el pago, como número de operación, detalles del comprobante, etc.';

RAISE NOTICE 'Migración completada exitosamente';
