import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TiendanubeProduct {
  id: number;
  name: { es?: string; en?: string; pt?: string };
  description?: { es?: string; en?: string; pt?: string };
  handle?: { es?: string };
  published: boolean;
  free_shipping: boolean;
  categories: Array<{ id: number; name: { es?: string } }>;
  images: Array<{
    id: number;
    product_id: number;
    src: string;
    position: number;
  }>;
  variants: Array<{
    id: number;
    price: string;
    stock: number | null;
    sku?: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface ProductsFilters {
  page?: number;
  perPage?: number;
  categoryId?: string;
  published?: boolean;
  q?: string;
}

export interface ProductDeliverySettings {
  productId: number;
  deliveryWorkingDays: number[];
  orderReadyWorkingDays: number[];
  shippingMinDays: number;
  shippingMaxDays: number;
  preparationMinDays: number;
  preparationMaxDays: number;
  isCustomized: boolean;
}

export function useProducts(storeId: string | undefined) {
  const [products, setProducts] = useState<TiendanubeProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 20,
    total: 0,
  });
  const [syncing, setSyncing] = useState(false);

  // Local storage for product-specific settings (later can be moved to database)
  const [productSettings, setProductSettings] = useState<Map<number, ProductDeliverySettings>>(new Map());

  const fetchProducts = useCallback(async (filters: ProductsFilters = {}) => {
    if (!storeId) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('store_id', storeId);
      params.append('page', String(filters.page || 1));
      params.append('per_page', String(filters.perPage || 20));
      
      if (filters.categoryId) params.append('category_id', filters.categoryId);
      if (filters.published !== undefined) params.append('published', String(filters.published));
      if (filters.q) params.append('q', filters.q);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tiendanube-products?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error al obtener productos');
      }

      const data = await response.json();
      setProducts(data.products || []);
      setPagination(data.pagination || { page: 1, perPage: 20, total: 0 });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  const syncAllProducts = useCallback(async () => {
    if (!storeId) return;

    setSyncing(true);
    try {
      // Fetch all products by iterating through pages
      let allProducts: TiendanubeProduct[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const params = new URLSearchParams();
        params.append('store_id', storeId);
        params.append('page', String(page));
        params.append('per_page', '200');

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tiendanube-products?${params.toString()}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Error al sincronizar productos');
        }

        const data = await response.json();
        allProducts = [...allProducts, ...(data.products || [])];
        
        if (data.products.length < 200) {
          hasMore = false;
        } else {
          page++;
        }
      }

      setProducts(allProducts);
      setPagination({
        page: 1,
        perPage: allProducts.length,
        total: allProducts.length,
      });

      return allProducts.length;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      throw err;
    } finally {
      setSyncing(false);
    }
  }, [storeId]);

  const updateProductSettings = useCallback((productId: number, settings: Partial<ProductDeliverySettings>) => {
    setProductSettings(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(productId) || {
        productId,
        deliveryWorkingDays: [1, 2, 3, 4, 5],
        orderReadyWorkingDays: [1, 2, 3, 4, 5],
        shippingMinDays: 1,
        shippingMaxDays: 3,
        preparationMinDays: 1,
        preparationMaxDays: 2,
        isCustomized: false,
      };
      newMap.set(productId, { ...existing, ...settings, isCustomized: true });
      return newMap;
    });
  }, []);

  const getProductSettings = useCallback((productId: number): ProductDeliverySettings | undefined => {
    return productSettings.get(productId);
  }, [productSettings]);

  const removeProductSettings = useCallback((productId: number) => {
    setProductSettings(prev => {
      const newMap = new Map(prev);
      newMap.delete(productId);
      return newMap;
    });
  }, []);

  return {
    products,
    loading,
    error,
    pagination,
    syncing,
    fetchProducts,
    syncAllProducts,
    productSettings,
    updateProductSettings,
    getProductSettings,
    removeProductSettings,
  };
}
