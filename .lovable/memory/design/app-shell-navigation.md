---
name: app-shell-navigation
description: Layout principal con header tipo admin Tiendanube. Título a la izquierda, navegación entre módulos + acciones contextuales a la derecha. Sin sidebar lateral.
type: design
---
La navegación principal de la app NO es un sidebar lateral.

Patrón (`src/components/AppShell.tsx`):
- Top bar fina con marca TiendaSync + nombre de tienda + botón "Desconectar"
- Header de página: `<Title>` a la izquierda, a la derecha grupo de `<Button>` para cambiar de módulo + slot `pageActions` para acciones contextuales (Sincronizar, Filtros, etc.)
- Contenido debajo

Módulos actuales:
- `configuration` → "Configuración" (cards de Tiendanube + Zoho)
- `sync-products` → "Sync Productos" (tabla de items de Zoho con import a TN)

Para agregar un módulo: agregar a `sections` en `src/pages/Index.tsx` y crear su View component.
