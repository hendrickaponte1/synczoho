import { RefreshCw, Package, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TIENDANUBE_APP_ID, getAuthorizationUrl } from '@/lib/tiendanube';

export function LandingHero() {
  const handleConnect = () => {
    window.location.href = getAuthorizationUrl(TIENDANUBE_APP_ID);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">TiendaSync</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <section className="flex-1 flex items-center">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <div className="max-w-3xl mx-auto text-center animate-slide-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-xs font-medium text-primary">Conector para Tiendanube</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-[1.1] tracking-tight mb-6">
                Sincroniza tu tienda con{' '}
                <span className="text-primary">Zoho Inventory</span>
              </h1>
              
              <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
                Conecta Tiendanube y Zoho Inventory para mantener precios, stock y órdenes sincronizados de forma automática.
              </p>

              <Button
                size="lg"
                onClick={handleConnect}
                className="px-8 h-12 text-base font-semibold rounded-lg"
              >
                Comenzar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-secondary/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-4xl mx-auto">
              <FeatureCard
                icon={Package}
                title="Precios de productos"
                description="Sincroniza precios entre Tiendanube y Zoho Inventory de forma automática."
              />
              <FeatureCard
                icon={RefreshCw}
                title="Stock en tiempo real"
                description="Mantén el inventario actualizado en ambas plataformas sin intervención manual."
              />
              <FeatureCard
                icon={ShoppingBag}
                title="Órdenes"
                description="Las órdenes de Tiendanube se reflejan automáticamente en Zoho Inventory."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-muted-foreground text-sm text-center">
            Desarrollado para Tiendanube · Integración con Zoho Inventory
          </p>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-card rounded-xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow animate-fade-in">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h3 className="font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}
