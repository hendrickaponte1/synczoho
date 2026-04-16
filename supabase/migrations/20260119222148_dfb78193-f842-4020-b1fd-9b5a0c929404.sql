-- Add public read access for widget to fetch appearance settings by store_id
CREATE POLICY "Anyone can view appearance settings by store_id" 
ON public.widget_appearance_settings 
FOR SELECT 
USING (true);

-- Add public read access for widget to fetch text settings by store_id  
CREATE POLICY "Anyone can view text settings by store_id" 
ON public.widget_text_settings 
FOR SELECT 
USING (true);

-- Add public read access for widget to fetch delivery settings by store_id
CREATE POLICY "Anyone can view delivery settings by store_id" 
ON public.delivery_settings 
FOR SELECT 
USING (true);