-- Soporte para app/suspended webhook de Tiendanube
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS suspended BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE;
