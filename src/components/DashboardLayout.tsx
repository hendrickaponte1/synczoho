import { ReactNode, useState } from 'react';
import { Store, ShoppingCart, LayoutDashboard, Settings, LogOut, Menu, User, Truck, Users, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  storeName: string;
  activeSection: string;
  onSectionChange: (section: string) => void;
  onDisconnect: () => void;
  onLogout?: () => void;
  userEmail?: string;
  isAdmin?: boolean;
}

// Definir items con permisos: 'all' = todos, 'admin' = solo admins
const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'all' },
  { id: 'orders', label: 'Ventas', icon: ShoppingCart, permission: 'admin' },
  { id: 'delivery', label: 'Entrega Estimada', icon: Truck, permission: 'all' },
  { id: 'settings', label: 'Configuración', icon: Settings, permission: 'admin' },
  { id: 'users', label: 'Usuarios', icon: Users, permission: 'admin' },
];

export function DashboardLayout({ 
  children, 
  storeName, 
  activeSection, 
  onSectionChange,
  onDisconnect,
  onLogout,
  userEmail,
  isAdmin = false
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filtrar items del menú según el rol
  const visibleMenuItems = menuItems.filter(item => 
    item.permission === 'all' || (item.permission === 'admin' && isAdmin)
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-foreground/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
                <Store className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="font-display text-lg font-bold text-foreground">TiendaSync</span>
                <p className="text-xs text-muted-foreground truncate max-w-[140px]">{storeName}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {visibleMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onSectionChange(item.id);
                  setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                  activeSection === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* User & Actions */}
          <div className="p-4 border-t border-border space-y-2">
            {userEmail && (
              <div className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span className="truncate">{userEmail}</span>
              </div>
            )}
            
            <button
              onClick={onDisconnect}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <Store className="w-5 h-5" />
              Desconectar Tienda
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Cerrar Sesión
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-card border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <span className="font-display font-bold">{storeName}</span>
            <div className="w-10" />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
