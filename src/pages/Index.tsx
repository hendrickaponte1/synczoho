import { useState, useEffect } from 'react';
import { LandingHero } from '@/components/LandingHero';
import { DashboardLayout } from '@/components/DashboardLayout';
import { DashboardHome } from '@/components/DashboardHome';
import { OrdersTable } from '@/components/OrdersTable';
import { SettingsPanel } from '@/components/SettingsPanel';
import { DeliveryAdminPanel } from '@/components/delivery/DeliveryAdminPanel';
import { UsersManagement } from '@/components/UsersManagement';
import { useStore } from '@/hooks/useStore';
import { useOrders } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/contexts/UserRoleContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const TIENDANUBE_APP_ID = import.meta.env.VITE_TIENDANUBE_APP_ID || '11473';

// Secciones restringidas solo para admins
const ADMIN_ONLY_SECTIONS = ['orders', 'settings', 'users'];

export default function Index() {
  const { user, loading: authLoading, isAuthenticated, signOut } = useAuth();
  const { store, loading: storeLoading, isConnected, clearStore } = useStore(user?.id);
  const { orders, loading: ordersLoading, error: ordersError, pagination, fetchOrders } = useOrders(store?.store_id);
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isConnecting, setIsConnecting] = useState(false);

  // Fetch orders when store is connected
  useEffect(() => {
    if (isConnected && store?.store_id) {
      fetchOrders({});
    }
  }, [isConnected, store?.store_id]);

  // Protección de rutas: redirigir si un cliente intenta acceder a secciones de admin
  useEffect(() => {
    if (!roleLoading && !isAdmin && ADMIN_ONLY_SECTIONS.includes(activeSection)) {
      setActiveSection('dashboard');
      toast.error('Acceso denegado. No tienes permisos para acceder a esta sección.');
    }
  }, [activeSection, isAdmin, roleLoading]);

  const handleSectionChange = (section: string) => {
    // Verificar permisos antes de cambiar de sección
    if (!isAdmin && ADMIN_ONLY_SECTIONS.includes(section)) {
      toast.error('Acceso denegado. Esta sección es solo para administradores.');
      return;
    }
    setActiveSection(section);
  };

  const handleConnect = () => {
    setIsConnecting(true);
    
    // Generate CSRF state
    const state = Math.random().toString(36).substring(7);
    sessionStorage.setItem('tiendanube_state', state);

    // Redirect to Tiendanube OAuth
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

  // Loading state
  if (authLoading || storeLoading || roleLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  // Not authenticated or not connected - show landing
  if (!isAuthenticated || !isConnected) {
    return (
      <LandingHero 
        onConnect={handleConnect} 
        isLoading={isConnecting} 
        isAuthenticated={isAuthenticated}
      />
    );
  }

  // Connected - show dashboard
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
        <DashboardHome orders={orders} storeName={store?.store_name || 'Mi Tienda'} />
      )}
      
      {activeSection === 'orders' && isAdmin && (
        <OrdersTable
          orders={orders}
          loading={ordersLoading}
          error={ordersError}
          pagination={pagination}
          onFetch={fetchOrders}
        />
      )}

      {activeSection === 'delivery' && (
        <DeliveryAdminPanel storeId={store?.store_id} userId={user?.id} />
      )}

      {activeSection === 'settings' && store && isAdmin && (
        <SettingsPanel store={store} onDisconnect={handleDisconnect} />
      )}

      {activeSection === 'users' && isAdmin && (
        <UsersManagement />
      )}
    </DashboardLayout>
  );
}
