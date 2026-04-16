---
name: Zoho OAuth Integration
description: Flujo OAuth de Zoho Inventory con selector de organization. DC=US (.com). Tabla zoho_connections, edge functions zoho-auth-start y zoho-auth-callback.
type: feature
---
- Tabla `zoho_connections` (única por store_id, asociada a stores).
- Edge functions:
  - `zoho-auth-start`: arma URL de autorización Zoho con state firmado (base64 de {s,d,u,t}).
  - `zoho-auth-callback`: 2 pasos — (1) intercambia code → tokens y lista organizations; (2) recibe organization_id y marca status='active'.
- Scopes: `ZohoInventory.FullAccess.ALL`.
- DC default: `com` (configurable en backend, mapeo accounts.zoho.{dc} y www.zohoapis.{dc}).
- Redirect URI frontend: `${origin}/zoho/callback` (debe estar registrada en la Zoho API console).
- UI: `ZohoConnectCard` en el Dashboard. Requiere store de Tiendanube conectada primero.
- Refresh token guardado para futuras renovaciones (no implementado el refresh aún).
