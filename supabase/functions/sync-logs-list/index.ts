// Devuelve los últimos logs de sincronización de una tienda.
import { corsHeaders, getAdminClient } from "../_shared/zoho.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const admin = getAdminClient();
    const body = await req.json().catch(() => ({}));
    const storeId: string = body.store_id;
    const limit = Math.min(200, Number(body.limit) || 50);
    if (!storeId) {
      return new Response(JSON.stringify({ error: "store_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data, error } = await admin
      .from("sync_logs")
      .select("id, operation, zoho_item_id, tiendanube_product_id, status, message, duration_ms, created_at")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return new Response(JSON.stringify({ logs: data || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
