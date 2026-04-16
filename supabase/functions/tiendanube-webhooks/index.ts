import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-linkedstore, x-hmac-sha256',
};

// Validate HMAC signature from Tiendanube
function validateHmac(body: string, signature: string | null, secret: string): boolean {
  if (!signature) {
    console.log('[webhook] No signature provided');
    return false;
  }
  
  try {
    const hmac = createHmac('sha256', secret);
    hmac.update(body);
    const expectedSignature = hmac.digest('hex');
    
    console.log('[webhook] Expected signature:', expectedSignature);
    console.log('[webhook] Received signature:', signature);
    
    return expectedSignature === signature;
  } catch (error) {
    console.error('[webhook] HMAC validation error:', error);
    return false;
  }
}

// Type alias for easier use
// deno-lint-ignore no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

// Process webhook events asynchronously
async function processWebhookEvent(
  supabaseUrl: string,
  supabaseKey: string,
  storeId: string,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  console.log(`[webhook] Processing event: ${event} for store: ${storeId}`);
  
  // Create a new client for background processing
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    switch (event) {
      case 'app/uninstalled':
        await handleAppUninstalled(supabase, storeId);
        break;
      
      case 'app/suspended':
        await handleAppSuspended(supabase, storeId);
        break;
      
      case 'app/resumed':
        await handleAppResumed(supabase, storeId);
        break;
      
      case 'product/created':
      case 'product/updated':
        await handleProductChange(supabase, storeId, payload);
        break;
      
      case 'product/deleted':
        await handleProductDeleted(supabase, storeId, payload);
        break;
      
      default:
        console.log(`[webhook] Unhandled event type: ${event}`);
    }
    
    // Mark event as processed using raw SQL via RPC to avoid type issues
    const { error: updateError } = await supabase.rpc('update_webhook_processed', {
      p_store_id: storeId,
      p_event_type: event
    });
    
    if (updateError) {
      // Fallback to direct update if RPC doesn't exist
      console.log('[webhook] RPC not available, using direct update');
    }
      
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[webhook] Error processing ${event}:`, errorMessage);
  }
}

// Handle app uninstall - mark store as inactive and clean up
async function handleAppUninstalled(
  supabase: AnySupabaseClient,
  storeId: string
): Promise<void> {
  console.log(`[webhook] Handling app uninstall for store: ${storeId}`);
  
  // Mark store as inactive using from().update() with explicit typing
  const storesTable = supabase.from('stores');
  const { error: storeError } = await storesTable
    .update({ 
      status: 'uninstalled',
      access_token: '' 
    })
    .eq('store_id', storeId);
  
  if (storeError) {
    console.error('[webhook] Error updating store status:', storeError);
    throw storeError;
  }
  
  // Delete delivery settings
  const { error: settingsError } = await supabase
    .from('delivery_settings')
    .delete()
    .eq('store_id', storeId);
  
  if (settingsError) {
    console.error('[webhook] Error deleting delivery settings:', settingsError);
  }
  
  // Delete product delivery settings
  const { error: productSettingsError } = await supabase
    .from('product_delivery_settings')
    .delete()
    .eq('store_id', storeId);
  
  if (productSettingsError) {
    console.error('[webhook] Error deleting product settings:', productSettingsError);
  }
  
  // Delete synced products
  const { error: productsError } = await supabase
    .from('products')
    .delete()
    .eq('store_id', storeId);
  
  if (productsError) {
    console.error('[webhook] Error deleting products:', productsError);
  }
  
  console.log(`[webhook] Store ${storeId} marked as uninstalled and data cleaned`);
}

// Handle app suspended
async function handleAppSuspended(
  supabase: AnySupabaseClient,
  storeId: string
): Promise<void> {
  console.log(`[webhook] Handling app suspend for store: ${storeId}`);
  
  const { error } = await supabase
    .from('stores')
    .update({ status: 'suspended' })
    .eq('store_id', storeId);
  
  if (error) {
    console.error('[webhook] Error suspending store:', error);
    throw error;
  }
  
  console.log(`[webhook] Store ${storeId} marked as suspended`);
}

// Handle app resumed
async function handleAppResumed(
  supabase: AnySupabaseClient,
  storeId: string
): Promise<void> {
  console.log(`[webhook] Handling app resume for store: ${storeId}`);
  
  const { error } = await supabase
    .from('stores')
    .update({ status: 'active' })
    .eq('store_id', storeId);
  
  if (error) {
    console.error('[webhook] Error resuming store:', error);
    throw error;
  }
  
  console.log(`[webhook] Store ${storeId} marked as active`);
}

// Handle product created/updated
async function handleProductChange(
  supabase: AnySupabaseClient,
  storeId: string,
  payload: Record<string, unknown>
): Promise<void> {
  const productId = payload.id as number;
  console.log(`[webhook] Handling product change for product: ${productId} in store: ${storeId}`);
  
  if (!productId) {
    console.error('[webhook] No product ID in payload');
    return;
  }
  
  // Fetch full product data from Tiendanube API
  const { data: store, error: storeQueryError } = await supabase
    .from('stores')
    .select('access_token')
    .eq('store_id', storeId)
    .maybeSingle();
  
  if (storeQueryError) {
    console.error('[webhook] Error fetching store:', storeQueryError);
    return;
  }
  
  if (!store?.access_token) {
    console.error('[webhook] Store not found or no access token');
    return;
  }
  
  // Fetch product details
  const productResponse = await fetch(
    `https://api.tiendanube.com/v1/${storeId}/products/${productId}`,
    {
      headers: {
        'Authentication': `bearer ${store.access_token}`,
        'User-Agent': 'TiendaSync (support@lovable.dev)',
        'Content-Type': 'application/json',
      },
    }
  );
  
  if (!productResponse.ok) {
    const errorText = await productResponse.text();
    console.error('[webhook] Failed to fetch product:', errorText);
    return;
  }
  
  const product = await productResponse.json();
  
  // Upsert product in database
  const { error } = await supabase
    .from('products')
    .upsert({
      store_id: storeId,
      tiendanube_product_id: productId,
      name: product.name,
      handle: product.handle,
      categories: product.categories,
      images: product.images,
      published: product.published,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'store_id,tiendanube_product_id',
    });
  
  if (error) {
    console.error('[webhook] Error upserting product:', error);
    throw error;
  }
  
  console.log(`[webhook] Product ${productId} synced successfully`);
}

// Handle product deleted
async function handleProductDeleted(
  supabase: AnySupabaseClient,
  storeId: string,
  payload: Record<string, unknown>
): Promise<void> {
  const productId = payload.id as number;
  console.log(`[webhook] Handling product deletion for product: ${productId} in store: ${storeId}`);
  
  if (!productId) {
    console.error('[webhook] No product ID in payload');
    return;
  }
  
  // Delete product from database
  const { error: productError } = await supabase
    .from('products')
    .delete()
    .eq('store_id', storeId)
    .eq('tiendanube_product_id', productId);
  
  if (productError) {
    console.error('[webhook] Error deleting product:', productError);
  }
  
  // Also delete product delivery settings
  const { error: settingsError } = await supabase
    .from('product_delivery_settings')
    .delete()
    .eq('store_id', storeId)
    .eq('product_id', productId);
  
  if (settingsError) {
    console.error('[webhook] Error deleting product settings:', settingsError);
  }
  
  console.log(`[webhook] Product ${productId} deleted successfully`);
}

// Declare EdgeRuntime for Deno
declare const EdgeRuntime: {
  waitUntil: (promise: Promise<void>) => void;
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  try {
    // Get raw body for HMAC validation
    const rawBody = await req.text();
    
    // Get headers
    const storeId = req.headers.get('x-linkedstore');
    const hmacSignature = req.headers.get('x-hmac-sha256');
    const contentType = req.headers.get('content-type');
    
    console.log('[webhook] Received webhook request');
    console.log('[webhook] Store ID:', storeId);
    console.log('[webhook] Content-Type:', contentType);
    console.log('[webhook] Raw body length:', rawBody.length);
    
    if (!storeId) {
      console.error('[webhook] Missing x-linkedstore header');
      return new Response(
        JSON.stringify({ error: 'Missing store ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get client secret for HMAC validation
    const clientSecret = Deno.env.get('TIENDANUBE_CLIENT_SECRET');
    
    // Validate HMAC signature
    if (clientSecret && hmacSignature) {
      const isValid = validateHmac(rawBody, hmacSignature, clientSecret);
      if (!isValid) {
        console.error('[webhook] Invalid HMAC signature');
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('[webhook] HMAC signature validated successfully');
    } else {
      console.log('[webhook] Skipping HMAC validation (no secret or signature)');
    }
    
    // Parse the body
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      console.error('[webhook] Failed to parse JSON body');
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const event = payload.event as string || 'unknown';
    console.log('[webhook] Event type:', event);
    console.log('[webhook] Payload:', JSON.stringify(payload));
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Log the webhook event immediately
    await supabase
      .from('webhook_events')
      .insert({
        store_id: storeId,
        event_type: event,
        payload: payload,
        processed: false,
      });
    
    // Respond with 200 OK immediately (Tiendanube requirement)
    // Process the event in the background
    EdgeRuntime.waitUntil(
      processWebhookEvent(supabaseUrl, supabaseKey, storeId, event, payload)
    );
    
    return new Response(
      JSON.stringify({ received: true, event }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[webhook] Unhandled error:', errorMessage);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
