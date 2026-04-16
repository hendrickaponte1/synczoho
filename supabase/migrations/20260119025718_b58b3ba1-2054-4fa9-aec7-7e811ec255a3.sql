-- Add status column to stores table for webhook handling
ALTER TABLE public.stores ADD COLUMN status TEXT NOT NULL DEFAULT 'active';

-- Add index for faster queries on status
CREATE INDEX idx_stores_status ON public.stores(status);

-- Create products table for storing synced Tiendanube products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id TEXT NOT NULL,
  tiendanube_product_id BIGINT NOT NULL,
  name JSONB,
  handle JSONB,
  categories JSONB,
  images JSONB,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id, tiendanube_product_id)
);

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Products are linked to stores, so we need a policy that allows access based on store ownership
CREATE POLICY "Users can view products from their stores"
ON public.products
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.store_id = products.store_id 
    AND stores.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert products for their stores"
ON public.products
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.store_id = products.store_id 
    AND stores.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update products from their stores"
ON public.products
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.store_id = products.store_id 
    AND stores.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete products from their stores"
ON public.products
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.store_id = products.store_id 
    AND stores.user_id = auth.uid()
  )
);

-- Create product delivery settings table for product-specific overrides
CREATE TABLE public.product_delivery_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id TEXT NOT NULL,
  product_id BIGINT NOT NULL,
  preparation_min_days INTEGER NOT NULL DEFAULT 1,
  preparation_max_days INTEGER NOT NULL DEFAULT 2,
  shipping_min_days INTEGER NOT NULL DEFAULT 3,
  shipping_max_days INTEGER NOT NULL DEFAULT 5,
  working_days INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id, product_id)
);

-- Enable RLS on product_delivery_settings
ALTER TABLE public.product_delivery_settings ENABLE ROW LEVEL SECURITY;

-- Policies for product_delivery_settings
CREATE POLICY "Users can view product settings from their stores"
ON public.product_delivery_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.store_id = product_delivery_settings.store_id 
    AND stores.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert product settings for their stores"
ON public.product_delivery_settings
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.store_id = product_delivery_settings.store_id 
    AND stores.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update product settings from their stores"
ON public.product_delivery_settings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.store_id = product_delivery_settings.store_id 
    AND stores.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete product settings from their stores"
ON public.product_delivery_settings
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.store_id = product_delivery_settings.store_id 
    AND stores.user_id = auth.uid()
  )
);

-- Trigger for updated_at on products
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on product_delivery_settings
CREATE TRIGGER update_product_delivery_settings_updated_at
BEFORE UPDATE ON public.product_delivery_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create webhook_events table for logging
CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB,
  processed BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on webhook_events (only system can write, users can read their stores' events)
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view webhook events from their stores"
ON public.webhook_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.store_id = webhook_events.store_id 
    AND stores.user_id = auth.uid()
  )
);