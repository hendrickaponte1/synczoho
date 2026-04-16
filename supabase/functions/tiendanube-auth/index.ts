import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, user_id } = await req.json();
    
    if (!code) {
      console.error('No authorization code provided');
      return new Response(
        JSON.stringify({ error: 'Authorization code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!user_id) {
      console.error('No user_id provided');
      return new Response(
        JSON.stringify({ error: 'User must be authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clientId = Deno.env.get('TIENDANUBE_CLIENT_ID');
    const clientSecret = Deno.env.get('TIENDANUBE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      console.error('Missing Tiendanube credentials');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Exchanging code for access token for user:', user_id);

    // Exchange code for access token
    const tokenResponse = await fetch('https://www.tiendanube.com/apps/authorize/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to exchange authorization code', details: errorText }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tokenData = await tokenResponse.json();
    console.log('Token exchange response:', JSON.stringify(tokenData));

    // Tiendanube returns user_id as the store ID
    const storeId = tokenData.user_id || tokenData.store_id || tokenData.id;
    
    if (!storeId) {
      console.error('No store ID found in token response');
      return new Response(
        JSON.stringify({ error: 'No store ID returned from Tiendanube', tokenData }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Token exchange successful, store_id:', storeId);

    // Fetch store info to get the name
    const storeResponse = await fetch(`https://api.tiendanube.com/v1/${storeId}/store`, {
      headers: {
        'Authentication': `bearer ${tokenData.access_token}`,
        'User-Agent': 'TiendanubePlugin (support@lovable.dev)',
        'Content-Type': 'application/json',
      },
    });

    let storeName = 'Mi Tienda';
    if (storeResponse.ok) {
      const storeData = await storeResponse.json();
      console.log('Store data:', JSON.stringify(storeData));
      storeName = storeData.name?.es || storeData.name?.en || storeData.name || 'Mi Tienda';
      console.log('Store name fetched:', storeName);
    } else {
      const storeError = await storeResponse.text();
      console.log('Could not fetch store name:', storeError);
    }

    // Save to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if this store already exists for this user
    const { data: existingStore } = await supabase
      .from('stores')
      .select('id')
      .eq('store_id', storeId.toString())
      .eq('user_id', user_id)
      .maybeSingle();

    if (existingStore) {
      // Update existing store
      const { error: updateError } = await supabase
        .from('stores')
        .update({
          access_token: tokenData.access_token,
          store_name: storeName,
        })
        .eq('store_id', storeId.toString())
        .eq('user_id', user_id);

      if (updateError) {
        console.error('Error updating store:', updateError);
        throw updateError;
      }
      console.log('Store updated successfully for user:', user_id);
    } else {
      // Insert new store linked to this user
      const { error: insertError } = await supabase
        .from('stores')
        .insert({
          store_id: storeId.toString(),
          access_token: tokenData.access_token,
          store_name: storeName,
          user_id: user_id,
        });

      if (insertError) {
        console.error('Error inserting store:', insertError);
        throw insertError;
      }
      console.log('Store inserted successfully for user:', user_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        store_id: storeId,
        store_name: storeName,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Auth error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});