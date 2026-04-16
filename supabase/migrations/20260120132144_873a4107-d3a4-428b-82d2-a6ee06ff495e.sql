-- Fix 1: Remove public SELECT policies from widget settings tables
-- These tables should only be accessed via the widget-config edge function (which uses service role)

DROP POLICY IF EXISTS "Anyone can view delivery settings by store_id" ON delivery_settings;
DROP POLICY IF EXISTS "Anyone can view appearance settings by store_id" ON widget_appearance_settings;
DROP POLICY IF EXISTS "Anyone can view text settings by store_id" ON widget_text_settings;

-- Fix 2: Create a safe view for stores table that excludes sensitive columns
-- This hides access_token and user_email from direct queries

CREATE OR REPLACE VIEW public.stores_public
WITH (security_invoker=on) AS
  SELECT 
    id,
    store_id,
    store_name,
    status,
    user_id,
    created_at,
    updated_at
    -- EXCLUDED: access_token, user_email (sensitive data)
  FROM public.stores;

-- Ensure the base stores table policies don't allow direct SELECT of sensitive columns
-- The existing RLS policy "Users can view their own stores" USING (auth.uid() = user_id) is correct
-- Users can only see their own stores, not others'

-- Add a comment to document the security decision
COMMENT ON VIEW public.stores_public IS 'Safe view of stores table that excludes access_token and user_email. Use this view for any queries that don''t require sensitive credentials.';