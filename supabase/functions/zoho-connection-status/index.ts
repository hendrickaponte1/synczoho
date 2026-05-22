// Edge function: devuelve el estado de la conexión Zoho de una tienda.
// Usa service role para evitar problemas de RLS cuando la app está embebida
// en Tiendanube y no hay sesión Supabase.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const storeId: string | undefined = body.store_id;
    if (!storeId) {
      return new Response(
        JSON.stringify({ error: "store_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verificar que la tienda existe
    const { data: store } = await admin
      .from("stores")
      .select("store_id")
      .eq("store_id", storeId)
      .maybeSingle();

    if (!store) {
      // store_found: false permite al frontend distinguir entre
      // "tienda eliminada/desinstalada" vs "Zoho no conectado todavía"
      return new Response(JSON.stringify({ connection: null, store_found: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: connection } = await admin
      .from("zoho_connections")
      .select("organization_id, organization_name, status, dc, updated_at")
      .eq("store_id", storeId)
      .maybeSingle();

    return new Response(JSON.stringify({ connection: connection || null, store_found: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("zoho-connection-status error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
