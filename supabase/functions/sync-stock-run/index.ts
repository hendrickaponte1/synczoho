// Sincroniza stock entre Zoho y Tiendanube según settings.
// Modo on-demand: corre un sync completo (Zoho → TN, TN → Zoho o bidireccional).
// Vincula automáticamente productos por SKU si aún no están mapeados.
import {
  corsHeaders,
  getAdminClient,
  getZohoConnection,
  zohoFetch,
  logSync,
} from "../_shared/zoho.ts";
import { getStore, tnFetch, tnFetchJson } from "../_shared/tiendanube.ts";

interface PairItem {
  zoho_item_id: string;
  zoho_sku: string;
  zoho_qty: number;
  tn_product_id: number;
  tn_variant_id: number;
  tn_qty: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const t0 = Date.now();
  try {
    const { storeId } = await req.json();
    if (!storeId) {
      return json({ error: "storeId requerido" }, 400);
    }
    const admin = getAdminClient();
    const { data: settings } = await admin
      .from("sync_settings")
      .select("*")
      .eq("store_id", storeId)
      .maybeSingle();

    if (!settings?.stock_enabled) {
      return json({ error: "Sincronización de stock deshabilitada" }, 400);
    }

    const direction = settings.stock_direction as "zoho_to_tn" | "tn_to_zoho" | "bidirectional";
    const priority = settings.stock_priority as "zoho" | "tiendanube";

    const conn = await getZohoConnection(admin, storeId);
    const store = await getStore(admin, storeId);

    // 1) Cargar TODOS los items de Zoho (con stock + sku)
    const zohoItems: { item_id: string; sku?: string; name?: string; stock_on_hand?: number; actual_available_stock?: number }[] = [];
    let page = 1;
    while (true) {
      const r = await zohoFetch(admin, conn, `/inventory/v1/items?per_page=200&page=${page}`);
      const j = await r.json();
      if (!r.ok) throw new Error(`Zoho items ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
      const items = j.items || [];
      zohoItems.push(...items);
      if (!j.page_context?.has_more_page) break;
      page++;
      if (page > 50) break;
    }

    // 2) Cargar productos de Tiendanube (con variantes/sku/stock)
    const tnProducts: any[] = [];
    let tnPage = 1;
    while (true) {
      const resp = await tnFetch(store, `/products?per_page=200&page=${tnPage}&fields=id,variants`);
      if (!resp.ok) {
        await resp.text();
        throw new Error(`Tiendanube products ${resp.status}`);
      }
      const arr = await resp.json();
      tnProducts.push(...arr);
      if (!arr || arr.length < 200) break;
      tnPage++;
      if (tnPage > 50) break;
    }

    // 3) Construir mapa por SKU (case-insensitive, trim)
    const norm = (s: any) => (s ?? "").toString().trim().toUpperCase();
    const tnBySku = new Map<string, { product_id: number; variant_id: number; stock: number }>();
    for (const p of tnProducts) {
      for (const v of p.variants || []) {
        const sku = norm(v.sku);
        if (!sku) continue;
        if (!tnBySku.has(sku)) {
          tnBySku.set(sku, {
            product_id: p.id,
            variant_id: v.id,
            stock: Number(v.stock ?? 0),
          });
        }
      }
    }

    // 4) Cruzar por SKU
    const pairs: PairItem[] = [];
    const unmatched: string[] = [];
    for (const it of zohoItems) {
      const sku = norm(it.sku);
      if (!sku) continue;
      const match = tnBySku.get(sku);
      if (!match) {
        unmatched.push(it.sku || it.item_id);
        continue;
      }
      pairs.push({
        zoho_item_id: it.item_id,
        zoho_sku: it.sku || "",
        zoho_qty: Number(it.stock_on_hand ?? it.actual_available_stock ?? 0),
        tn_product_id: match.product_id,
        tn_variant_id: match.variant_id,
        tn_qty: match.stock,
      });
    }

    // 5) Auto-vincular en product_sync_map si aún no está
    for (const p of pairs) {
      await admin.from("product_sync_map").upsert(
        {
          store_id: storeId,
          zoho_item_id: p.zoho_item_id,
          zoho_sku: p.zoho_sku,
          tiendanube_product_id: p.tn_product_id,
          status: "linked",
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: "store_id,zoho_item_id" },
      );
    }

    // 6) Sincronizar stock
    let updated = 0;
    let inSync = 0;
    let errors = 0;
    const details: any[] = [];

    for (const p of pairs) {
      try {
        let target: "tn" | "zoho" | null = null;
        if (p.zoho_qty === p.tn_qty) {
          target = null;
        } else if (direction === "zoho_to_tn") target = "tn";
        else if (direction === "tn_to_zoho") target = "zoho";
        else target = priority === "zoho" ? "tn" : "zoho";

        if (target === "tn") {
          // TN ignora `stock` si la variante no tiene stock_management = true.
          // Lo forzamos primero (idempotente) y luego seteamos el stock.
          const enableMgmt = await tnFetch(store, `/products/${p.tn_product_id}/variants/${p.tn_variant_id}`, {
            method: "PUT",
            body: JSON.stringify({ stock_management: true }),
          });
          if (!enableMgmt.ok && enableMgmt.status !== 422) {
            const t = await enableMgmt.text();
            throw new Error(`TN enable stock_management ${enableMgmt.status}: ${t.slice(0, 150)}`);
          } else {
            await enableMgmt.text().catch(() => "");
          }

          const r = await tnFetch(store, `/products/${p.tn_product_id}/variants/${p.tn_variant_id}`, {
            method: "PUT",
            body: JSON.stringify({ stock: p.zoho_qty, stock_management: true }),
          });
          const txt = await r.text();
          if (!r.ok) throw new Error(`TN update ${r.status}: ${txt.slice(0, 150)}`);
          updated++;
          details.push({ sku: p.zoho_sku, from: p.tn_qty, to: p.zoho_qty, target: "tn" });
        } else if (target === "zoho") {
          const adj = await zohoFetch(admin, conn, `/inventory/v1/inventoryadjustments`, {
            method: "POST",
            body: JSON.stringify({
              date: new Date().toISOString().slice(0, 10),
              reason: "Sync desde Tiendanube",
              adjustment_type: "quantity",
              line_items: [{ item_id: p.zoho_item_id, quantity_adjusted: p.tn_qty - p.zoho_qty }],
            }),
            headers: { "Content-Type": "application/json" },
          });
          if (!adj.ok) {
            const j = await adj.json();
            throw new Error(`Zoho adjust ${adj.status}: ${JSON.stringify(j).slice(0, 200)}`);
          }
          updated++;
          details.push({ sku: p.zoho_sku, from: p.zoho_qty, to: p.tn_qty, target: "zoho" });
        } else {
          inSync++;
        }

        await admin.from("stock_sync_state").upsert(
          {
            store_id: storeId,
            sku: p.zoho_sku || p.zoho_item_id,
            zoho_item_id: p.zoho_item_id,
            tiendanube_product_id: p.tn_product_id,
            tiendanube_variant_id: p.tn_variant_id,
            last_qty: target === "tn" ? p.zoho_qty : (target === "zoho" ? p.tn_qty : p.zoho_qty),
            last_source: target === "tn" ? "zoho" : (target === "zoho" ? "tiendanube" : "in_sync"),
            last_synced_at: new Date().toISOString(),
            last_error: null,
          },
          { onConflict: "store_id,sku" },
        );
      } catch (err) {
        errors++;
        const msg = err instanceof Error ? err.message : "Error";
        details.push({ sku: p.zoho_sku, error: msg });
      }
    }

    await logSync(admin, storeId, {
      operation: "stock_sync_run",
      status: errors === 0 ? "success" : "error",
      message: `Vinculados: ${pairs.length} · Actualizados: ${updated} · Ya sincronizados: ${inSync} · Errores: ${errors} · Sin match en TN: ${unmatched.length}`,
      duration_ms: Date.now() - t0,
      payload: { updated, inSync, errors, total: pairs.length, unmatched: unmatched.slice(0, 50) },
    });

    return json({
      total: pairs.length,
      updated,
      inSync,
      errors,
      unmatched: unmatched.length,
      unmatched_sample: unmatched.slice(0, 20),
      details: details.slice(0, 100),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    console.error("sync-stock-run error", msg);
    return json({ error: msg }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
