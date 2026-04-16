-- ============================================================
-- product_sync_map: relación Zoho item <-> Tiendanube product
-- ============================================================
CREATE TABLE public.product_sync_map (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id TEXT NOT NULL,
  zoho_item_id TEXT NOT NULL,
  zoho_sku TEXT,
  zoho_name TEXT,
  tiendanube_product_id BIGINT,
  status TEXT NOT NULL DEFAULT 'pending',
  -- pending | linked | imported | conflict | error | ignored
  last_synced_at TIMESTAMPTZ,
  last_error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT product_sync_map_store_zoho_unique UNIQUE (store_id, zoho_item_id)
);

CREATE INDEX idx_product_sync_map_store ON public.product_sync_map(store_id);
CREATE INDEX idx_product_sync_map_sku ON public.product_sync_map(store_id, zoho_sku);
CREATE INDEX idx_product_sync_map_status ON public.product_sync_map(store_id, status);

ALTER TABLE public.product_sync_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sync map of their stores"
  ON public.product_sync_map FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.store_id = product_sync_map.store_id
      AND stores.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert sync map for their stores"
  ON public.product_sync_map FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.store_id = product_sync_map.store_id
      AND stores.user_id = auth.uid()
  ));

CREATE POLICY "Users can update sync map of their stores"
  ON public.product_sync_map FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.store_id = product_sync_map.store_id
      AND stores.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete sync map of their stores"
  ON public.product_sync_map FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.store_id = product_sync_map.store_id
      AND stores.user_id = auth.uid()
  ));

CREATE TRIGGER update_product_sync_map_updated_at
  BEFORE UPDATE ON public.product_sync_map
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- sync_logs: historial de operaciones de sincronización
-- ============================================================
CREATE TABLE public.sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  -- list_zoho | import_create | import_update | link | unlink | bulk_import
  zoho_item_id TEXT,
  tiendanube_product_id BIGINT,
  status TEXT NOT NULL,
  -- success | error | skipped
  message TEXT,
  duration_ms INTEGER,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sync_logs_store_created ON public.sync_logs(store_id, created_at DESC);
CREATE INDEX idx_sync_logs_status ON public.sync_logs(store_id, status);

ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sync logs of their stores"
  ON public.sync_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.store_id = sync_logs.store_id
      AND stores.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert sync logs for their stores"
  ON public.sync_logs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.store_id = sync_logs.store_id
      AND stores.user_id = auth.uid()
  ));