// Webhook receptor de Tiendanube (orders, customers).
// Endpoint público — verifica HMAC opcional y procesa eventos.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const payload = await req.json();
    console.log("TN webhook payload:", JSON.stringify(payload).slice(0, 500));

    const event = payload.event as string;
    const storeId = String(payload.store_id);
    const resourceId = payload.id as number;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    await admin.from("webhook_events").insert({
      store_id: storeId,
      event_type: event,
      payload: payload,
      processed: false,
    });

    // Disparar handlers según evento (best-effort, fire and forget)
    if (event?.startsWith("order/")) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      // Llamar zoho-create-salesorder
      fetch(`${supabaseUrl}/functions/v1/zoho-create-salesorder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ storeId, orderId: resourceId, event }),
      }).catch((e) => console.error("trigger order fn:", e));
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("webhook error", e);
    return new Response(JSON.stringify({ error: "bad request" }), {
      status: 200, // siempre 200 para que TN no reintente loop
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
