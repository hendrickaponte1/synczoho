import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().trim().email({ message: 'Email inválido' }).max(255),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }).max(100),
});

export default function Auth() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const validateForm = () => {
    try {
      authSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: { email?: string; password?: string } = {};
        err.errors.forEach((e) => {
          if (e.path[0] === 'email') newErrors.email = e.message;
          if (e.path[0] === 'password') newErrors.password = e.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Credenciales inválidas. Verifica tu email y contraseña.');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('¡Bienvenido de vuelta!');
          navigate('/');
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('User already registered')) {
            toast.error('Este email ya está registrado. Intenta iniciar sesión.');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('¡Cuenta creada exitosamente!');
          navigate('/');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <a href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
            <Store className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-white">TiendaSync</span>
        </a>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 flex items-center justify-center">
        <div className="w-full max-w-md animate-slide-up">
          <div className="glass rounded-2xl p-8 border border-white/10">
            <div className="text-center mb-8">
              <h1 className="font-display text-2xl font-bold text-white mb-2">
                {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </h1>
              <p className="text-white/60">
                {isLogin 
                  ? 'Accede a tu dashboard de ventas' 
                  : 'Regístrate para conectar tu tienda'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/80">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-accent"
                    disabled={loading}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-400">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/80">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 pr-11 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-accent"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-400">{errors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full gradient-brand text-white font-semibold py-6 rounded-xl shadow-glow hover:opacity-90 transition-opacity"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isLogin ? (
                  'Iniciar Sesión'
                ) : (
                  'Crear Cuenta'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                className="text-white/60 hover:text-white transition-colors"
              >
                {isLogin ? (
                  <>¿No tienes cuenta? <span className="text-accent font-medium">Regístrate</span></>
                ) : (
                  <>¿Ya tienes cuenta? <span className="text-accent font-medium">Inicia sesión</span></>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-6">
        <p className="text-white/50 text-sm text-center">
          Plugin desarrollado para Tiendanube/Nuvemshop
        </p>
      </footer>
    </div>
  );
}
