import { Store, ShoppingCart, BarChart3, Zap, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface LandingHeroProps {
  onConnect: () => void;
  isLoading?: boolean;
  isAuthenticated?: boolean;
}

export function LandingHero({ onConnect, isLoading, isAuthenticated }: LandingHeroProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
              <Store className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-white">TiendaSync</span>
          </div>
          
          {!isAuthenticated && (
            <Button
              variant="ghost"
              onClick={() => navigate('/auth')}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Iniciar Sesión
            </Button>
          )}
        </div>
      </header>

      {/* Hero Content */}
      <main className="flex-1 container mx-auto px-4 flex items-center">
        <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
          {/* Left Column - Text */}
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-sm text-white/90">Plugin para Tiendanube</span>
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Gestiona tus ventas de forma
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary-foreground"> inteligente</span>
            </h1>
            
            <p className="text-lg text-white/70 mb-8 max-w-xl">
              Conecta tu tienda de Tiendanube y obtén acceso a un dashboard completo para visualizar, filtrar y analizar todas tus ventas en tiempo real.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              {isAuthenticated ? (
                <Button
                  size="lg"
                  onClick={onConnect}
                  disabled={isLoading}
                  className="gradient-brand text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-glow hover:opacity-90 transition-opacity"
                >
                  {isLoading ? 'Conectando...' : 'Conectar mi Tienda'}
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    onClick={() => navigate('/auth')}
                    className="gradient-brand text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-glow hover:opacity-90 transition-opacity"
                  >
                    Comenzar Ahora
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate('/auth')}
                    className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-xl"
                  >
                    Ya tengo cuenta
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Right Column - Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <FeatureCard
              icon={ShoppingCart}
              title="Todas tus Ventas"
              description="Visualiza todas las órdenes de tu tienda en un solo lugar"
            />
            <FeatureCard
              icon={BarChart3}
              title="Filtros Avanzados"
              description="Filtra por estado, fecha, método de pago y más"
            />
            <FeatureCard
              icon={Store}
              title="Multi-tienda"
              description="Conecta múltiples tiendas y gestiónalas desde aquí"
            />
            <FeatureCard
              icon={Zap}
              title="Tiempo Real"
              description="Datos actualizados directamente desde la API"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-6">
        <p className="text-white/50 text-sm text-center">
          Plugin desarrollado para Tiendanube/Nuvemshop
        </p>
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
    <div className="glass rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-colors">
      <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-primary-foreground" />
      </div>
      <h3 className="font-display font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/60 text-sm">{description}</p>
    </div>
  );
}
