// Importa items de Zoho a Tiendanube. Procesa de a uno y devuelve resultado por item.
// Soporta acciones: 'create' (crear nuevo), 'update' (actualizar vinculado), 'link' (solo vincular sin enviar).
import { corsHeaders, getAdminClient, getZohoConnection, logSync, zohoFetch } from "../_shared/zoho.ts";

interface ImportRequest {
  store_id: string;
  items: Array<{
    zoho_item_id: string;
    action: "create" | "update" | "link";
    tiendanube_product_id?: number | null;
  }>;
  publish?: boolean; // si false (default), crea como borrador
  fields?: Partial<Record<
    "name" | "sku" | "description" | "price" | "stock" | "images" | "category" |
    "weight" | "dimensions" | "barcode" | "brand" | "tax",
    boolean
  >>;
  overwrite?: boolean; // si false, en update no pisa campos existentes
}

const DEFAULT_FIELDS = {
  name: true, sku: true, description: true, price: true, stock: true,
  images: false, category: false, weight: false, dimensions: false,
  barcode: false, brand: false, tax: false,
} as const;

const TN_API_BASE = "https://api.tiendanube.com/v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = getAdminClient();
    const body = (await req.json().catch(() => ({}))) as ImportRequest;
    const { store_id: storeId, items, publish = false } = body;

    if (!storeId || !Array.isArray(items) || items.length === 0) {
      return json({ error: "store_id e items son obligatorios" }, 400);
    }

    // Token de Tiendanube
    const { data: store } = await admin
      .from("stores")
      .select("store_id, access_token")
      .eq("store_id", storeId)
      .maybeSingle();
    if (!store) return json({ error: "Store not found" }, 404);

    const conn = await getZohoConnection(admin, storeId);

    const results: Array<{
      zoho_item_id: string;
      status: "success" | "error" | "skipped";
      message?: string;
      tiendanube_product_id?: number | null;
      action: string;
    }> = [];

    for (const entry of items) {
      const start = Date.now();
      try {
        // Traer item de Zoho
        const zResp = await zohoFetch(admin, conn, `/inventory/v1/items/${entry.zoho_item_id}`);
        const zData = await zResp.json();
        if (!zResp.ok) {
          throw new Error(`Zoho item fetch failed: ${zData?.message || zResp.statusText}`);
        }
        const zItem = zData.item;

        let tnProductId: number | null = entry.tiendanube_product_id || null;

        if (entry.action === "create") {
          const payload = {
            name: { es: zItem.name },
            description: { es: zItem.description || "" },
            published: publish,
            variants: [
              {
                price: String(zItem.rate ?? 0),
                stock: Number(zItem.stock_on_hand ?? 0),
                sku: zItem.sku || undefined,
              },
            ],
          };
          const resp = await fetch(`${TN_API_BASE}/${storeId}/products`, {
            method: "POST",
            headers: tnHeaders(store.access_token),
            body: JSON.stringify(payload),
          });
          const created = await resp.json();
          if (!resp.ok) throw new Error(tnErr(created, resp.status));
          tnProductId = created.id;
        } else if (entry.action === "update") {
          if (!tnProductId) throw new Error("tiendanube_product_id requerido para update");
          const payload = {
            name: { es: zItem.name },
            description: { es: zItem.description || "" },
          };
          const resp = await fetch(`${TN_API_BASE}/${storeId}/products/${tnProductId}`, {
            method: "PUT",
            headers: tnHeaders(store.access_token),
            body: JSON.stringify(payload),
          });
          const updated = await resp.json();
          if (!resp.ok) throw new Error(tnErr(updated, resp.status));
        } else if (entry.action === "link") {
          if (!tnProductId) throw new Error("tiendanube_product_id requerido para link");
        }

        // Upsert en sync map
        await admin.from("product_sync_map").upsert(
          {
            store_id: storeId,
            zoho_item_id: entry.zoho_item_id,
            zoho_sku: zItem.sku || null,
            zoho_name: zItem.name,
            tiendanube_product_id: tnProductId,
            status: entry.action === "link" ? "linked" : "imported",
            last_synced_at: new Date().toISOString(),
            last_error: null,
          },
          { onConflict: "store_id,zoho_item_id" },
        );

        await logSync(admin, storeId, {
          operation:
            entry.action === "create"
              ? "import_create"
              : entry.action === "update"
              ? "import_update"
              : "link",
          zoho_item_id: entry.zoho_item_id,
          tiendanube_product_id: tnProductId,
          status: "success",
          duration_ms: Date.now() - start,
        });

        results.push({
          zoho_item_id: entry.zoho_item_id,
          status: "success",
          tiendanube_product_id: tnProductId,
          action: entry.action,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "unknown";
        await admin.from("product_sync_map").upsert(
          {
            store_id: storeId,
            zoho_item_id: entry.zoho_item_id,
            tiendanube_product_id: entry.tiendanube_product_id || null,
            status: "error",
            last_error: msg,
            last_synced_at: new Date().toISOString(),
          },
          { onConflict: "store_id,zoho_item_id" },
        );
        await logSync(admin, storeId, {
          operation: entry.action,
          zoho_item_id: entry.zoho_item_id,
          tiendanube_product_id: entry.tiendanube_product_id || null,
          status: "error",
          message: msg,
          duration_ms: Date.now() - start,
        });
        results.push({
          zoho_item_id: entry.zoho_item_id,
          status: "error",
          message: msg,
          action: entry.action,
        });
      }
    }

    return json({ results });
  } catch (e) {
    console.error("zoho-sync-import error", e);
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});

function tnHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authentication: `bearer ${token}`,
    "User-Agent": "TiendaSync (support@tiendasync.app)",
  };
}

function tnErr(data: any, status: number) {
  if (!data) return `Tiendanube error ${status}`;
  if (typeof data === "string") return data;
  if (data.message) return typeof data.message === "string" ? data.message : JSON.stringify(data.message);
  return `Tiendanube error ${status}: ${JSON.stringify(data)}`;
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
