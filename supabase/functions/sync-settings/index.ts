// GET/PUT settings de sincronización por tienda
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const DEFAULTS = {
  orders_enabled: true,
  orders_create_as_draft: true,
  orders_auto_confirm: false,
  orders_generate_invoice_on_paid: false,
  stock_enabled: false,
  stock_direction: "zoho_to_tn",
  stock_priority: "zoho",
  stock_warehouse_id: null as string | null,
  customers_auto_sync_on_order: true,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const { storeId, action = "get", settings } = body as {
      storeId?: string;
      action?: "get" | "save";
      settings?: Record<string, unknown>;
    };
    if (!storeId) {
      return new Response(JSON.stringify({ error: "storeId requerido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (action === "save" && settings) {
      const merged = { ...DEFAULTS, ...settings, store_id: storeId };
      const { data: existing } = await admin
        .from("sync_settings")
        .select("id")
        .eq("store_id", storeId)
        .maybeSingle();
      if (existing) {
        await admin.from("sync_settings").update(merged).eq("store_id", storeId);
      } else {
        await admin.from("sync_settings").insert(merged);
      }
    }

    const { data } = await admin
      .from("sync_settings")
      .select("*")
      .eq("store_id", storeId)
      .maybeSingle();

    const result = data || { ...DEFAULTS, store_id: storeId };

    return new Response(JSON.stringify({ settings: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
