import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Link2, CheckCircle2, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ZohoOrg {
  organization_id: string;
  name: string;
  currency_code?: string;
  country?: string;
}

interface ZohoConnectCardProps {
  storeId: string;
}

const ZOHO_REDIRECT_PATH = '/zoho/callback';

export function ZohoConnectCard({ storeId }: ZohoConnectCardProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [connection, setConnection] = useState<{
    organization_id: string | null;
    organization_name: string | null;
    status: string;
  } | null>(null);
  const [orgs, setOrgs] = useState<ZohoOrg[] | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [pendingState, setPendingState] = useState<string | null>(null);

  const redirectUri = `${window.location.origin}${ZOHO_REDIRECT_PATH}`;

  // Cargar conexión actual via edge function (evita problemas de RLS sin sesión)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('zoho-connection-status', {
          body: { store_id: storeId },
        });
        if (error) throw error;
        if (!cancelled) {
          setConnection(data?.connection || null);
          setLoading(false);
        }
      } catch (e) {
        console.error('Error loading Zoho connection status', e);
        if (!cancelled) setLoading(false);
      }
    };
    load();

    const onVisible = () => {
      if (document.visibilityState === 'visible') load();
    };
    window.addEventListener('focus', load);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', load);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [storeId]);

  // Procesar callback OAuth si volvemos con ?code= en /zoho/callback (manejado en route),
  // o si hay code+state guardados en sessionStorage
  useEffect(() => {
    const code = searchParams.get('zoho_code');
    const state = searchParams.get('zoho_state');
    if (!code || !state) return;

    (async () => {
      setConnecting(true);
      try {
        const { data, error } = await supabase.functions.invoke('zoho-auth-callback', {
          body: { code, state, redirect_uri: redirectUri },
        });
        if (error) throw error;

        if (data.step === 'select_organization') {
          setOrgs(data.organizations || []);
          setPendingState(state);
          if ((data.organizations || []).length === 1) {
            setSelectedOrg(data.organizations[0].organization_id);
          }
          toast.success('Autorización exitosa. Elegí una organización.');
        }
      } catch (e: any) {
        console.error(e);
        toast.error(e.message || 'Error procesando callback de Zoho');
      } finally {
        setConnecting(false);
        // Limpiar query
        navigate('/', { replace: true });
      }
    })();
  }, [searchParams, navigate, redirectUri]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('zoho-auth-start', {
        body: { store_id: storeId, dc: 'com', redirect_uri: redirectUri },
      });
      if (error) throw error;
      if (data.auth_url) {
        // Zoho bloquea iframes (X-Frame-Options). Romper el iframe o abrir nueva pestaña.
        const isEmbedded = window.top !== window.self;
        if (isEmbedded) {
          try {
            window.top!.location.href = data.auth_url;
          } catch {
            window.open(data.auth_url, '_blank', 'noopener,noreferrer');
          }
        } else {
          window.location.href = data.auth_url;
        }
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'No se pudo iniciar la conexión con Zoho');
      setConnecting(false);
    }
  };

  const handleSelectOrg = async () => {
    if (!selectedOrg || !pendingState) return;
    setConnecting(true);
    try {
      const org = orgs?.find((o) => o.organization_id === selectedOrg);
      const { data, error } = await supabase.functions.invoke('zoho-auth-callback', {
        body: {
          code: 'noop',
          state: pendingState,
          redirect_uri: redirectUri,
          organization_id: selectedOrg,
          organization_name: org?.name,
        },
      });
      if (error) throw error;
      if (data.step === 'connected') {
        toast.success('Zoho Inventory conectado correctamente');
        setConnection({
          organization_id: selectedOrg,
          organization_name: org?.name || null,
          status: 'active',
        });
        setOrgs(null);
        setPendingState(null);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Error al guardar la organización');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('¿Desconectar Zoho Inventory de esta tienda?')) return;
    try {
      const { error } = await supabase.functions.invoke('zoho-disconnect', {
        body: { store_id: storeId },
      });
      if (error) throw error;
      setConnection(null);
      toast.success('Zoho desconectado');
    } catch (e: any) {
      toast.error(e.message || 'Error al desconectar');
    }
  };

  const isConnected = connection?.status === 'active' && connection?.organization_id;

  return (
    <Card className={isConnected ? '' : 'border-dashed'}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/zoho-inventory-logo.png"
              alt="Zoho Inventory"
              style={{ height: 24, width: 'auto' }}
            />
          </div>
          {loading ? (
            <Badge variant="secondary" className="text-xs">Cargando...</Badge>
          ) : isConnected ? (
            <Badge variant="default" className="bg-green-500 text-white text-xs">Conectada</Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">Pendiente</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando estado...
          </div>
        ) : isConnected ? (
          <>
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center gap-1.5 text-foreground">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="font-medium">{connection?.organization_name || 'Organización conectada'}</span>
              </div>
              <p className="text-xs">Org ID: {connection?.organization_id}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleDisconnect}>
              Desconectar
            </Button>
          </>
        ) : orgs ? (
          <>
            <p className="text-sm text-muted-foreground">
              Selecciona la organización de Zoho Inventory que deseas vincular:
            </p>
            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar organización" />
              </SelectTrigger>
              <SelectContent>
                {orgs.map((o) => (
                  <SelectItem key={o.organization_id} value={o.organization_id}>
                    {o.name} {o.currency_code ? `(${o.currency_code})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleSelectOrg} disabled={!selectedOrg || connecting}>
              {connecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Confirmar organización
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Conecta tu cuenta de Zoho Inventory para iniciar la sincronización de productos e inventario.
            </p>
            <Button size="sm" onClick={handleConnect} disabled={connecting}>
              {connecting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Link2 className="w-4 h-4 mr-2" />
              )}
              Conectar Zoho Inventory
            </Button>
            <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>Serás redirigido a Zoho para autorizar el acceso.</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
