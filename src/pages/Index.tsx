import { useState, useEffect } from 'react';
import { LandingHero } from '@/components/LandingHero';
import { DashboardLayout } from '@/components/DashboardLayout';
import { UsersManagement } from '@/components/UsersManagement';
import { useStore } from '@/hooks/useStore';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/contexts/UserRoleContext';
import { Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TIENDANUBE_APP_ID = import.meta.env.VITE_TIENDANUBE_APP_ID || '11473';

const ADMIN_ONLY_SECTIONS = ['users'];

export default function Index() {
  const { user, loading: authLoading, isAuthenticated, signOut } = useAuth();
  const { store, loading: storeLoading, isConnected, clearStore } = useStore(user?.id);
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (!roleLoading && !isAdmin && ADMIN_ONLY_SECTIONS.includes(activeSection)) {
      setActiveSection('dashboard');
      toast.error('Acceso denegado. No tienes permisos para acceder a esta sección.');
    }
  }, [activeSection, isAdmin, roleLoading]);

  const handleSectionChange = (section: string) => {
    if (!isAdmin && ADMIN_ONLY_SECTIONS.includes(section)) {
      toast.error('Acceso denegado. Esta sección es solo para administradores.');
      return;
    }
    setActiveSection(section);
  };

  const handleConnect = () => {
    setIsConnecting(true);
    const state = Math.random().toString(36).substring(7);
    sessionStorage.setItem('tiendanube_state', state);
    const authUrl = `https://www.tiendanube.com/apps/${TIENDANUBE_APP_ID}/authorize?state=${state}`;
    window.location.href = authUrl;
  };

  const handleDisconnect = async () => {
    clearStore();
    setActiveSection('dashboard');
  };

  const handleLogout = async () => {
    await signOut();
    clearStore();
    setActiveSection('dashboard');
  };

  if (authLoading || storeLoading || roleLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !isConnected) {
    return (
      <LandingHero 
        onConnect={handleConnect} 
        isLoading={isConnecting} 
        isAuthenticated={isAuthenticated}
      />
    );
  }

  return (
    <DashboardLayout
      storeName={store?.store_name || 'Mi Tienda'}
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
      onDisconnect={handleDisconnect}
      onLogout={handleLogout}
      userEmail={user?.email}
      isAdmin={isAdmin}
    >
      {activeSection === 'dashboard' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Bienvenido a TiendaSync — Conector Tiendanube ↔ Zoho Inventory</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Tiendanube Conectada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Tu tienda <strong>{store?.store_name}</strong> está conectada correctamente.
                </p>
              </CardContent>
            </Card>

            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  Zoho Inventory
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Próximamente: conecta tu cuenta de Zoho Inventory para sincronizar productos e inventario.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeSection === 'users' && isAdmin && (
        <UsersManagement />
      )}
    </DashboardLayout>
  );
}
