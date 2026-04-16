import { ReactNode, useState } from 'react';
import { RefreshCw, LayoutDashboard, LogOut, Menu, User, Users } from 'lucide-react';
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

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'all' },
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

  const visibleMenuItems = menuItems.filter(item => 
    item.permission === 'all' || (item.permission === 'admin' && isAdmin)
  );

  return (
    <div className="min-h-screen bg-secondary/40 flex">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-60 bg-card border-r border-border transform transition-transform lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="px-5 h-16 flex items-center border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <span className="text-sm font-bold text-foreground">TiendaSync</span>
                <p className="text-xs text-muted-foreground truncate max-w-[130px]">{storeName}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-0.5">
            {visibleMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onSectionChange(item.id);
                  setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  activeSection === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-3 border-t border-border space-y-0.5">
            {userEmail && (
              <div className="flex items-center gap-2.5 px-3 py-2 text-xs text-muted-foreground">
                <User className="w-3.5 h-3.5" />
                <span className="truncate">{userEmail}</span>
              </div>
            )}
            
            <button
              onClick={onDisconnect}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Desconectar Tienda
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="lg:hidden sticky top-0 z-30 bg-card border-b border-border px-4 h-14 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <span className="font-semibold text-sm">{storeName}</span>
          <div className="w-10" />
        </header>

        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
