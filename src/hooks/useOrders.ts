import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Order, OrdersResponse, OrderFilters } from '@/lib/tiendanube';

export function useOrders(storeId: string | undefined) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 50,
    total: 0,
  });

  const fetchOrders = useCallback(async (filters: OrderFilters = {}) => {
    if (!storeId) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('store_id', storeId);
      params.append('page', (filters.page || 1).toString());
      params.append('per_page', (filters.per_page || 50).toString());
      
      if (filters.status) params.append('status', filters.status);
      if (filters.payment_status) params.append('payment_status', filters.payment_status);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tiendanube-orders?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener órdenes');
      }

      const result: OrdersResponse = await response.json();
      
      setOrders(result.orders);
      setPagination(result.pagination);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Error al obtener órdenes');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  return {
    orders,
    loading,
    error,
    pagination,
    fetchOrders,
  };
}
