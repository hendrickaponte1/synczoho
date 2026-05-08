import {
  RefreshCw,
  ArrowRight,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Zap,
  Shield,
  CheckCircle2,
  Clock,
  ArrowLeftRight,
  Layers,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TIENDANUBE_APP_ID, getAuthorizationUrl } from '@/lib/tiendanube';

export function LandingHero() {
  const handleConnect = () => {
    window.location.href = getAuthorizationUrl(TIENDANUBE_APP_ID);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">

      {/* ── NAV ── */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <RefreshCw className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">ZohoSync</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Tiendanube Partner
            </span>
            <Button size="sm" onClick={handleConnect} className="font-semibold">
              Instalar ahora
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* ── HERO ── */}
        <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28">
          {/* Gradient blob */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center animate-slide-up">

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15 mb-6 text-xs font-medium text-primary">
                <Zap className="w-3 h-3" />
                Integración en tiempo real · Sin polling
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-[1.1] tracking-tight mb-6">
                Tu tienda y{' '}
                <span className="text-primary">Zoho Inventory</span>,{' '}
                siempre sincronizados
              </h1>

              <p className="text-lg text-muted-foreground mb-4 max-w-2xl mx-auto leading-relaxed">
                ZohoSync conecta Tiendanube con Zoho Inventory de forma bidireccional.
                Órdenes, productos, stock y clientes — sincronizados automáticamente,
                en segundos.
              </p>

              <p className="text-sm text-muted-foreground mb-10 opacity-75">
                Sin doble carga de datos. Sin errores manuales.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button size="lg" onClick={handleConnect} className="px-8 h-12 text-base font-semibold rounded-lg w-full sm:w-auto">
                  Conectar mi tienda
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Instalación rápida · Sin configuraciones complejas
                </span>
              </div>
            </div>

            {/* ── SYNC VISUAL ── */}
            <div className="mt-16 max-w-2xl mx-auto animate-fade-in">
              <div className="relative flex items-center justify-center gap-4">
                {/* Tiendanube card */}
                <div className="flex-1 bg-card border border-border rounded-xl p-5 shadow-md text-center">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                  </div>
                  <div className="font-semibold text-foreground text-sm">Tiendanube</div>
                  <div className="text-xs text-muted-foreground mt-1">Tu tienda online</div>
                  <div className="mt-3 flex flex-col gap-1">
                    <div className="h-1.5 rounded-full bg-primary/20 w-full" />
                    <div className="h-1.5 rounded-full bg-primary/15 w-3/4 mx-auto" />
                    <div className="h-1.5 rounded-full bg-primary/10 w-1/2 mx-auto" />
                  </div>
                </div>

                {/* Sync arrows */}
                <div className="flex flex-col items-center gap-2 px-2">
                  <div className="flex items-center gap-1 bg-green-50 border border-green-200 rounded-full px-2.5 py-1 text-xs font-medium text-green-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Live
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1 text-primary">
                      <div className="w-16 h-px bg-primary/40" />
                      <ChevronRight className="w-3 h-3 flex-shrink-0" />
                    </div>
                    <div className="flex items-center gap-1 text-primary rotate-180">
                      <div className="w-16 h-px bg-primary/40" />
                      <ChevronRight className="w-3 h-3 flex-shrink-0" />
                    </div>
                  </div>
                  <RefreshCw className="w-4 h-4 text-primary/50" />
                </div>

                {/* Zoho card */}
                <div className="flex-1 bg-card border border-border rounded-xl p-5 shadow-md text-center">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Layers className="w-5 h-5 text-primary" />
                  </div>
                  <div className="font-semibold text-foreground text-sm">Zoho Inventory</div>
                  <div className="text-xs text-muted-foreground mt-1">Tu ERP / gestión</div>
                  <div className="mt-3 flex flex-col gap-1">
                    <div className="h-1.5 rounded-full bg-primary/20 w-full" />
                    <div className="h-1.5 rounded-full bg-primary/15 w-3/4 mx-auto" />
                    <div className="h-1.5 rounded-full bg-primary/10 w-1/2 mx-auto" />
                  </div>
                </div>
              </div>

              {/* Sync badges */}
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {['Órdenes', 'Productos', 'Stock', 'Clientes'].map((label) => (
                  <span key={label} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary border border-border text-xs text-muted-foreground font-medium">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── REGIONS ── */}
        <section className="border-y border-border bg-secondary/30 py-5">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Disponible en:</span>
              {[
                { flag: '🇦🇷', name: 'Argentina' },
                { flag: '🇲🇽', name: 'México' },
                { flag: '🇧🇷', name: 'Brasil' },
                { flag: '🇨🇴', name: 'Colombia' },
                { flag: '🇨🇱', name: 'Chile' },
              ].map((r) => (
                <span key={r.name} className="flex items-center gap-1.5">
                  <span className="text-base">{r.flag}</span>
                  {r.name}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── MODULES ── */}
        <section className="py-20 lg:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4 text-primary border-primary/30">Funcionalidades</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
                Todo lo que necesitas para gestionar
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Cuatro módulos integrados que eliminan la doble carga de datos entre tu tienda y Zoho Inventory.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              <ModuleCard
                icon={ShoppingCart}
                title="Órdenes en tiempo real"
                direction="Tiendanube → Zoho"
                directionColor="text-blue-600"
                description="Cada vez que se genera un pedido en tu tienda, ZohoSync crea automáticamente una Sales Order en Zoho Inventory en segundos."
                features={[
                  'Via webhooks — sin polling',
                  'Detecta y crea el contacto si no existe',
                  'Soporta order/paid, created, updated, cancelled',
                  'Reintento automático ante errores',
                ]}
                badge="Automático"
              />
              <ModuleCard
                icon={Package}
                title="Importación de productos"
                direction="Zoho → Tiendanube"
                directionColor="text-violet-600"
                description="Importa tu catálogo de Zoho Inventory a Tiendanube con matching automático por SKU. Ve el estado de cada producto antes de confirmar."
                features={[
                  'Matching inteligente por SKU',
                  'Acciones: crear, actualizar o solo vincular',
                  'Nombre, precio, descripción, stock inicial',
                  'Imágenes, peso y categoría opcionales',
                ]}
                badge="Con vista previa"
              />
              <ModuleCard
                icon={BarChart3}
                title="Sincronización de stock"
                direction="Zoho → Tiendanube"
                directionColor="text-violet-600"
                description="Mantén el inventario de tu tienda siempre actualizado con los niveles reales de Zoho Inventory. Revisa los cambios antes de aplicarlos."
                features={[
                  'Vista previa antes de sincronizar',
                  'Bulk endpoint: hasta 100 productos por llamada',
                  'Ejecución manual con un clic',
                  'Log de productos actualizados',
                ]}
                badge="Bulk sync"
              />
              <ModuleCard
                icon={Users}
                title="Sincronización de clientes"
                direction="Tiendanube → Zoho"
                directionColor="text-blue-600"
                description="Los clientes de tu tienda se crean automáticamente como Contactos en Zoho Inventory. Deduplicación automática por email."
                features={[
                  'Sin duplicados — match por email',
                  'Clientes nuevos: crea el Contacto en Zoho',
                  'Clientes existentes: vincula sin duplicar',
                  'Webhooks customer/created y updated',
                ]}
                badge="Sin duplicados"
              />
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="py-20 lg:py-24 bg-secondary/30 border-y border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4 text-primary border-primary/30">Instalación</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
                Listo en 3 pasos
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Sin configuraciones complicadas. Desde la App Store de Tiendanube hasta sincronizando en minutos.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                {
                  step: '01',
                  icon: ShoppingCart,
                  title: 'Instala desde Tiendanube',
                  desc: 'Haz clic en "Instalar" en la App Store y autoriza los permisos. ZohoSync queda embebida dentro de tu admin — sin panel externo.',
                },
                {
                  step: '02',
                  icon: Layers,
                  title: 'Conecta Zoho Inventory',
                  desc: 'Autoriza tu cuenta de Zoho con OAuth 2.0. ZohoSync nunca almacena tu contraseña — solo un token seguro y revocable.',
                },
                {
                  step: '03',
                  icon: RefreshCw,
                  title: 'Empieza a sincronizar',
                  desc: 'Los webhooks se registran automáticamente. Las órdenes fluyen a Zoho en segundos. El stock se sincroniza cuando tú lo decides.',
                },
              ].map((item) => (
                <div key={item.step} className="bg-card rounded-xl p-6 border border-border shadow-sm relative">
                  <div className="absolute top-4 right-4 text-4xl font-black text-border/60 select-none leading-none">{item.step}</div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TECHNICAL HIGHLIGHTS ── */}
        <section className="py-20 lg:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge variant="outline" className="mb-4 text-primary border-primary/30">Tecnología</Badge>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
                  Diseñado para ser eficiente y confiable
                </h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  ZohoSync no hace consultas innecesarias a la API. Cada operación está optimizada para minimizar el uso de recursos y maximizar la velocidad.
                </p>
                <div className="space-y-4">
                  {[
                    {
                      icon: Zap,
                      title: 'Webhooks, no polling',
                      desc: 'Los eventos de órdenes y clientes llegan en tiempo real. Sin consultas periódicas.',
                    },
                    {
                      icon: BarChart3,
                      title: 'Sync de stock en bulk',
                      desc: 'Hasta 100 productos en una sola llamada — hasta 100× más eficiente que PUT individual.',
                    },
                    {
                      icon: Shield,
                      title: 'Idempotente por diseño',
                      desc: 'Todas las operaciones usan UPSERT. Una reinstalación no duplica datos.',
                    },
                    {
                      icon: Clock,
                      title: 'Historial completo',
                      desc: 'Cada operación queda registrada con estado, duración y mensaje. Reintenta errores individualmente.',
                    },
                  ].map((item) => (
                    <div key={item.title} className="flex gap-4 items-start">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <item.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground text-sm mb-0.5">{item.title}</div>
                        <div className="text-muted-foreground text-sm leading-relaxed">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Entity mapping visual */}
              <div className="bg-card rounded-2xl border border-border shadow-md p-6 lg:p-8">
                <div className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-primary" />
                  Mapeo de entidades
                </div>
                <div className="space-y-3">
                  {[
                    { tn: 'Producto', zoho: 'Item', icon: Package },
                    { tn: 'Variante', zoho: 'Item (con atributos)', icon: Layers },
                    { tn: 'Orden', zoho: 'Sales Order', icon: ShoppingCart },
                    { tn: 'Cliente', zoho: 'Contact', icon: Users },
                    { tn: 'Stock', zoho: 'Stock on Hand', icon: BarChart3 },
                    { tn: 'Precio', zoho: 'Sales Price', icon: FileText },
                  ].map((row) => (
                    <div key={row.tn} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center flex-shrink-0">
                        <row.icon className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium text-foreground whitespace-nowrap">{row.tn}</span>
                        <div className="flex-1 border-t border-dashed border-border" />
                        <span className="text-sm text-muted-foreground whitespace-nowrap">{row.zoho}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-border">
                  <div className="text-xs text-muted-foreground flex items-start gap-2">
                    <Shield className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                    SKU como clave universal de matching — normalizado a UPPERCASE en ambas plataformas.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="py-20 lg:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6 shadow-lg">
                <RefreshCw className="w-7 h-7 text-primary-foreground" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
                ¿Listo para dejar de cargar datos a mano?
              </h2>
              <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                Instala ZohoSync en minutos y deja que tu tienda y Zoho Inventory
                se mantengan sincronizados solos.
              </p>
              <Button size="lg" onClick={handleConnect} className="px-10 h-13 text-base font-semibold rounded-lg">
                Instalar ZohoSync
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                Instalación en minutos · Sin configuraciones complejas
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border py-8 bg-secondary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                <RefreshCw className="w-3 h-3 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground text-sm">ZohoSync</span>
              <span className="text-muted-foreground text-sm">· Focus Technology</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a href="mailto:support@focustech.io" className="hover:text-foreground transition-colors">
                support@focustech.io
              </a>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Sistema operativo
              </span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

/* ── MODULE CARD ── */
interface ModuleCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  direction: string;
  directionColor: string;
  description: string;
  features: string[];
  badge: string;
}

function ModuleCard({ icon: Icon, title, direction, directionColor, description, features, badge }: ModuleCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary border border-border text-muted-foreground">
          {badge}
        </span>
      </div>
      <h3 className="font-bold text-foreground mb-1">{title}</h3>
      <div className={`text-xs font-medium mb-3 ${directionColor} flex items-center gap-1`}>
        <ArrowLeftRight className="w-3 h-3" />
        {direction}
      </div>
      <p className="text-muted-foreground text-sm leading-relaxed mb-4">{description}</p>
      <ul className="space-y-1.5">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
