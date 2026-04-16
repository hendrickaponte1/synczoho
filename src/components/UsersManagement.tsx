import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Shield, User, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface UserWithRole {
  id: string;
  user_id: string;
  role: 'admin' | 'customer';
  created_at: string;
  email?: string;
}

export function UsersManagement() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Obtener emails de las tiendas asociadas
      const { data: stores } = await supabase
        .from('stores')
        .select('user_id, user_email');

      const usersWithEmail = (data || []).map(user => {
        const store = stores?.find(s => s.user_id === user.user_id);
        return {
          ...user,
          email: store?.user_email || 'Sin email registrado'
        };
      });

      setUsers(usersWithEmail);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      toast.error('Error al cargar la lista de usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleRole = async (userId: string, currentRole: 'admin' | 'customer') => {
    setUpdatingId(userId);
    const newRole = currentRole === 'admin' ? 'customer' : 'admin';

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(users.map(u => 
        u.user_id === userId ? { ...u, role: newRole } : u
      ));

      toast.success(`Rol actualizado a ${newRole === 'admin' ? 'Administrador' : 'Cliente'}`);
    } catch (error) {
      console.error('Error al actualizar rol:', error);
      toast.error('Error al actualizar el rol del usuario');
    } finally {
      setUpdatingId(null);
    }
  };

  const getRoleBadge = (role: 'admin' | 'customer') => {
    if (role === 'admin') {
      return (
        <Badge className="bg-primary/10 text-primary border-primary/20">
          <Shield className="w-3 h-3 mr-1" />
          Administrador
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <User className="w-3 h-3 mr-1" />
        Cliente
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Gestión de Usuarios
          </h1>
          <p className="text-muted-foreground mt-1">
            Administra los roles y permisos de los usuarios de la plataforma
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchUsers}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-muted-foreground">Total Usuarios</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.role === 'admin').length}
                </p>
                <p className="text-sm text-muted-foreground">Administradores</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.role === 'customer').length}
                </p>
                <p className="text-sm text-muted-foreground">Clientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Lista de Usuarios
          </CardTitle>
          <CardDescription>
            Haz clic en "Cambiar Rol" para alternar entre Administrador y Cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay usuarios registrados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol Actual</TableHead>
                  <TableHead>Fecha de Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(user.role)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(user.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={user.role === 'admin' ? 'outline' : 'default'}
                        onClick={() => toggleRole(user.user_id, user.role)}
                        disabled={updatingId === user.user_id}
                      >
                        {updatingId === user.user_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            {user.role === 'admin' ? 'Hacer Cliente' : 'Hacer Admin'}
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
