# Project Memory

## Core
TiendaSync: conector entre Tiendanube y Zoho Inventory para sincronizar productos e inventario.
Toda la UI en español. App embebida en admin Tiendanube via Nexo (clientId 29847).
Supabase DB con RLS. Auth: Tiendanube OAuth + Email/Password. Roles: admin, customer.
Zoho OAuth: DC=US (.com), redirect `/zoho/callback`, scope FullAccess.ALL.

## Memories
- [Objetivo principal](mem://proyecto/objetivo-principal) — Conector Tiendanube ↔ Zoho Inventory
- [Auth Flow](mem://autenticacion/flujo) — Tiendanube OAuth and Email/password flow details
- [RBAC Roles](mem://auth/roles-sistema) — Admin vs customer access controls via React context
- [App Config](mem://configuracion/tiendanube-app-id) — Tiendanube App ID 29847
- [Callback URLs](mem://configuracion/urls-callback-tiendanube) — OAuth and webhook callback routes
- [UI Language](mem://idioma/interfaz) — Toda la interfaz en español
- [Nexo Embedded](mem://features/nexo-embedded-mode) — App embebida en admin Tiendanube via @tiendanube/nexo
- [Zoho OAuth](mem://features/zoho-oauth-integration) — Flujo OAuth Zoho Inventory + selector de organization
