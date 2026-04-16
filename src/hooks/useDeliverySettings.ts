import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DeliverySettings {
  id?: string;
  store_id: string;
  user_id: string;
  preparation_min_days: number;
  preparation_max_days: number;
  shipping_min_days: number;
  shipping_max_days: number;
  cutoff_time: string;
  working_days: number[];
  preparation_calc_mode: string;
  shipping_calc_mode: string;
  widget_enabled: boolean;
}

const DEFAULT_SETTINGS: Omit<DeliverySettings, 'store_id' | 'user_id'> = {
  preparation_min_days: 1,
  preparation_max_days: 2,
  shipping_min_days: 3,
  shipping_max_days: 5,
  cutoff_time: '14:00:00',
  working_days: [1, 2, 3, 4, 5],
  preparation_calc_mode: 'min-max',
  shipping_calc_mode: 'min-max',
  widget_enabled: true,
};

export function useDeliverySettings(storeId: string | undefined, userId: string | undefined) {
  const [settings, setSettings] = useState<DeliverySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    if (!storeId || !userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('delivery_settings')
        .select('*')
        .eq('store_id', storeId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...data,
          preparation_calc_mode: data.preparation_calc_mode || 'min-max',
          shipping_calc_mode: data.shipping_calc_mode || 'min-max',
          widget_enabled: data.widget_enabled ?? true,
        } as DeliverySettings);
      } else {
        setSettings({
          ...DEFAULT_SETTINGS,
          store_id: storeId,
          user_id: userId,
        });
      }
    } catch (err) {
      console.error('Error fetching delivery settings:', err);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los ajustes de entrega',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [storeId, userId, toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = async (newSettings: Partial<DeliverySettings>) => {
    if (!storeId || !userId) return;

    try {
      setSaving(true);
      const dataToSave = {
        ...settings,
        ...newSettings,
        store_id: storeId,
        user_id: userId,
      };

      const { data, error } = await supabase
        .from('delivery_settings')
        .upsert(dataToSave, {
          onConflict: 'store_id,user_id',
        })
        .select()
        .single();

      if (error) throw error;

      setSettings(data as DeliverySettings);
      return data;
    } catch (err) {
      console.error('Error saving delivery settings:', err);
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los ajustes',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (updates: Partial<DeliverySettings>) => {
    if (settings) {
      setSettings({ ...settings, ...updates });
    }
  };

  return {
    settings,
    loading,
    saving,
    saveSettings,
    updateSettings,
    refetch: fetchSettings,
  };
}
