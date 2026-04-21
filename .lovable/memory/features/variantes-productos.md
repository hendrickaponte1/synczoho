---
name: variantes-productos
description: Soporte de variantes Zoho ↔ Tiendanube. Item Group de Zoho = Producto con N variantes en TN. Match por SKU estricto.
type: feature
---
# Variantes de productos

## Modelo
- **Zoho Item Group** ↔ **Producto TN con N variantes**.
- Item suelto en Zoho (sin group_id) → producto TN simple (1 variante).
- Atributos de Zoho (`attribute_name1/2/3` + `attribute_option_name1/2/3`) →
  TN `attributes: [{es:"Talle"}, {es:"Color"}]` + `variants[].values: [{es:"M"},{es:"Rojo"}]` (mismo orden).

## Identificadores
- En la UI/listado, cada fila tiene `row_id`:
  - `group:{group_id}` para grupos (todas las variantes representadas como 1 fila).
  - `item:{item_id}` para items sueltos.
- En `product_sync_map.zoho_item_id` guardamos:
  - `group:{gid}` para el "padre" del grupo.
  - El `item_id` real para CADA variante hija (con `tiendanube_product_id` igual al del padre).
  - Esto permite que `zoho-create-salesorder` y `sync-stock-run` matcheen por SKU de variante.

## Edge functions
- `zoho-list-items`: pide `per_page * 4` a Zoho, agrupa por `group_id`, llama `/itemgroups/{gid}` para traer TODAS las variantes (la paginación de /items puede partir grupos), arma `variants[]` con atributos.
- `zoho-sync-import`: detecta `group:` prefix → `loadZohoProduct` trae el item_group y construye `payload.variants[]` con `values` ordenados igual que `attributes`. En `update`, hace `syncVariantsUpdate` matcheando variantes TN existentes por SKU y actualiza precio/stock.
- `sync-stock-run`: ya itera por `p.variants[]` matcheando por SKU normalizado (uppercase + trim). Funciona out-of-the-box con variantes porque Zoho expone cada hijo con su propio SKU.

## Match estricto por SKU
- Variantes sin SKU se ignoran en stock sync.
- Para forzar `stock` en TN se setea `stock_management: true` en cada PUT (TN ignora `stock` si no está activo).
