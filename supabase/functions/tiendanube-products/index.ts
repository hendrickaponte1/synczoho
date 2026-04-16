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
    const sinceId = url.searchParams.get('since_id');
    const categoryId = url.searchParams.get('category_id');
    const published = url.searchParams.get('published');
    const freeShipping = url.searchParams.get('free_shipping');
    const q = url.searchParams.get('q'); // Search query

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
    
    if (sinceId) params.append('since_id', sinceId);
    if (categoryId) params.append('category_id', categoryId);
    if (published) params.append('published', published);
    if (freeShipping) params.append('free_shipping', freeShipping);
    if (q) params.append('q', q);

    console.log('Fetching products from Tiendanube for store:', storeId);
    console.log('Query params:', params.toString());

    // Fetch products from Tiendanube
    const productsResponse = await fetch(
      `https://api.tiendanube.com/v1/${storeId}/products?${params.toString()}`,
      {
        headers: {
          'Authentication': `bearer ${store.access_token}`,
          'User-Agent': 'TiendanubePlugin (support@lovable.dev)',
          'Content-Type': 'application/json',
        },
      }
    );

    if (!productsResponse.ok) {
      const errorText = await productsResponse.text();
      console.error('Failed to fetch products:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch products', details: errorText }),
        { status: productsResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const products = await productsResponse.json();
    
    // Get pagination info from headers
    const linkHeader = productsResponse.headers.get('Link');
    const totalCount = productsResponse.headers.get('X-Total-Count');

    console.log(`Fetched ${products.length} products, total: ${totalCount}`);

    return new Response(
      JSON.stringify({
        products,
        pagination: {
          page: parseInt(page),
          per_page: parseInt(perPage),
          total: totalCount ? parseInt(totalCount) : products.length,
          link: linkHeader,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Products fetch error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
