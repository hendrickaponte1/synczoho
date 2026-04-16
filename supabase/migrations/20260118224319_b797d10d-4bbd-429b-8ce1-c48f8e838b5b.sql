-- Add user_id column to stores table to link stores with authenticated users
ALTER TABLE public.stores 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow public insert of stores" ON public.stores;
DROP POLICY IF EXISTS "Allow public read of stores" ON public.stores;
DROP POLICY IF EXISTS "Allow public update of stores" ON public.stores;

-- Create new RLS policies that restrict access to user's own stores
CREATE POLICY "Users can view their own stores" 
ON public.stores 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stores" 
ON public.stores 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stores" 
ON public.stores 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stores" 
ON public.stores 
FOR DELETE 
USING (auth.uid() = user_id);