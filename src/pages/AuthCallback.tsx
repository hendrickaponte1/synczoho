import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Store, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Procesando autorización...');

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      setStatus('error');
      setMessage('No se recibió código de autorización');
      return;
    }

    // Exchange code for token
    async function exchangeCode() {
      try {
        // Get current authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          setStatus('error');
          setMessage('Debes iniciar sesión antes de conectar una tienda');
          setTimeout(() => {
            // Save the code to try again after login
            sessionStorage.setItem('pending_tiendanube_code', code!);
            navigate('/auth', { replace: true });
          }, 2000);
          return;
        }

        const { data, error } = await supabase.functions.invoke('tiendanube-auth', {
          body: { code, user_id: user.id },
        });

        if (error) throw error;

        if (data.success) {
          // Store the store_id in localStorage
          localStorage.setItem('tiendanube_store_id', data.store_id.toString());
          
          setStatus('success');
          setMessage(`¡Tienda "${data.store_name}" conectada exitosamente!`);
          
          // Clear pending code
          sessionStorage.removeItem('pending_tiendanube_code');
          
          // Redirect to dashboard after a moment
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 2000);
        } else {
          throw new Error(data.error || 'Error desconocido');
        }
      } catch (err) {
        console.error('Auth error:', err);
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Error al conectar la tienda');
      }
    }

    exchangeCode();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="glass rounded-2xl p-8 max-w-md w-full text-center border border-white/20">
        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-6">
          <Store className="w-8 h-8 text-primary-foreground" />
        </div>

        {/* Status Icon */}
        <div className="mb-6">
          {status === 'loading' && (
            <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto" />
          )}
          {status === 'success' && (
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
          )}
          {status === 'error' && (
            <XCircle className="w-12 h-12 text-red-400 mx-auto" />
          )}
        </div>

        {/* Message */}
        <h2 className="font-display text-xl font-bold text-white mb-2">
          {status === 'loading' && 'Conectando tu tienda...'}
          {status === 'success' && '¡Conectado!'}
          {status === 'error' && 'Error de conexión'}
        </h2>
        <p className="text-white/70">{message}</p>

        {/* Error action */}
        {status === 'error' && (
          <button
            onClick={() => navigate('/')}
            className="mt-6 px-6 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            Volver al inicio
          </button>
        )}
      </div>
    </div>
  );
}