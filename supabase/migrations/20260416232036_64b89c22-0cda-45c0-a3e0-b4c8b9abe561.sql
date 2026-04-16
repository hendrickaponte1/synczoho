-- Add product sync configuration columns
ALTER TABLE public.sync_settings
  ADD COLUMN IF NOT EXISTS products_publish_on_import boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS products_overwrite_existing boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS products_match_strategy text NOT NULL DEFAULT 'sku',
  ADD COLUMN IF NOT EXISTS products_sync_fields jsonb NOT NULL DEFAULT '{"name":true,"sku":true,"description":true,"price":true,"stock":true,"images":false,"category":false,"weight":false,"dimensions":false,"barcode":false,"brand":false,"tax":false}'::jsonb;