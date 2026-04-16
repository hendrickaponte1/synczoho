import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TIENDANUBE_APP_ID, getEmbeddedAdminAppUrl } from '@/lib/tiendanube';

interface ZohoOrg {
  organization_id: string;
  name: string;
  currency_code?: string;
  country?: string;
}

type Step = 'processing' | 'select_org' | 'success' | 'error';

/**
 * Procesa el callback OAuth de Zoho fuera del iframe del admin de Tiendanube.
 * Intercambia el code, deja elegir organización, y al terminar redirige
 * de vuelta al admin embebido de Tiendanube.
 */
export default function ZohoCallback() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>('processing');
  const [errorMsg, setErrorMsg] = useState('');
  const [orgs, setOrgs] = useState<ZohoOrg[]>([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [state, setState] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const redirectUri = `${window.location.origin}/zoho/callback`;
  const storeHandle = typeof window !== 'undefined'
    ? localStorage.getItem('tiendanube_store_handle')
    : null;

  useEffect(() => {
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');
    const oauthError = searchParams.get('error');

    if (oauthError) {
      setErrorMsg(oauthError);
      setStep('error');
      return;
    }
    if (!code || !stateParam) {
      setErrorMsg('Faltan parámetros de autorización');
      setStep('error');
      return;
    }

    setState(stateParam);

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('zoho-auth-callback', {
          body: { code, state: stateParam, redirect_uri: redirectUri },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        if (data.step === 'select_organization') {
          const list: ZohoOrg[] = data.organizations || [];
          setOrgs(list);
          if (list.length === 1) setSelectedOrg(list[0].organization_id);
          setStep('select_org');
        } else if (data.step === 'connected') {
          setStep('success');
        } else {
          throw new Error('Respuesta inesperada del servidor');
        }
      } catch (e: any) {
        console.error('Zoho callback error', e);
        setErrorMsg(e.message || 'Error procesando la autorización');
        setStep('error');
      }
    })();
  }, [searchParams, redirectUri]);

  const handleConfirmOrg = async () => {
    if (!selectedOrg) return;
    setSubmitting(true);
    try {
      const org = orgs.find((o) => o.organization_id === selectedOrg);
      const { data, error } = await supabase.functions.invoke('zoho-auth-callback', {
        body: {
          code: 'noop',
          state,
          redirect_uri: redirectUri,
          organization_id: selectedOrg,
          organization_name: org?.name,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data.step === 'connected') {
        setStep('success');
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Error al guardar la organización');
      setStep('error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToAdmin = () => {
    if (storeHandle) {
      window.location.href = getEmbeddedAdminAppUrl(storeHandle, TIENDANUBE_APP_ID);
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card rounded-xl p-8 max-w-md w-full text-center border border-border shadow-sm">
        {step === 'processing' && (
          <>
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-bold text-foreground mb-2">Procesando autorización...</h2>
            <p className="text-sm text-muted-foreground">Conectando con Zoho Inventory</p>
          </>
        )}

        {step === 'select_org' && (
          <>
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-foreground mb-2">¡Autorización exitosa!</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Elegí la organización de Zoho Inventory que querés vincular:
            </p>
            <div className="space-y-4 text-left">
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
              <Button
                onClick={handleConfirmOrg}
                disabled={!selectedOrg || submitting}
                className="w-full"
              >
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirmar organización
              </Button>
            </div>
          </>
        )}

        {step === 'success' && (
          <>
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-foreground mb-2">¡Zoho conectado!</h2>
            <p className="text-sm text-muted-foreground mb-6">
              La conexión con Zoho Inventory se guardó correctamente.
            </p>
            <Button onClick={handleBackToAdmin} className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              {storeHandle ? 'Volver al admin de Tiendanube' : 'Ir al inicio'}
            </Button>
          </>
        )}

        {step === 'error' && (
          <>
            <XCircle className="w-10 h-10 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-bold text-foreground mb-2">Error</h2>
            <p className="text-sm text-muted-foreground mb-6">{errorMsg}</p>
            <Button onClick={handleBackToAdmin} variant="secondary" className="w-full">
              {storeHandle ? 'Volver al admin de Tiendanube' : 'Volver al inicio'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
