// Edge function TEMPORAL: devuelve secrets para migración. BORRAR después de usar.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const token = req.headers.get("x-admin-token");
  const expected = Deno.env.get("TEMP_EXPORT_TOKEN");

  if (!expected || token !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      ZOHO_CLIENT_ID: Deno.env.get("ZOHO_CLIENT_ID") ?? null,
      ZOHO_CLIENT_SECRET: Deno.env.get("ZOHO_CLIENT_SECRET") ?? null,
      TIENDANUBE_CLIENT_ID: Deno.env.get("TIENDANUBE_CLIENT_ID") ?? null,
      TIENDANUBE_CLIENT_SECRET: Deno.env.get("TIENDANUBE_CLIENT_SECRET") ?? null,
      SUPABASE_URL: Deno.env.get("SUPABASE_URL") ?? null,
      SUPABASE_ANON_KEY: Deno.env.get("SUPABASE_ANON_KEY") ?? null,
      SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? null,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
