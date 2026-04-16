// Sincroniza clientes Tiendanube → Zoho (bulk).
import {
  corsHeaders,
  getAdminClient,
  getZohoConnection,
  zohoFetch,
  logSync,
} from "../_shared/zoho.ts";
import { getStore, tnFetchJson } from "../_shared/tiendanube.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const t0 = Date.now();
  try {
    const { storeId, limit = 50, page = 1 } = await req.json();
    if (!storeId) {
      return new Response(JSON.stringify({ error: "storeId requerido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = getAdminClient();
    const store = await getStore(admin, storeId);
    const conn = await getZohoConnection(admin, storeId);

    const customers = await tnFetchJson<any[]>(
      store,
      `/customers?page=${page}&per_page=${limit}`,
    );

    let created = 0;
    let linked = 0;
    let errors = 0;
    const details: any[] = [];

    for (const c of customers) {
      try {
        const email = c.email;
        if (!email) {
          details.push({ id: c.id, status: "skipped", reason: "sin email" });
          continue;
        }
        // existing map
        const { data: map } = await admin
          .from("customer_sync_map")
          .select("zoho_contact_id")
          .eq("store_id", storeId)
          .eq("email", email)
          .maybeSingle();

        let zohoId = map?.zoho_contact_id || null;
        if (!zohoId) {
          // search
          const sResp = await zohoFetch(
            admin,
            conn,
            `/inventory/v1/contacts?email=${encodeURIComponent(email)}`,
          );
          const sJson = await sResp.json();
          if (sJson.contacts?.[0]?.contact_id) {
            zohoId = sJson.contacts[0].contact_id;
            linked++;
          } else {
            // create
            const cResp = await zohoFetch(admin, conn, `/inventory/v1/contacts`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contact_name: c.name || email,
                contact_type: "customer",
                contact_persons: [
                  {
                    first_name: c.name || email,
                    email,
                    phone: c.phone || "",
                    is_primary_contact: true,
                  },
                ],
              }),
            });
            const cJson = await cResp.json();
            if (cResp.ok && cJson.contact?.contact_id) {
              zohoId = cJson.contact.contact_id;
              created++;
            } else {
              throw new Error(JSON.stringify(cJson).slice(0, 300));
            }
          }
        }
        await admin.from("customer_sync_map").upsert(
          {
            store_id: storeId,
            tiendanube_customer_id: c.id,
            email,
            zoho_contact_id: zohoId,
            status: "success",
            last_synced_at: new Date().toISOString(),
            last_error: null,
          },
          { onConflict: "store_id,email" },
        );
        details.push({ email, status: "ok", zoho_contact_id: zohoId });
      } catch (e) {
        errors++;
        const msg = e instanceof Error ? e.message : "Error";
        details.push({ email: c.email, status: "error", error: msg });
        await admin.from("customer_sync_map").upsert(
          {
            store_id: storeId,
            tiendanube_customer_id: c.id,
            email: c.email,
            status: "error",
            last_error: msg,
          },
          { onConflict: "store_id,email" },
        );
      }
    }

    await logSync(admin, storeId, {
      operation: "customer_sync_bulk",
      status: errors === 0 ? "success" : "error",
      message: `Created: ${created} / Linked: ${linked} / Errors: ${errors}`,
      duration_ms: Date.now() - t0,
      payload: { created, linked, errors, total: customers.length },
    });

    return new Response(
      JSON.stringify({ created, linked, errors, total: customers.length, details }),
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
