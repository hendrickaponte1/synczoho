---
name: nimbus-design-system
description: TiendaSync usa @nimbus-ds/components, @nimbus-ds/styles y @nimbus-ds/icons como design system principal. shadcn solo se usa en componentes legacy.
type: design
---
La app usa el design system Nimbus de Tiendanube en todas las pantallas nuevas:

- Paquetes: `@nimbus-ds/components`, `@nimbus-ds/styles`, `@nimbus-ds/icons`
- `@nimbus-ds/styles/dist/index.css` se importa en `src/main.tsx` antes de `index.css`
- Componentes usados: Box, Card, Button, Input, Select, Checkbox, Tag, Spinner, Table, Pagination, Alert, Modal, IconButton, Tooltip, Sidebar, Title, Text
- API gotchas:
  - `Tabs` requiere `selected: number` + `onTabSelect`. Para nav entre módulos usamos un grupo de `<Button>` con `appearance` condicional (más fiel al admin Tiendanube)
  - `Select` requiere `name` e `id`
  - `Box` no soporta `borderBottomColor` (usar `borderColor` + `borderBottomWidth`)
  - `Box` `display` no acepta "inline-block" → usar "inline-flex"
  - No existe `EmptyMessage` → usar Box + Icon + Text
- Iconos vienen de `@nimbus-ds/icons` (NO `lucide-react`) en componentes Nimbus
- shadcn/ui se mantiene SOLO en código legacy: `ZohoConnectCard`, `LandingHero`, callbacks
