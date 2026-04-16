// Helpers compartidos para llamar a la API de Tiendanube.
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export const TN_API = "https://api.tiendanube.com/v1";
export const TN_USER_AGENT = "TiendaSync (support@lovable.dev)";

export interface TiendanubeStore {
  store_id: string;
  access_token: string;
  store_name: string | null;
}

export async function getStore(
  admin: SupabaseClient,
  storeId: string,
): Promise<TiendanubeStore> {
  const { data, error } = await admin
    .from("stores")
    .select("store_id, access_token, store_name")
    .eq("store_id", storeId)
    .maybeSingle();
  if (error) throw new Error(`DB error: ${error.message}`);
  if (!data) throw new Error("Tienda no encontrada");
  return data as TiendanubeStore;
}

export async function tnFetch(
  store: TiendanubeStore,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const url = `${TN_API}/${store.store_id}${path.startsWith("/") ? path : "/" + path}`;
  const headers = new Headers(init.headers || {});
  headers.set("Authentication", `bearer ${store.access_token}`);
  headers.set("User-Agent", TN_USER_AGENT);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return await fetch(url, { ...init, headers });
}

export async function tnFetchJson<T = any>(
  store: TiendanubeStore,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const resp = await tnFetch(store, path, init);
  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`Tiendanube API ${resp.status}: ${text.slice(0, 500)}`);
  }
  return text ? JSON.parse(text) : ({} as T);
}
