-- Crear tabla para el cronograma SUNAT
CREATE TABLE IF NOT EXISTS "CronogramaSunat" (
    "IdCronograma" SERIAL PRIMARY KEY,
    "Año" INTEGER NOT NULL,
    "Mes" INTEGER NOT NULL CHECK ("Mes" >= 1 AND "Mes" <= 12),
    "DigitoRUC" INTEGER NOT NULL CHECK ("DigitoRUC" IN (0,1,2,3,4,5,6,7,8,9,99)),
    "Dia" INTEGER NOT NULL CHECK ("Dia" >= 1 AND "Dia" <= 31),
    "MesVencimiento" INTEGER NOT NULL CHECK ("MesVencimiento" >= 1 AND "MesVencimiento" <= 12),
    "FechaCreacion" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "FechaModificacion" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("Año", "Mes", "DigitoRUC")
);

-- Crear tabla para servicios adicionales
CREATE TABLE IF NOT EXISTS "ServicioAdicional" (
    "IdServicioAdicional" SERIAL PRIMARY KEY,
    "IdCliente" INTEGER NOT NULL REFERENCES "Cliente"("IdCliente"),
    "NombreServicio" VARCHAR(200) NOT NULL,
    "Descripcion" TEXT,
    "Fecha" DATE NOT NULL,
    "Monto" DECIMAL(10,2) NOT NULL CHECK ("Monto" > 0),
    "Estado" VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' CHECK ("Estado" IN ('PENDIENTE', 'FACTURADO', 'PAGADO', 'CANCELADO')),
    "FechaCreacion" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "FechaModificacion" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla para historial de clasificaciones
CREATE TABLE IF NOT EXISTS "HistorialClasificacion" (
    "IdHistorial" SERIAL PRIMARY KEY,
    "IdCliente" INTEGER NOT NULL REFERENCES "Cliente"("IdCliente"),
    "IdClasificacionAnterior" INTEGER REFERENCES "Clasificacion"("IdClasificacion"),
    "IdClasificacionNueva" INTEGER NOT NULL REFERENCES "Clasificacion"("IdClasificacion"),
    "IdResponsable" INTEGER REFERENCES "Usuario"("IdUsuario"),
    "Motivo" TEXT,
    "FechaCambio" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar cronograma SUNAT 2024
INSERT INTO "CronogramaSunat" ("Año", "Mes", "DigitoRUC", "Dia", "MesVencimiento") VALUES
-- Enero 2024
(2024, 1, 0, 14, 2), (2024, 1, 1, 17, 2), (2024, 1, 2, 18, 2), (2024, 1, 4, 19, 2), (2024, 1, 6, 20, 2), (2024, 1, 8, 21, 2), (2024, 1, 99, 24, 2),
-- Febrero 2024
(2024, 2, 0, 14, 3), (2024, 2, 1, 17, 3), (2024, 2, 2, 18, 3), (2024, 2, 4, 19, 3), (2024, 2, 6, 20, 3), (2024, 2, 8, 21, 3), (2024, 2, 99, 24, 3),
-- Marzo 2024
(2024, 3, 0, 14, 4), (2024, 3, 1, 15, 4), (2024, 3, 2, 16, 4), (2024, 3, 4, 21, 4), (2024, 3, 6, 22, 4), (2024, 3, 8, 23, 4), (2024, 3, 99, 24, 4),
-- Abril 2024
(2024, 4, 0, 15, 5), (2024, 4, 1, 16, 5), (2024, 4, 2, 19, 5), (2024, 4, 4, 20, 5), (2024, 4, 6, 21, 5), (2024, 4, 8, 22, 5), (2024, 4, 99, 23, 5),
-- Mayo 2024
(2024, 5, 0, 13, 6), (2024, 5, 1, 16, 6), (2024, 5, 2, 17, 6), (2024, 5, 4, 18, 6), (2024, 5, 6, 19, 6), (2024, 5, 8, 20, 6), (2024, 5, 99, 23, 6),
-- Junio 2024
(2024, 6, 0, 14, 7), (2024, 6, 1, 15, 7), (2024, 6, 2, 16, 7), (2024, 6, 4, 17, 7), (2024, 6, 6, 18, 7), (2024, 6, 8, 21, 7), (2024, 6, 99, 22, 7),
-- Julio 2024
(2024, 7, 0, 15, 8), (2024, 7, 1, 18, 8), (2024, 7, 2, 19, 8), (2024, 7, 4, 20, 8), (2024, 7, 6, 21, 8), (2024, 7, 8, 22, 8), (2024, 7, 99, 25, 8),
-- Agosto 2024
(2024, 8, 0, 12, 9), (2024, 8, 1, 15, 9), (2024, 8, 2, 16, 9), (2024, 8, 4, 17, 9), (2024, 8, 6, 18, 9), (2024, 8, 8, 19, 9), (2024, 8, 99, 22, 9),
-- Septiembre 2024
(2024, 9, 0, 15, 10), (2024, 9, 1, 16, 10), (2024, 9, 2, 17, 10), (2024, 9, 4, 20, 10), (2024, 9, 6, 21, 10), (2024, 9, 8, 22, 10), (2024, 9, 99, 23, 10),
-- Octubre 2024
(2024, 10, 0, 14, 11), (2024, 10, 1, 17, 11), (2024, 10, 2, 18, 11), (2024, 10, 4, 19, 11), (2024, 10, 6, 20, 11), (2024, 10, 8, 21, 11), (2024, 10, 99, 24, 11),
-- Noviembre 2024
(2024, 11, 0, 16, 12), (2024, 11, 1, 17, 12), (2024, 11, 2, 18, 12), (2024, 11, 4, 19, 12), (2024, 11, 6, 22, 12), (2024, 11, 8, 23, 12), (2024, 11, 99, 24, 12),
-- Diciembre 2024
(2024, 12, 0, 15, 1), (2024, 12, 1, 16, 1), (2024, 12, 2, 19, 1), (2024, 12, 4, 20, 1), (2024, 12, 6, 21, 1), (2024, 12, 8, 22, 1), (2024, 12, 99, 23, 1);

-- Insertar cronograma SUNAT 2025
INSERT INTO "CronogramaSunat" ("Año", "Mes", "DigitoRUC", "Dia", "MesVencimiento") VALUES
-- Enero 2025
(2025, 1, 0, 14, 2), (2025, 1, 1, 17, 2), (2025, 1, 2, 18, 2), (2025, 1, 4, 19, 2), (2025, 1, 6, 20, 2), (2025, 1, 8, 21, 2), (2025, 1, 99, 24, 2),
-- Febrero 2025
(2025, 2, 0, 14, 3), (2025, 2, 1, 17, 3), (2025, 2, 2, 18, 3), (2025, 2, 4, 19, 3), (2025, 2, 6, 20, 3), (2025, 2, 8, 21, 3), (2025, 2, 99, 24, 3),
-- Marzo 2025
(2025, 3, 0, 14, 4), (2025, 3, 1, 15, 4), (2025, 3, 2, 16, 4), (2025, 3, 4, 21, 4), (2025, 3, 6, 22, 4), (2025, 3, 8, 23, 4), (2025, 3, 99, 24, 4),
-- Abril 2025
(2025, 4, 0, 15, 5), (2025, 4, 1, 16, 5), (2025, 4, 2, 19, 5), (2025, 4, 4, 20, 5), (2025, 4, 6, 21, 5), (2025, 4, 8, 22, 5), (2025, 4, 99, 23, 5),
-- Mayo 2025
(2025, 5, 0, 13, 6), (2025, 5, 1, 16, 6), (2025, 5, 2, 17, 6), (2025, 5, 4, 18, 6), (2025, 5, 6, 19, 6), (2025, 5, 8, 20, 6), (2025, 5, 99, 23, 6),
-- Junio 2025
(2025, 6, 0, 14, 7), (2025, 6, 1, 15, 7), (2025, 6, 2, 16, 7), (2025, 6, 4, 17, 7), (2025, 6, 6, 18, 7), (2025, 6, 8, 21, 7), (2025, 6, 99, 22, 7),
-- Julio 2025
(2025, 7, 0, 15, 8), (2025, 7, 1, 18, 8), (2025, 7, 2, 19, 8), (2025, 7, 4, 20, 8), (2025, 7, 6, 21, 8), (2025, 7, 8, 22, 8), (2025, 7, 99, 25, 8),
-- Agosto 2025
(2025, 8, 0, 12, 9), (2025, 8, 1, 15, 9), (2025, 8, 2, 16, 9), (2025, 8, 4, 17, 9), (2025, 8, 6, 18, 9), (2025, 8, 8, 19, 9), (2025, 8, 99, 22, 9),
-- Septiembre 2025
(2025, 9, 0, 15, 10), (2025, 9, 1, 16, 10), (2025, 9, 2, 17, 10), (2025, 9, 4, 20, 10), (2025, 9, 6, 21, 10), (2025, 9, 8, 22, 10), (2025, 9, 99, 23, 10),
-- Octubre 2025
(2025, 10, 0, 14, 11), (2025, 10, 1, 17, 11), (2025, 10, 2, 18, 11), (2025, 10, 4, 19, 11), (2025, 10, 6, 20, 11), (2025, 10, 8, 21, 11), (2025, 10, 99, 24, 11),
-- Noviembre 2025
(2025, 11, 0, 16, 12), (2025, 11, 1, 17, 12), (2025, 11, 2, 18, 12), (2025, 11, 4, 19, 12), (2025, 11, 6, 22, 12), (2025, 11, 8, 23, 12), (2025, 11, 99, 24, 12),
-- Diciembre 2025
(2025, 12, 0, 15, 1), (2025, 12, 1, 16, 1), (2025, 12, 2, 19, 1), (2025, 12, 4, 20, 1), (2025, 12, 6, 21, 1), (2025, 12, 8, 22, 1), (2025, 12, 99, 23, 1);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS "idx_cronograma_año_mes" ON "CronogramaSunat"("Año", "Mes");
CREATE INDEX IF NOT EXISTS "idx_cronograma_digito" ON "CronogramaSunat"("DigitoRUC");
CREATE INDEX IF NOT EXISTS "idx_servicio_adicional_cliente" ON "ServicioAdicional"("IdCliente");
CREATE INDEX IF NOT EXISTS "idx_servicio_adicional_fecha" ON "ServicioAdicional"("Fecha");
CREATE INDEX IF NOT EXISTS "idx_historial_clasificacion_cliente" ON "HistorialClasificacion"("IdCliente");

-- Comentarios para documentación
COMMENT ON TABLE "CronogramaSunat" IS 'Cronograma de vencimientos SUNAT por dígito RUC';
COMMENT ON TABLE "ServicioAdicional" IS 'Servicios adicionales facturados a clientes';
COMMENT ON TABLE "HistorialClasificacion" IS 'Historial de cambios de clasificación de clientes';

-- Trigger para actualizar fecha de modificación
CREATE OR REPLACE FUNCTION update_modified_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW."FechaModificacion" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cronograma_modtime 
    BEFORE UPDATE ON "CronogramaSunat" 
    FOR EACH ROW EXECUTE FUNCTION update_modified_time();

CREATE TRIGGER update_servicio_adicional_modtime 
    BEFORE UPDATE ON "ServicioAdicional" 
    FOR EACH ROW EXECUTE FUNCTION update_modified_time();
