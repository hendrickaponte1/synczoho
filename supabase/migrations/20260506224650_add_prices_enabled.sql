-- Agrega soporte para sincronización de precios
ALTER TABLE sync_settings
  ADD COLUMN IF NOT EXISTS prices_enabled boolean NOT NULL DEFAULT false;
