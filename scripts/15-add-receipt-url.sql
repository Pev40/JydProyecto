-- Agregar columna UrlPdf y FechaEnvio a ReciboEnviado si no existen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ReciboEnviado' AND column_name = 'UrlPdf'
  ) THEN
    ALTER TABLE "ReciboEnviado" ADD COLUMN "UrlPdf" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ReciboEnviado' AND column_name = 'FechaEnvio'
  ) THEN
    ALTER TABLE "ReciboEnviado" ADD COLUMN "FechaEnvio" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;


