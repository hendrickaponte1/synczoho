# Memory: index.md
Updated: now

# Project Memory

## Core
TiendaSync: conector entre Tiendanube y Zoho Inventory para sincronizar productos e inventario.
Toda la UI en español. App embebida en admin Tiendanube via Nexo (clientId 29847).
UI con @nimbus-ds/components (Nimbus design system). Iconos: @nimbus-ds/icons.
Navegación: header con título a la izquierda + botones de módulo + acciones a la derecha. SIN sidebar lateral.
Supabase DB con RLS. Auth: Tiendanube OAuth + Email/Password. Roles: admin, customer.
Edge functions con SERVICE_ROLE para operar sin sesión Supabase (app embebida).

## Memories
- [Objetivo principal](mem://proyecto/objetivo-principal) — Conector Tiendanube ↔ Zoho Inventory
- [Auth Flow](mem://autenticacion/flujo) — Tiendanube OAuth and Email/password flow details
- [RBAC Roles](mem://auth/roles-sistema) — Admin vs customer access controls via React context
- [App Config](mem://configuracion/tiendanube-app-id) — Tiendanube App ID 29847
- [Callback URLs](mem://configuracion/urls-callback-tiendanube) — OAuth and webhook callback routes
- [UI Language](mem://idioma/interfaz) — Toda la interfaz en español
- [Nexo Embedded](mem://features/nexo-embedded-mode) — App embebida en admin Tiendanube via @tiendanube/nexo
- [Nimbus Design System](mem://design/nimbus-design-system) — Componentes, iconos y gotchas de la API de Nimbus
- [App Shell Navigation](mem://design/app-shell-navigation) — Header-based navigation, no sidebar
- [Sync Productos](mem://features/sync-productos-module) — Edge functions, tablas y UI del módulo de sync productos
- [Variantes de productos](mem://features/variantes-productos) — Modelo Item Group Zoho ↔ Producto+variantes TN, mapping de atributos y match por SKU
