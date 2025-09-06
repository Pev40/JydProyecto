-- Migración 19: Corregir vista VistaReporteCajaVariable para incluir columnas faltantes
-- Fecha: 2025-09-05
-- Descripción: Agrega las columnas Mes, Año, NombreMes y otras que necesita el API

-- Verificar si faltan columnas en la tabla Pago
DO $$
BEGIN
    -- Agregar columnas faltantes a la tabla Pago si no existen
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Pago' AND column_name = 'MontoPagado') THEN
        ALTER TABLE "Pago" ADD COLUMN "MontoPagado" DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Pago' AND column_name = 'SaldoPendiente') THEN
        ALTER TABLE "Pago" ADD COLUMN "SaldoPendiente" DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Pago' AND column_name = 'NumeroRecibo') THEN
        ALTER TABLE "Pago" ADD COLUMN "NumeroRecibo" VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Pago' AND column_name = 'DetalleServicio') THEN
        ALTER TABLE "Pago" ADD COLUMN "DetalleServicio" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Pago' AND column_name = 'MedioPago') THEN
        ALTER TABLE "Pago" ADD COLUMN "MedioPago" VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Pago' AND column_name = 'IdBanco') THEN
        ALTER TABLE "Pago" ADD COLUMN "IdBanco" INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Pago' AND column_name = 'Observaciones') THEN
        ALTER TABLE "Pago" ADD COLUMN "Observaciones" TEXT;
    END IF;
END $$;

-- Verificar y ajustar tabla Banco
DO $$
BEGIN
    -- Verificar si la tabla Banco existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Banco') THEN
        -- Crear tabla Banco si no existe
        CREATE TABLE "Banco" (
            "IdBanco" SERIAL PRIMARY KEY,
            "Nombre" VARCHAR(100) NOT NULL,
            "Codigo" VARCHAR(10),
            "Activo" BOOLEAN DEFAULT true,
            "FechaCreacion" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ELSE
        -- Agregar columna Codigo si no existe
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'Banco' AND column_name = 'Codigo') THEN
            ALTER TABLE "Banco" ADD COLUMN "Codigo" VARCHAR(10);
        END IF;
        
        -- Agregar columna Activo si no existe
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'Banco' AND column_name = 'Activo') THEN
            ALTER TABLE "Banco" ADD COLUMN "Activo" BOOLEAN DEFAULT true;
        END IF;
    END IF;
END $$;

-- Insertar bancos básicos si no existen (usando solo Nombre si Codigo no existe)
DO $$
BEGIN
    -- Verificar si la columna Codigo existe
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'Banco' AND column_name = 'Codigo') THEN
        -- Insertar con código
        INSERT INTO "Banco" ("Nombre", "Codigo") 
        SELECT 'YAPE', 'YAPE'
        WHERE NOT EXISTS (SELECT 1 FROM "Banco" WHERE "Nombre" = 'YAPE');
        
        INSERT INTO "Banco" ("Nombre", "Codigo") 
        SELECT 'PLIN', 'PLIN'
        WHERE NOT EXISTS (SELECT 1 FROM "Banco" WHERE "Nombre" = 'PLIN');
        
        INSERT INTO "Banco" ("Nombre", "Codigo") 
        SELECT 'BCP', 'BCP'
        WHERE NOT EXISTS (SELECT 1 FROM "Banco" WHERE "Nombre" = 'BCP');
        
        INSERT INTO "Banco" ("Nombre", "Codigo") 
        SELECT 'BBVA', 'BBVA'
        WHERE NOT EXISTS (SELECT 1 FROM "Banco" WHERE "Nombre" = 'BBVA');
        
        INSERT INTO "Banco" ("Nombre", "Codigo") 
        SELECT 'INTERBANK', 'IBK'
        WHERE NOT EXISTS (SELECT 1 FROM "Banco" WHERE "Nombre" = 'INTERBANK');
    ELSE
        -- Insertar solo nombre
        INSERT INTO "Banco" ("Nombre") 
        SELECT 'YAPE'
        WHERE NOT EXISTS (SELECT 1 FROM "Banco" WHERE "Nombre" = 'YAPE');
        
        INSERT INTO "Banco" ("Nombre") 
        SELECT 'PLIN'
        WHERE NOT EXISTS (SELECT 1 FROM "Banco" WHERE "Nombre" = 'PLIN');
        
        INSERT INTO "Banco" ("Nombre") 
        SELECT 'BCP'
        WHERE NOT EXISTS (SELECT 1 FROM "Banco" WHERE "Nombre" = 'BCP');
        
        INSERT INTO "Banco" ("Nombre") 
        SELECT 'BBVA'
        WHERE NOT EXISTS (SELECT 1 FROM "Banco" WHERE "Nombre" = 'BBVA');
        
        INSERT INTO "Banco" ("Nombre") 
        SELECT 'INTERBANK'
        WHERE NOT EXISTS (SELECT 1 FROM "Banco" WHERE "Nombre" = 'INTERBANK');
    END IF;
END $$;

-- Recrear la vista VistaReporteCajaVariable con las columnas correctas
DROP VIEW IF EXISTS "VistaReporteCajaVariable";
CREATE OR REPLACE VIEW "VistaReporteCajaVariable" AS
SELECT 
    p."IdPago",
    EXTRACT(MONTH FROM p."Fecha")::INTEGER as "Mes",
    EXTRACT(YEAR FROM p."Fecha")::INTEGER as "Año",
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
    COALESCE(p."DetalleServicio", p."Concepto", 'SERVICIO CONTABLE') as "DetalleServicio",
    COALESCE(p."NumeroRecibo", 'REC-' || LPAD(p."IdPago"::TEXT, 6, '0')) as "NumeroRecibo",
    COALESCE(p."MedioPago", 'EFECTIVO') as "Medio",
    COALESCE(b."Nombre", 'YAPE') as "Banco",
    p."Monto" as "MontoDevengado",
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

-- Actualizar datos existentes con valores por defecto
UPDATE "Pago" SET 
    "MontoPagado" = CASE 
        WHEN "Estado" = 'COMPLETADO' THEN "Monto"
        WHEN "Estado" = 'PARCIAL' THEN "Monto" * 0.5
        ELSE 0
    END
WHERE "MontoPagado" IS NULL;

UPDATE "Pago" SET 
    "SaldoPendiente" = CASE 
        WHEN "Estado" = 'COMPLETADO' THEN 0
        WHEN "Estado" = 'PARCIAL' THEN "Monto" * 0.5
        ELSE "Monto"
    END
WHERE "SaldoPendiente" IS NULL;

UPDATE "Pago" SET 
    "NumeroRecibo" = 'REC-' || LPAD("IdPago"::TEXT, 6, '0')
WHERE "NumeroRecibo" IS NULL;

UPDATE "Pago" SET 
    "DetalleServicio" = "Concepto"
WHERE "DetalleServicio" IS NULL;

UPDATE "Pago" SET 
    "MedioPago" = 'EFECTIVO'
WHERE "MedioPago" IS NULL;

UPDATE "Pago" SET 
    "Observaciones" = CASE 
        WHEN "Estado" = 'COMPLETADO' THEN 'Pago completo'
        WHEN "Estado" = 'PARCIAL' THEN 'Pago parcial pendiente'
        ELSE 'Pendiente de pago'
    END
WHERE "Observaciones" IS NULL;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Vista VistaReporteCajaVariable corregida exitosamente';
    RAISE NOTICE 'Se agregaron las columnas: Mes, Año, NombreMes, MontoDevengado, SaldoPendiente';
    RAISE NOTICE 'Ejecutar: SELECT * FROM "VistaReporteCajaVariable" LIMIT 5;';
END $$;
