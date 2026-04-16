import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SyncSettings {
  store_id: string;
  orders_enabled: boolean;
  orders_create_as_draft: boolean;
  orders_auto_confirm: boolean;
  orders_generate_invoice_on_paid: boolean;
  stock_enabled: boolean;
  stock_direction: 'zoho_to_tn' | 'tn_to_zoho' | 'bidirectional';
  stock_priority: 'zoho' | 'tiendanube';
  stock_warehouse_id: string | null;
  customers_auto_sync_on_order: boolean;
}

export function useSyncSettings(storeId: string | null) {
  const [settings, setSettings] = useState<SyncSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-settings', {
        body: { storeId, action: 'get' },
      });
      if (error) throw error;
      setSettings(data.settings);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (patch: Partial<SyncSettings>) => {
    if (!storeId || !settings) return;
    setSaving(true);
    try {
      const merged = { ...settings, ...patch };
      const { data, error } = await supabase.functions.invoke('sync-settings', {
        body: { storeId, action: 'save', settings: merged },
      });
      if (error) throw error;
      setSettings(data.settings);
    } finally {
      setSaving(false);
    }
  }, [storeId, settings]);

  return { settings, loading, saving, save, reload: load };
}
