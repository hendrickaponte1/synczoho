-- Tabla para conexiones OAuth de Zoho Inventory
CREATE TABLE public.zoho_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id TEXT NOT NULL UNIQUE,
  organization_id TEXT,
  organization_name TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT,
  dc TEXT NOT NULL DEFAULT 'com',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice por store_id (ya único, pero explícito)
CREATE INDEX idx_zoho_connections_store_id ON public.zoho_connections(store_id);

-- Habilitar RLS
ALTER TABLE public.zoho_connections ENABLE ROW LEVEL SECURITY;

-- Políticas: el usuario puede operar sobre la conexión Zoho si la tienda asociada le pertenece
CREATE POLICY "Users can view zoho connections of their stores"
ON public.zoho_connections
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.store_id = zoho_connections.store_id
      AND stores.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert zoho connections for their stores"
ON public.zoho_connections
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.store_id = zoho_connections.store_id
      AND stores.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update zoho connections of their stores"
ON public.zoho_connections
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.store_id = zoho_connections.store_id
      AND stores.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete zoho connections of their stores"
ON public.zoho_connections
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.store_id = zoho_connections.store_id
      AND stores.user_id = auth.uid()
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_zoho_connections_updated_at
BEFORE UPDATE ON public.zoho_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();