-- Settings de sincronización por tienda
CREATE TABLE public.sync_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id TEXT NOT NULL UNIQUE,
  -- Órdenes
  orders_enabled BOOLEAN NOT NULL DEFAULT true,
  orders_create_as_draft BOOLEAN NOT NULL DEFAULT true,
  orders_auto_confirm BOOLEAN NOT NULL DEFAULT false,
  orders_generate_invoice_on_paid BOOLEAN NOT NULL DEFAULT false,
  -- Stock
  stock_enabled BOOLEAN NOT NULL DEFAULT false,
  stock_direction TEXT NOT NULL DEFAULT 'zoho_to_tn', -- 'zoho_to_tn' | 'tn_to_zoho' | 'bidirectional'
  stock_priority TEXT NOT NULL DEFAULT 'zoho', -- 'zoho' | 'tiendanube' (en caso de conflicto bidireccional)
  stock_warehouse_id TEXT,
  -- Clientes
  customers_auto_sync_on_order BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sync_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view sync settings of their stores" ON public.sync_settings FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.store_id = sync_settings.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Users insert sync settings for their stores" ON public.sync_settings FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores WHERE stores.store_id = sync_settings.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Users update sync settings of their stores" ON public.sync_settings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.store_id = sync_settings.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Users delete sync settings of their stores" ON public.sync_settings FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.store_id = sync_settings.store_id AND stores.user_id = auth.uid()));

CREATE TRIGGER trg_sync_settings_updated_at BEFORE UPDATE ON public.sync_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Mapeo de órdenes Tiendanube ↔ Zoho
CREATE TABLE public.order_sync_map (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id TEXT NOT NULL,
  tiendanube_order_id BIGINT NOT NULL,
  zoho_salesorder_id TEXT,
  zoho_invoice_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | success | error
  last_error TEXT,
  last_synced_at TIMESTAMPTZ,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id, tiendanube_order_id)
);

ALTER TABLE public.order_sync_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view order map of their stores" ON public.order_sync_map FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.store_id = order_sync_map.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Users insert order map for their stores" ON public.order_sync_map FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores WHERE stores.store_id = order_sync_map.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Users update order map of their stores" ON public.order_sync_map FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.store_id = order_sync_map.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Users delete order map of their stores" ON public.order_sync_map FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.store_id = order_sync_map.store_id AND stores.user_id = auth.uid()));

CREATE TRIGGER trg_order_sync_map_updated_at BEFORE UPDATE ON public.order_sync_map
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Mapeo de clientes Tiendanube ↔ Zoho
CREATE TABLE public.customer_sync_map (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id TEXT NOT NULL,
  tiendanube_customer_id BIGINT,
  email TEXT,
  zoho_contact_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  last_error TEXT,
  last_synced_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id, tiendanube_customer_id),
  UNIQUE (store_id, email)
);

ALTER TABLE public.customer_sync_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view customer map of their stores" ON public.customer_sync_map FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.store_id = customer_sync_map.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Users insert customer map for their stores" ON public.customer_sync_map FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores WHERE stores.store_id = customer_sync_map.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Users update customer map of their stores" ON public.customer_sync_map FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.store_id = customer_sync_map.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Users delete customer map of their stores" ON public.customer_sync_map FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.store_id = customer_sync_map.store_id AND stores.user_id = auth.uid()));

CREATE TRIGGER trg_customer_sync_map_updated_at BEFORE UPDATE ON public.customer_sync_map
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Estado de stock por SKU para evitar loops y registrar último valor sincronizado
CREATE TABLE public.stock_sync_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id TEXT NOT NULL,
  sku TEXT NOT NULL,
  zoho_item_id TEXT,
  tiendanube_product_id BIGINT,
  tiendanube_variant_id BIGINT,
  last_qty INTEGER,
  last_source TEXT, -- 'zoho' | 'tiendanube'
  last_synced_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id, sku)
);

ALTER TABLE public.stock_sync_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view stock state of their stores" ON public.stock_sync_state FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.store_id = stock_sync_state.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Users insert stock state for their stores" ON public.stock_sync_state FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores WHERE stores.store_id = stock_sync_state.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Users update stock state of their stores" ON public.stock_sync_state FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.store_id = stock_sync_state.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Users delete stock state of their stores" ON public.stock_sync_state FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.store_id = stock_sync_state.store_id AND stores.user_id = auth.uid()));

CREATE TRIGGER trg_stock_sync_state_updated_at BEFORE UPDATE ON public.stock_sync_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_order_sync_map_store ON public.order_sync_map(store_id, status);
CREATE INDEX idx_customer_sync_map_email ON public.customer_sync_map(store_id, email);
CREATE INDEX idx_stock_sync_state_store_sku ON public.stock_sync_state(store_id, sku);