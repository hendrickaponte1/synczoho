import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type AppRole = 'admin' | 'customer';

interface UserRoleContextType {
  role: AppRole | null;
  loading: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
  refetchRole: () => Promise<void>;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export function UserRoleProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = async () => {
    if (!user?.id) {
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error al obtener rol:', error);
        setRole('customer'); // Por defecto si hay error
      } else {
        setRole(data?.role as AppRole || 'customer');
      }
    } catch (error) {
      console.error('Error al obtener rol:', error);
      setRole('customer');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchRole();
    }
  }, [user?.id, authLoading]);

  const refetchRole = async () => {
    setLoading(true);
    await fetchRole();
  };

  return (
    <UserRoleContext.Provider
      value={{
        role,
        loading,
        isAdmin: role === 'admin',
        isCustomer: role === 'customer',
        refetchRole,
      }}
    >
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole() {
  const context = useContext(UserRoleContext);
  if (context === undefined) {
    throw new Error('useUserRole debe usarse dentro de un UserRoleProvider');
  }
  return context;
}
