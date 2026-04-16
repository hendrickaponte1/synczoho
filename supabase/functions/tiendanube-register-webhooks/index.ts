import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Webhook events to register
const WEBHOOK_EVENTS = [
  'app/uninstalled',
  'app/suspended',
  'app/resumed',
  'product/created',
  'product/updated',
  'product/deleted',
];

interface WebhookRegistration {
  id?: number;
  url: string;
  event: string;
  created_at?: string;
  updated_at?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Validate auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create client with user's token for auth validation
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: authError } = await userSupabase.auth.getClaims(token);
    
    if (authError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const userId = claims.claims.sub;
    console.log('[register-webhooks] User ID:', userId);
    
    // Get request body
    const { store_id } = await req.json();
    
    if (!store_id) {
      return new Response(
        JSON.stringify({ error: 'store_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Use service role to fetch store data
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user owns this store
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('access_token, store_id')
      .eq('store_id', store_id)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (storeError || !store) {
      console.error('[register-webhooks] Store not found:', storeError);
      return new Response(
        JSON.stringify({ error: 'Store not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('[register-webhooks] Found store:', store.store_id);
    
    // Construct webhook URL
    const webhookUrl = `${supabaseUrl}/functions/v1/tiendanube-webhooks`;
    console.log('[register-webhooks] Webhook URL:', webhookUrl);
    
    // First, get existing webhooks
    const existingResponse = await fetch(
      `https://api.tiendanube.com/v1/${store_id}/webhooks`,
      {
        method: 'GET',
        headers: {
          'Authentication': `bearer ${store.access_token}`,
          'User-Agent': 'TiendaSync (support@lovable.dev)',
          'Content-Type': 'application/json',
        },
      }
    );
    
    let existingWebhooks: WebhookRegistration[] = [];
    if (existingResponse.ok) {
      existingWebhooks = await existingResponse.json();
      console.log('[register-webhooks] Existing webhooks:', JSON.stringify(existingWebhooks));
    } else {
      const errorText = await existingResponse.text();
      console.log('[register-webhooks] Could not fetch existing webhooks:', errorText);
    }
    
    // Register/update webhooks
    const results: { event: string; status: string; id?: number; error?: string }[] = [];
    
    for (const event of WEBHOOK_EVENTS) {
      // Check if webhook already exists
      const existing = existingWebhooks.find(
        (w: WebhookRegistration) => w.event === event && w.url === webhookUrl
      );
      
      if (existing) {
        console.log(`[register-webhooks] Webhook for ${event} already exists with ID ${existing.id}`);
        results.push({ event, status: 'exists', id: existing.id });
        continue;
      }
      
      // Delete any existing webhook for this event (different URL)
      const oldWebhook = existingWebhooks.find((w: WebhookRegistration) => w.event === event);
      if (oldWebhook?.id) {
        console.log(`[register-webhooks] Deleting old webhook for ${event} with ID ${oldWebhook.id}`);
        await fetch(
          `https://api.tiendanube.com/v1/${store_id}/webhooks/${oldWebhook.id}`,
          {
            method: 'DELETE',
            headers: {
              'Authentication': `bearer ${store.access_token}`,
              'User-Agent': 'TiendaSync (support@lovable.dev)',
            },
          }
        );
      }
      
      // Create new webhook
      console.log(`[register-webhooks] Creating webhook for ${event}`);
      const createResponse = await fetch(
        `https://api.tiendanube.com/v1/${store_id}/webhooks`,
        {
          method: 'POST',
          headers: {
            'Authentication': `bearer ${store.access_token}`,
            'User-Agent': 'TiendaSync (support@lovable.dev)',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: webhookUrl,
            event: event,
          }),
        }
      );
      
      if (createResponse.ok) {
        const webhook = await createResponse.json();
        console.log(`[register-webhooks] Created webhook for ${event}:`, JSON.stringify(webhook));
        results.push({ event, status: 'created', id: webhook.id });
      } else {
        const errorText = await createResponse.text();
        console.error(`[register-webhooks] Failed to create webhook for ${event}:`, errorText);
        results.push({ event, status: 'error', error: errorText });
      }
    }
    
    // Update store status to active if it was suspended or uninstalled
    await supabase
      .from('stores')
      .update({ status: 'active' })
      .eq('store_id', store_id)
      .eq('user_id', userId);
    
    return new Response(
      JSON.stringify({
        success: true,
        webhook_url: webhookUrl,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[register-webhooks] Unhandled error:', errorMessage);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
