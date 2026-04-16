-- Create table for delivery settings
CREATE TABLE public.delivery_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  preparation_min_days INTEGER NOT NULL DEFAULT 1,
  preparation_max_days INTEGER NOT NULL DEFAULT 2,
  shipping_min_days INTEGER NOT NULL DEFAULT 3,
  shipping_max_days INTEGER NOT NULL DEFAULT 5,
  cutoff_time TIME NOT NULL DEFAULT '14:00:00',
  working_days INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.delivery_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own delivery settings" 
ON public.delivery_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own delivery settings" 
ON public.delivery_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own delivery settings" 
ON public.delivery_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own delivery settings" 
ON public.delivery_settings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_delivery_settings_updated_at
BEFORE UPDATE ON public.delivery_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();