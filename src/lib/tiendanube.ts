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
