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
import { Badge } from '@/components/ui/badge';

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
    window.location.href = `https://www.tiendanube.com/apps/${TIENDANUBE_APP_ID}/authorize?state=${state}`;
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
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
            <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Estado de tus conexiones y sincronización</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Tiendanube</CardTitle>
                  <Badge variant="default" className="bg-success text-success-foreground text-xs">Conectada</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Tienda: <span className="font-medium text-foreground">{store?.store_name}</span>
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

      {activeSection === 'users' && isAdmin && (
        <UsersManagement />
      )}
    </DashboardLayout>
  );
}
