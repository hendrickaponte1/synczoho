import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();
    
    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Authorization code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    console.log('Exchanging code for access token...');

    const tokenResponse = await fetch('https://www.tiendanube.com/apps/authorize/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
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
    console.log('Token exchange successful');

    const storeId = tokenData.user_id || tokenData.store_id || tokenData.id;
    
    if (!storeId) {
      return new Response(
        JSON.stringify({ error: 'No store ID returned from Tiendanube' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch store name
    const storeResponse = await fetch(`https://api.tiendanube.com/v1/${storeId}/store`, {
      headers: {
        'Authentication': `bearer ${tokenData.access_token}`,
        'User-Agent': 'TiendaSync (support@lovable.dev)',
        'Content-Type': 'application/json',
      },
    });

    let storeName = 'Mi Tienda';
    if (storeResponse.ok) {
      const storeData = await storeResponse.json();
      storeName = storeData.name?.es || storeData.name?.en || storeData.name || 'Mi Tienda';
      console.log('Store name:', storeName);
    }

    // Save to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: existingStore } = await supabase
      .from('stores')
      .select('id')
      .eq('store_id', storeId.toString())
      .maybeSingle();

    if (existingStore) {
      const { error: updateError } = await supabase
        .from('stores')
        .update({
          access_token: tokenData.access_token,
          store_name: storeName,
        })
        .eq('store_id', storeId.toString());

      if (updateError) throw updateError;
      console.log('Store updated');
    } else {
      const { error: insertError } = await supabase
        .from('stores')
        .insert({
          store_id: storeId.toString(),
          access_token: tokenData.access_token,
          store_name: storeName,
        });

      if (insertError) throw insertError;
      console.log('Store inserted');
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
