// Sincroniza stock entre Zoho y Tiendanube según settings.
// Modo on-demand: corre un sync completo (Zoho → TN, TN → Zoho o bidireccional).
import {
  corsHeaders,
  getAdminClient,
  getZohoConnection,
  zohoFetch,
  logSync,
} from "../_shared/zoho.ts";
import { getStore, tnFetch } from "../_shared/tiendanube.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const t0 = Date.now();
  try {
    const { storeId } = await req.json();
    if (!storeId) {
      return new Response(JSON.stringify({ error: "storeId requerido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = getAdminClient();
    const { data: settings } = await admin
      .from("sync_settings")
      .select("*")
      .eq("store_id", storeId)
      .maybeSingle();

    if (!settings?.stock_enabled) {
      return new Response(JSON.stringify({ error: "Sync de stock deshabilitado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const direction = settings.stock_direction as "zoho_to_tn" | "tn_to_zoho" | "bidirectional";
    const priority = settings.stock_priority as "zoho" | "tiendanube";

    // Traer products vinculados
    const { data: maps } = await admin
      .from("product_sync_map")
      .select("zoho_item_id, zoho_sku, tiendanube_product_id")
      .eq("store_id", storeId)
      .not("tiendanube_product_id", "is", null);

    const conn = await getZohoConnection(admin, storeId);
    const store = await getStore(admin, storeId);

    let updated = 0;
    let errors = 0;
    const details: any[] = [];

    for (const m of maps || []) {
      try {
        // 1) leer stock Zoho
        const zResp = await zohoFetch(admin, conn, `/inventory/v1/items/${m.zoho_item_id}`);
        const zJson = await zResp.json();
        const zohoQty = Number(zJson.item?.stock_on_hand ?? zJson.item?.actual_available_stock ?? 0);

        // 2) leer stock TN (primer variant)
        const tnResp = await tnFetch(store, `/products/${m.tiendanube_product_id}`);
        const tnJson = await tnResp.json();
        const variant = tnJson?.variants?.[0];
        if (!variant) {
          throw new Error("Producto TN sin variantes");
        }
        const tnQty = Number(variant.stock ?? 0);

        // 3) decidir
        let target: "tn" | "zoho" | null = null;
        if (direction === "zoho_to_tn") target = zohoQty !== tnQty ? "tn" : null;
        else if (direction === "tn_to_zoho") target = zohoQty !== tnQty ? "zoho" : null;
        else {
          // bidireccional: priorizar el lado configurado
          if (zohoQty === tnQty) target = null;
          else target = priority === "zoho" ? "tn" : "zoho";
        }

        if (target === "tn") {
          // PUT variant stock
          const r = await tnFetch(store, `/products/${m.tiendanube_product_id}/variants/${variant.id}`, {
            method: "PUT",
            body: JSON.stringify({ stock: zohoQty }),
          });
          if (!r.ok) throw new Error(`TN update stock ${r.status}`);
          updated++;
        } else if (target === "zoho") {
          // ajuste de inventario en Zoho
          const adj = await zohoFetch(admin, conn, `/inventory/v1/inventoryadjustments`, {
            method: "POST",
            body: JSON.stringify({
              date: new Date().toISOString().slice(0, 10),
              reason: "Sync desde Tiendanube",
              adjustment_type: "quantity",
              line_items: [
                {
                  item_id: m.zoho_item_id,
                  quantity_adjusted: tnQty - zohoQty,
                },
              ],
            }),
            headers: { "Content-Type": "application/json" },
          });
          if (!adj.ok) {
            const j = await adj.json();
            throw new Error(`Zoho adjust ${adj.status}: ${JSON.stringify(j).slice(0, 200)}`);
          }
          updated++;
        }

        await admin.from("stock_sync_state").upsert(
          {
            store_id: storeId,
            sku: m.zoho_sku || m.zoho_item_id,
            zoho_item_id: m.zoho_item_id,
            tiendanube_product_id: m.tiendanube_product_id,
            tiendanube_variant_id: variant.id,
            last_qty: target === "tn" ? zohoQty : (target === "zoho" ? tnQty : zohoQty),
            last_source: target === "tn" ? "zoho" : (target === "zoho" ? "tiendanube" : "in_sync"),
            last_synced_at: new Date().toISOString(),
            last_error: null,
          },
          { onConflict: "store_id,sku" },
        );

        details.push({ sku: m.zoho_sku, zohoQty, tnQty, target: target || "in_sync" });
      } catch (err) {
        errors++;
        const msg = err instanceof Error ? err.message : "Error";
        details.push({ sku: m.zoho_sku, error: msg });
      }
    }

    const admin2 = getAdminClient();
    await logSync(admin2, storeId, {
      operation: "stock_sync_run",
      status: errors === 0 ? "success" : "error",
      message: `Updated: ${updated} / Errors: ${errors} / Total: ${maps?.length || 0}`,
      duration_ms: Date.now() - t0,
      payload: { updated, errors, total: maps?.length || 0 },
    });

    return new Response(
      JSON.stringify({ updated, errors, total: maps?.length || 0, details }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
