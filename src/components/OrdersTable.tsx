import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search, Filter, ChevronLeft, ChevronRight, Package, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Order, OrderFilters } from '@/lib/tiendanube';
import { cn } from '@/lib/utils';

interface OrdersTableProps {
  orders: Order[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    per_page: number;
    total: number;
  };
  onFetch: (filters: OrderFilters) => void;
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  open: { label: 'Abierta', variant: 'default' },
  closed: { label: 'Cerrada', variant: 'secondary' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
};

const paymentLabels: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'bg-warning/10 text-warning border-warning/20' },
  paid: { label: 'Pagado', className: 'bg-success/10 text-success border-success/20' },
  voided: { label: 'Anulado', className: 'bg-muted text-muted-foreground border-muted' },
  refunded: { label: 'Reembolsado', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  abandoned: { label: 'Abandonado', className: 'bg-muted text-muted-foreground border-muted' },
};

export function OrdersTable({ orders, loading, error, pagination, onFetch }: OrdersTableProps) {
  const [filters, setFilters] = useState<OrderFilters>({
    page: 1,
    per_page: 50,
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    onFetch(filters);
  }, []);

  const handleFilterChange = (key: keyof OrderFilters, value: string | undefined) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    onFetch(newFilters);
  };

  const handlePageChange = (newPage: number) => {
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);
    onFetch(newFilters);
  };

  const handleRefresh = () => {
    onFetch(filters);
  };

  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      order.number.toString().includes(search) ||
      order.customer?.name?.toLowerCase().includes(search) ||
      order.customer?.email?.toLowerCase().includes(search)
    );
  });

  const totalPages = Math.ceil(pagination.total / pagination.per_page);

  return (
    <Card className="animate-slide-up">
      <CardHeader className="border-b border-border">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="font-display">Ventas</CardTitle>
              <p className="text-sm text-muted-foreground">
                {pagination.total} órdenes en total
              </p>
            </div>
          </div>
          
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Actualizar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 lg:p-6">
        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, cliente o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-3">
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="open">Abierta</SelectItem>
                <SelectItem value="closed">Cerrada</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.payment_status || 'all'}
              onValueChange={(value) => handleFilterChange('payment_status', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="paid">Pagado</SelectItem>
                <SelectItem value="refunded">Reembolsado</SelectItem>
                <SelectItem value="abandoned">Abandonado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 mb-6">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Table */}
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">#</TableHead>
                <TableHead className="font-semibold">Cliente</TableHead>
                <TableHead className="font-semibold">Estado</TableHead>
                <TableHead className="font-semibold">Pago</TableHead>
                <TableHead className="font-semibold text-right">Total</TableHead>
                <TableHead className="font-semibold">Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No se encontraron órdenes
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono font-medium">
                      #{order.number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.customer?.name || 'Sin nombre'}</p>
                        <p className="text-sm text-muted-foreground">{order.customer?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusLabels[order.status]?.variant || 'outline'}>
                        {statusLabels[order.status]?.label || order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-flex px-2 py-1 rounded-md text-xs font-medium border",
                        paymentLabels[order.payment_status]?.className || 'bg-muted text-muted-foreground'
                      )}>
                        {paymentLabels[order.payment_status]?.label || order.payment_status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {order.currency} {parseFloat(order.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(order.created_at), 'dd MMM yyyy', { locale: es })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-muted-foreground">
              Página {pagination.page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= totalPages || loading}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
