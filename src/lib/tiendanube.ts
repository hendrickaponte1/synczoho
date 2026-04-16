// Tiendanube API configuration and helpers

export const TIENDANUBE_APP_ID = '29847';

// Build the authorization URL for OAuth (per Tiendanube docs)
export const getAuthorizationUrl = (appId: string): string => {
  return `https://www.tiendanube.com/apps/${appId}/authorize`;
};

export const getEmbeddedAdminAppUrl = (storeHandle: string, appId: string): string => {
  const normalizedHandle = storeHandle
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\.mitiendanube\.com.*$/i, '')
    .replace(/\/$/, '');

  return `https://${normalizedHandle}.mitiendanube.com/admin/apps/${appId}`;
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
