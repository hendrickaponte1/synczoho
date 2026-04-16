-- Tabla para almacenar las tiendas conectadas
CREATE TABLE public.stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id TEXT NOT NULL UNIQUE,
  store_name TEXT,
  access_token TEXT NOT NULL,
  user_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Política para lectura pública (la app maneja la autenticación con Tiendanube)
CREATE POLICY "Allow public read of stores" 
ON public.stores 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert of stores" 
ON public.stores 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update of stores" 
ON public.stores 
FOR UPDATE 
USING (true);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_stores_updated_at
BEFORE UPDATE ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();