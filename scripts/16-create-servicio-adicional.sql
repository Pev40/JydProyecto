-- Crear tabla ServicioAdicional y ajustar detalle si hiciera falta
DO $$
BEGIN
  -- Crear tabla ServicioAdicional si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ServicioAdicional'
  ) THEN
    CREATE TABLE "ServicioAdicional" (
      "IdServicioAdicional" SERIAL PRIMARY KEY,
      "IdCliente" INTEGER NOT NULL REFERENCES "Cliente"("IdCliente"),
      "NombreServicio" VARCHAR(255) NOT NULL,
      "Descripcion" TEXT,
      "Monto" DECIMAL(10,2) NOT NULL,
      "Fecha" DATE NOT NULL,
      "Estado" VARCHAR(20) NOT NULL DEFAULT 'FACTURADO',
      "IdResponsable" INTEGER REFERENCES "Usuario"("IdUsuario"),
      "FechaCreacion" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "FechaActualizacion" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  END IF;

  -- Índices de apoyo
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_servicio_adicional_cliente') THEN
    CREATE INDEX "idx_servicio_adicional_cliente" ON "ServicioAdicional"("IdCliente");
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_servicio_adicional_estado') THEN
    CREATE INDEX "idx_servicio_adicional_estado" ON "ServicioAdicional"("Estado");
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_servicio_adicional_fecha') THEN
    CREATE INDEX "idx_servicio_adicional_fecha" ON "ServicioAdicional"("Fecha");
  END IF;

  -- Asegurar columna de referencia en DetallePagoServicio si la tabla existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'DetallePagoServicio'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'DetallePagoServicio' AND column_name = 'IdServicioAdicional'
  ) THEN
    ALTER TABLE "DetallePagoServicio" ADD COLUMN "IdServicioAdicional" INTEGER;
  END IF;
END $$;


