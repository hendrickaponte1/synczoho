import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { LandingHero } from '@/components/LandingHero';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Loader2, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

export default function Index() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string>('Mi Tienda');
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [authMessage, setAuthMessage] = useState('');
  const [activeSection, setActiveSection] = useState('dashboard');

  useEffect(() => {
    const code = searchParams.get('code');
    
    if (code) {
      setAuthStatus('loading');
      setAuthMessage('Conectando tu tienda...');
      
      async function exchangeCode() {
        try {
          const { data, error } = await supabase.functions.invoke('tiendanube-auth', {
            body: { code },
          });

          if (error) throw error;

          if (data.success) {
            localStorage.setItem('tiendanube_store_id', data.store_id.toString());
            localStorage.setItem('tiendanube_store_name', data.store_name || 'Mi Tienda');
            setStoreId(data.store_id.toString());
            setStoreName(data.store_name || 'Mi Tienda');
            setAuthStatus('success');
            setAuthMessage(`¡Tienda "${data.store_name}" conectada exitosamente!`);
            
            // Clean URL
            setTimeout(() => {
              setAuthStatus('idle');
              navigate('/', { replace: true });
            }, 2000);
          } else {
            throw new Error(data.error || 'Error desconocido');
          }
        } catch (err) {
          console.error('Auth error:', err);
          setAuthStatus('error');
          setAuthMessage(err instanceof Error ? err.message : 'Error al conectar la tienda');
        }
      }

      exchangeCode();
      setLoading(false);
      return;
    }

    const id = localStorage.getItem('tiendanube_store_id');
    const name = localStorage.getItem('tiendanube_store_name');
    setStoreId(id);
    if (name) setStoreName(name);
    setLoading(false);
  }, [searchParams, navigate]);

  const handleDisconnect = () => {
    localStorage.removeItem('tiendanube_store_id');
    localStorage.removeItem('tiendanube_store_name');
    setStoreId(null);
    setStoreName('Mi Tienda');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  // Show auth processing screen
  if (authStatus === 'loading' || authStatus === 'success' || authStatus === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-xl p-8 max-w-md w-full text-center border border-border shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-6">
            <RefreshCw className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="mb-6">
            {authStatus === 'loading' && <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />}
            {authStatus === 'success' && <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />}
            {authStatus === 'error' && <XCircle className="w-10 h-10 text-destructive mx-auto" />}
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">
            {authStatus === 'loading' && 'Conectando tu tienda...'}
            {authStatus === 'success' && '¡Conectado!'}
            {authStatus === 'error' && 'Error de conexión'}
          </h2>
          <p className="text-muted-foreground text-sm">{authMessage}</p>
          {authStatus === 'error' && (
            <button
              onClick={() => { setAuthStatus('idle'); navigate('/', { replace: true }); }}
              className="mt-6 px-6 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors text-sm font-medium"
            >
              Volver al inicio
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!storeId) {
    return <LandingHero />;
  }

  return (
    <DashboardLayout
      storeName={storeName}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      onDisconnect={handleDisconnect}
    >
      {activeSection === 'dashboard' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Bienvenido a TiendaSync</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Tiendanube</CardTitle>
                  <Badge variant="default" className="bg-green-500 text-white text-xs">Conectada</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Tienda: <span className="font-medium text-foreground">{storeName}</span>
                </p>
              </CardContent>
            </Card>

            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Zoho Inventory</CardTitle>
                  <Badge variant="secondary" className="text-xs">Pendiente</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Conecta tu cuenta de Zoho Inventory para iniciar la sincronización.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}