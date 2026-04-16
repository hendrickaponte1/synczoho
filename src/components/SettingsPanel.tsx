import { Store, ExternalLink, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Store as StoreType } from '@/lib/tiendanube';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SettingsPanelProps {
  store: StoreType;
  onDisconnect: () => void;
}

export function SettingsPanel({ store, onDisconnect }: SettingsPanelProps) {
  return (
    <div className="space-y-6 animate-slide-up max-w-2xl">
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
          Configuración
        </h1>
        <p className="text-muted-foreground mt-1">
          Administra la conexión de tu tienda
        </p>
      </div>

      {/* Store Info */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
              <Store className="w-5 h-5 text-primary-foreground" />
            </div>
            Información de la Tienda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nombre</p>
              <p className="font-medium">{store.store_name || 'Sin nombre'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ID de Tienda</p>
              <p className="font-mono text-sm">{store.store_id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Conectada desde</p>
              <p className="font-medium">
                {format(new Date(store.created_at), "dd 'de' MMMM, yyyy", { locale: es })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Última actualización</p>
              <p className="font-medium">
                {format(new Date(store.updated_at), "dd 'de' MMMM, yyyy", { locale: es })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Acciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start" asChild>
            <a 
              href={`https://www.tiendanube.com/admin`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ir al Admin de Tiendanube
            </a>
          </Button>
          
          <Button 
            variant="destructive" 
            className="w-full justify-start"
            onClick={onDisconnect}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Desconectar Tienda
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
