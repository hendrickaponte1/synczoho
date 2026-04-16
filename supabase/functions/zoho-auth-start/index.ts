// Edge function: inicia el flujo OAuth de Zoho Inventory
// Devuelve la URL de autorización para que el frontend redireccione al usuario.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Mapeo de DC -> dominio de accounts.zoho
const DC_DOMAINS: Record<string, string> = {
  com: "https://accounts.zoho.com",
  eu: "https://accounts.zoho.eu",
  in: "https://accounts.zoho.in",
  "com.au": "https://accounts.zoho.com.au",
  jp: "https://accounts.zoho.jp",
  "com.cn": "https://accounts.zoho.com.cn",
};

const SCOPES = "ZohoInventory.FullAccess.ALL";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const clientId = Deno.env.get("ZOHO_CLIENT_ID");

    if (!clientId) {
      return new Response(
        JSON.stringify({ error: "ZOHO_CLIENT_ID not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Validar JWT del usuario
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const storeId: string | undefined = body.store_id;
    const dc: string = body.dc || "com";
    const redirectUri: string = body.redirect_uri;

    if (!storeId || !redirectUri) {
      return new Response(
        JSON.stringify({ error: "store_id and redirect_uri are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verificar que la tienda pertenece al usuario
    const { data: store, error: storeErr } = await supabase
      .from("stores")
      .select("store_id, user_id")
      .eq("store_id", storeId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (storeErr || !store) {
      return new Response(JSON.stringify({ error: "Store not found or not owned" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accountsBase = DC_DOMAINS[dc] || DC_DOMAINS.com;

    // El state lleva store_id + dc + user_id (firmado de forma simple en base64)
    const statePayload = JSON.stringify({ s: storeId, d: dc, u: user.id, t: Date.now() });
    const state = btoa(statePayload);

    const authUrl = new URL(`${accountsBase}/oauth/v2/auth`);
    authUrl.searchParams.set("scope", SCOPES);
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("state", state);

    return new Response(
      JSON.stringify({ auth_url: authUrl.toString(), state }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("zoho-auth-start error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
