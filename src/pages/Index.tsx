import { useState, useEffect } from 'react';
import { LandingHero } from '@/components/LandingHero';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Index() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string>('Mi Tienda');
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');

  useEffect(() => {
    const id = localStorage.getItem('tiendanube_store_id');
    const name = localStorage.getItem('tiendanube_store_name');
    setStoreId(id);
    if (name) setStoreName(name);
    setLoading(false);
  }, []);

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
