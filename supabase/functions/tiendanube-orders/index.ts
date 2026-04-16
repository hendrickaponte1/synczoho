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
    const url = new URL(req.url);
    const storeId = url.searchParams.get('store_id');
    const page = url.searchParams.get('page') || '1';
    const perPage = url.searchParams.get('per_page') || '50';
    const status = url.searchParams.get('status');
    const paymentStatus = url.searchParams.get('payment_status');
    const dateFrom = url.searchParams.get('date_from');
    const dateTo = url.searchParams.get('date_to');

    if (!storeId) {
      return new Response(
        JSON.stringify({ error: 'store_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get access token from database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('access_token')
      .eq('store_id', storeId)
      .maybeSingle();

    if (storeError || !store) {
      console.error('Store not found:', storeError);
      return new Response(
        JSON.stringify({ error: 'Store not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build query params for Tiendanube API
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('per_page', perPage);
    
    if (status) params.append('status', status);
    if (paymentStatus) params.append('payment_status', paymentStatus);
    if (dateFrom) params.append('created_at_min', dateFrom);
    if (dateTo) params.append('created_at_max', dateTo);

    console.log('Fetching orders from Tiendanube for store:', storeId);
    console.log('Query params:', params.toString());

    // Fetch orders from Tiendanube
    const ordersResponse = await fetch(
      `https://api.tiendanube.com/v1/${storeId}/orders?${params.toString()}`,
      {
        headers: {
          'Authentication': `bearer ${store.access_token}`,
          'User-Agent': 'TiendanubePlugin (support@lovable.dev)',
          'Content-Type': 'application/json',
        },
      }
    );

    if (!ordersResponse.ok) {
      const errorText = await ordersResponse.text();
      console.error('Failed to fetch orders:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch orders', details: errorText }),
        { status: ordersResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const orders = await ordersResponse.json();
    
    // Get pagination info from headers
    const linkHeader = ordersResponse.headers.get('Link');
    const totalCount = ordersResponse.headers.get('X-Total-Count');

    console.log(`Fetched ${orders.length} orders, total: ${totalCount}`);

    return new Response(
      JSON.stringify({
        orders,
        pagination: {
          page: parseInt(page),
          per_page: parseInt(perPage),
          total: totalCount ? parseInt(totalCount) : orders.length,
          link: linkHeader,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Orders fetch error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
