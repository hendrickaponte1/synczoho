-- Add widget_enabled column to delivery_settings table
ALTER TABLE public.delivery_settings 
ADD COLUMN IF NOT EXISTS widget_enabled BOOLEAN NOT NULL DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN public.delivery_settings.widget_enabled IS 'Whether the estimated delivery widget is enabled for this store';