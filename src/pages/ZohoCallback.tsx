import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

/**
 * Recibe el redirect de Zoho con ?code=&state= y reenvía al dashboard
 * llevando los params como zoho_code/zoho_state para que ZohoConnectCard los procese.
 */
export default function ZohoCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      navigate(`/?zoho_error=${encodeURIComponent(error)}`, { replace: true });
      return;
    }

    if (code && state) {
      const params = new URLSearchParams({ zoho_code: code, zoho_state: state });
      navigate(`/?${params.toString()}`, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Procesando autorización de Zoho...</p>
      </div>
    </div>
  );
}
