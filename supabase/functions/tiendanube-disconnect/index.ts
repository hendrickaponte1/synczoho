// Desconecta una tienda: elimina la conexión Zoho y marca la tienda como inactiva.
import { corsHeaders, getAdminClient } from "../_shared/zoho.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { store_id } = await req.json().catch(() => ({}));
    if (!store_id) {
      return new Response(JSON.stringify({ error: "store_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = getAdminClient();

    // 1. Eliminar conexión Zoho
    await admin.from("zoho_connections").delete().eq("store_id", store_id);

    // 2. Marcar tienda como inactiva en lugar de eliminarla (preserva historial)
    await admin
      .from("stores")
      .update({ status: "disconnected" })
      .eq("store_id", store_id);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
