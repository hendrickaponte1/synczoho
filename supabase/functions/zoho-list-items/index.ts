// Lista items desde Zoho Inventory con paginación, búsqueda y filtros.
// Devuelve también el match con productos de Tiendanube y el estado del mapa local.
import { corsHeaders, getAdminClient, getZohoConnection, zohoFetch } from "../_shared/zoho.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = getAdminClient();
    const body = await req.json().catch(() => ({}));
    const storeId: string = body.store_id;
    const page: number = Math.max(1, Number(body.page) || 1);
    const perPage: number = Math.min(200, Math.max(1, Number(body.per_page) || 25));
    const search: string | undefined = body.search?.trim() || undefined;
    const status: string | undefined = body.status; // 'active' | 'inactive' | undefined
    const stockFilter: string | undefined = body.stock; // 'in' | 'out' | undefined
    const matchFilter: string | undefined = body.match; // 'new' | 'linked' | 'imported' | 'conflict'

    if (!storeId) {
      return json({ error: "store_id is required" }, 400);
    }

    const conn = await getZohoConnection(admin, storeId);

    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("per_page", String(perPage));
    if (search) qs.set("search_text", search);
    if (status) qs.set("filter_by", `Status.${status === "active" ? "Active" : "Inactive"}`);

    const resp = await zohoFetch(admin, conn, `/inventory/v1/items?${qs.toString()}`);
    const data = await resp.json();
    if (!resp.ok) {
      console.error("zoho items error", data);
      return json({ error: data?.message || "Error de Zoho", details: data }, resp.status);
    }

    let items = (data.items || []).map((it: any) => ({
      item_id: String(it.item_id),
      name: it.name,
      sku: it.sku || null,
      status: it.status,
      rate: it.rate,
      stock_on_hand: it.stock_on_hand ?? it.actual_available_stock ?? 0,
      image_name: it.image_name || null,
      description: it.description || "",
      unit: it.unit,
      category_name: it.category_name || null,
    }));

    // Filtro de stock client-side (Zoho no lo soporta directo)
    if (stockFilter === "in") items = items.filter((i: any) => Number(i.stock_on_hand) > 0);
    if (stockFilter === "out") items = items.filter((i: any) => Number(i.stock_on_hand) <= 0);

    // Cargar mapa de sync
    const itemIds = items.map((i: any) => i.item_id);
    const skus = items.map((i: any) => i.sku).filter(Boolean);

    const { data: maps } = await admin
      .from("product_sync_map")
      .select("zoho_item_id, tiendanube_product_id, status, last_synced_at, last_error")
      .eq("store_id", storeId)
      .in("zoho_item_id", itemIds.length ? itemIds : ["__none__"]);

    const mapByZoho = new Map((maps || []).map((m: any) => [m.zoho_item_id, m]));

    // Buscar matches por SKU en tabla products (Tiendanube)
    const { data: tnProducts } = skus.length
      ? await admin
          .from("products")
          .select("tiendanube_product_id, name, handle, store_id")
          .eq("store_id", storeId)
      : { data: [] as any[] };

    // products no tiene SKU directo (variantes están en TN), por ahora hacemos match por nombre exacto si no hay map
    const productByName = new Map<string, any>();
    (tnProducts || []).forEach((p: any) => {
      const nameVal = typeof p.name === "object" ? Object.values(p.name)[0] : p.name;
      if (typeof nameVal === "string") productByName.set(nameVal.toLowerCase().trim(), p);
    });

    let enriched = items.map((i: any) => {
      const m = mapByZoho.get(i.item_id);
      let matchStatus: string;
      let tnProductId: number | null = null;
      if (m) {
        matchStatus = m.status; // linked | imported | conflict | error | ignored
        tnProductId = m.tiendanube_product_id;
      } else {
        const candidate = productByName.get((i.name || "").toLowerCase().trim());
        if (candidate) {
          matchStatus = "conflict"; // mismo nombre, no vinculado: necesita decisión
          tnProductId = candidate.tiendanube_product_id;
        } else {
          matchStatus = "new";
        }
      }
      return {
        ...i,
        match_status: matchStatus,
        tiendanube_product_id: tnProductId,
        last_synced_at: m?.last_synced_at || null,
        last_error: m?.last_error || null,
      };
    });

    if (matchFilter) {
      enriched = enriched.filter((i: any) => i.match_status === matchFilter);
    }

    return json({
      items: enriched,
      page_context: data.page_context || { page, per_page: perPage, has_more_page: false },
    });
  } catch (e) {
    console.error("zoho-list-items error", e);
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
