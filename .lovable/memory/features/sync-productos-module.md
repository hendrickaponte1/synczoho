---
name: sync-productos-module
description: Módulo Sync Productos para listar items de Zoho Inventory e importarlos/vincularlos a Tiendanube. Backend con edge functions service-role + tablas product_sync_map y sync_logs.
type: feature
---
Módulo "Sync Productos" — flujo Zoho → Tiendanube.

## Backend (edge functions)
- `supabase/functions/_shared/zoho.ts`: helpers compartidos. `getZohoConnection`, `getValidAccessToken` (refresh automático con retry 401), `zohoFetch` (agrega `organization_id`), `logSync`.
- `zoho-list-items`: lista items de Zoho con paginación, search, filtros (status/stock/match), enriquece con datos del `product_sync_map` y detecta conflictos por nombre contra `products` (TN). Devuelve `match_status`: new | linked | imported | conflict | error.
- `zoho-sync-import`: recibe `items: [{zoho_item_id, action: 'create'|'update'|'link', tiendanube_product_id?}]` + `publish: bool`. Procesa secuencialmente, llama TN API (`POST /v1/{store_id}/products` o `PUT`), upsertea en `product_sync_map`, escribe `sync_logs`. Devuelve resultado por item.
- `sync-logs-list`: trae últimos N logs de la tienda.

Todas usan SERVICE_ROLE para evitar problemas de RLS sin sesión Supabase (la app está embebida en Tiendanube admin).

## DB
- `product_sync_map (store_id, zoho_item_id UNIQUE, zoho_sku, tiendanube_product_id, status, last_synced_at, last_error)` — RLS por ownership de stores.
- `sync_logs (store_id, operation, zoho_item_id, status, message, duration_ms)` — RLS por ownership.

## UI
- `src/components/SyncProductsView.tsx`: filtros + tabla Nimbus + bulk select + modal de confirmación (con checkbox "Publicar al importar", default false = borrador) + modal de resultados con botón "Reintentar errores" + Sidebar de detalle.
- Match SKU: detección automática pero el usuario decide la acción por fila (create / update / link).
- Por defecto: importar como borrador (no publicado).

## Reglas de negocio
- Acciones por fila según `match_status`:
  - `new` → action `create`
  - `linked` | `imported` → action `update` (refresca nombre/desc)
  - `conflict` (mismo nombre encontrado) → action `link` al producto detectado
- TN API usa header `Authentication: bearer <token>`, no `Authorization`.
