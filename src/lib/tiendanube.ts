// Tiendanube API configuration and helpers

export const TIENDANUBE_APP_ID = import.meta.env.VITE_TIENDANUBE_APP_ID || '11473';

// Build the authorization URL for OAuth
export const getAuthorizationUrl = (appId: string, state: string, redirectUri: string): string => {
  return `https://www.tiendanube.com/apps/${appId}/authorize?state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`;
};

// Store type
export interface Store {
  id: string;
  store_id: string;
  store_name: string | null;
  user_email: string | null;
  created_at: string;
  updated_at: string;
}

// Order types based on Tiendanube API
export interface OrderProduct {
  product_id: number;
  variant_id: number;
  name: string;
  price: string;
  quantity: number;
  sku?: string;
}

export interface Order {
  id: number;
  number: number;
  status: 'open' | 'closed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'voided' | 'refunded' | 'abandoned';
  shipping_status: 'unpacked' | 'shipped' | 'unshipped' | 'delivered';
  total: string;
  subtotal: string;
  currency: string;
  created_at: string;
  updated_at: string;
  customer: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
  products: OrderProduct[];
  shipping_address?: {
    city?: string;
    province?: string;
    country?: string;
  };
}

export interface OrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    link?: string;
  };
}

// Filter options
export interface OrderFilters {
  status?: string;
  payment_status?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}
