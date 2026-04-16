-- Create table for widget appearance settings
CREATE TABLE public.widget_appearance_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  widget_mode TEXT NOT NULL DEFAULT 'message-bar',
  widget_position TEXT NOT NULL DEFAULT 'below',
  margin_top INTEGER NOT NULL DEFAULT 16,
  margin_right INTEGER NOT NULL DEFAULT 0,
  margin_bottom INTEGER NOT NULL DEFAULT 16,
  margin_left INTEGER NOT NULL DEFAULT 0,
  message_border_width INTEGER NOT NULL DEFAULT 1,
  message_border_radius INTEGER NOT NULL DEFAULT 8,
  message_border_style TEXT NOT NULL DEFAULT 'solid',
  message_border_color TEXT NOT NULL DEFAULT '#e5e7eb',
  message_background_color TEXT NOT NULL DEFAULT '#f0fdf4',
  message_text_color TEXT NOT NULL DEFAULT '#166534',
  progress_icon_color TEXT NOT NULL DEFAULT '#22c55e',
  progress_icon_bg_color TEXT NOT NULL DEFAULT '#dcfce7',
  progress_title_color TEXT NOT NULL DEFAULT '#374151',
  progress_date_color TEXT NOT NULL DEFAULT '#6b7280',
  progress_line_color TEXT NOT NULL DEFAULT '#e5e7eb',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id, user_id)
);

-- Create table for widget text settings
CREATE TABLE public.widget_text_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  message_template TEXT NOT NULL DEFAULT '🚚 Pídelo {hoy_o_manana} antes de las {hora_corte} y recíbelo entre el {fecha_entrega_minima} y el {fecha_entrega_maxima}',
  out_of_stock_message TEXT NOT NULL DEFAULT '⏳ Este producto está temporalmente agotado. Te notificaremos cuando esté disponible.',
  today_label TEXT NOT NULL DEFAULT 'hoy',
  tomorrow_label TEXT NOT NULL DEFAULT 'mañana',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id, user_id)
);

-- Add calc mode columns to delivery_settings if they don't exist
ALTER TABLE public.delivery_settings 
ADD COLUMN IF NOT EXISTS preparation_calc_mode TEXT NOT NULL DEFAULT 'min-max';

ALTER TABLE public.delivery_settings 
ADD COLUMN IF NOT EXISTS shipping_calc_mode TEXT NOT NULL DEFAULT 'min-max';

-- Enable RLS on new tables
ALTER TABLE public.widget_appearance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_text_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for widget_appearance_settings
CREATE POLICY "Users can view their own appearance settings" 
ON public.widget_appearance_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own appearance settings" 
ON public.widget_appearance_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appearance settings" 
ON public.widget_appearance_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own appearance settings" 
ON public.widget_appearance_settings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for widget_text_settings
CREATE POLICY "Users can view their own text settings" 
ON public.widget_text_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own text settings" 
ON public.widget_text_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own text settings" 
ON public.widget_text_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own text settings" 
ON public.widget_text_settings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_widget_appearance_settings_updated_at
BEFORE UPDATE ON public.widget_appearance_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_widget_text_settings_updated_at
BEFORE UPDATE ON public.widget_text_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();