import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Store } from '@/lib/tiendanube';

const STORE_KEY = 'tiendanube_store_id';

export function useStore(userId: string | undefined) {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get stored store_id from localStorage
  const getStoredStoreId = (): string | null => {
    return localStorage.getItem(STORE_KEY);
  };

  // Save store_id to localStorage
  const saveStoreId = (storeId: string) => {
    localStorage.setItem(STORE_KEY, storeId);
  };

  // Clear store from localStorage
  const clearStore = () => {
    localStorage.removeItem(STORE_KEY);
    setStore(null);
  };

  // Fetch store from database - only fetches stores belonging to the current user
  const fetchStore = async (storeId?: string) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      let query = supabase
        .from('stores')
        .select('*')
        .eq('user_id', userId);
      
      // If we have a specific store_id, filter by it too
      if (storeId) {
        query = query.eq('store_id', storeId);
      }
      
      const { data, error: fetchError } = await query.maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        setStore(data as Store);
        saveStoreId(data.store_id);
      } else {
        clearStore();
      }
    } catch (err) {
      console.error('Error fetching store:', err);
      setError('Error al cargar la tienda');
      clearStore();
    } finally {
      setLoading(false);
    }
  };

  // Initialize: fetch store for current user
  useEffect(() => {
    if (userId) {
      const storedId = getStoredStoreId();
      fetchStore(storedId || undefined);
    } else {
      setLoading(false);
      setStore(null);
    }
  }, [userId]);

  // Connect a new store
  const connectStore = async (storeId: string) => {
    saveStoreId(storeId);
    await fetchStore(storeId);
  };

  return {
    store,
    loading,
    error,
    isConnected: !!store,
    connectStore,
    clearStore,
    refetch: () => fetchStore(store?.store_id),
  };
}