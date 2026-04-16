import { ShoppingCart, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Order } from '@/lib/tiendanube';

interface DashboardHomeProps {
  orders: Order[];
  storeName: string;
}

export function DashboardHome({ orders, storeName }: DashboardHomeProps) {
  // Calculate stats from orders
  const totalOrders = orders.length;
  const paidOrders = orders.filter(o => o.payment_status === 'paid');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + parseFloat(o.total || '0'), 0);
  const pendingOrders = orders.filter(o => o.payment_status === 'pending').length;
  const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

  // Get currency from first order
  const currency = orders[0]?.currency || 'ARS';

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Welcome */}
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
          Bienvenido a {storeName}
        </h1>
        <p className="text-muted-foreground mt-1">
          Aquí tienes un resumen de tu tienda
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={ShoppingCart}
          label="Total Órdenes"
          value={totalOrders.toString()}
          color="primary"
        />
        <StatCard
          icon={DollarSign}
          label="Ingresos (Pagados)"
          value={`${currency} ${totalRevenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
          color="success"
        />
        <StatCard
          icon={Clock}
          label="Pendientes de Pago"
          value={pendingOrders.toString()}
          color="warning"
        />
        <StatCard
          icon={TrendingUp}
          label="Valor Promedio"
          value={`${currency} ${avgOrderValue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
          color="accent"
        />
      </div>

      {/* Quick Info */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-display font-semibold text-lg mb-4">Información Rápida</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Órdenes Completadas</p>
              <p className="text-2xl font-bold text-foreground">
                {orders.filter(o => o.status === 'closed').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Órdenes Abiertas</p>
              <p className="text-2xl font-bold text-foreground">
                {orders.filter(o => o.status === 'open').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Órdenes Canceladas</p>
              <p className="text-2xl font-bold text-foreground">
                {orders.filter(o => o.status === 'cancelled').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: 'primary' | 'success' | 'warning' | 'accent';
}

const colorClasses = {
  primary: 'gradient-brand',
  success: 'bg-success',
  warning: 'bg-warning',
  accent: 'bg-accent',
};

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          </div>
          <div className={`w-10 h-10 rounded-xl ${colorClasses[color]} flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-primary-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
