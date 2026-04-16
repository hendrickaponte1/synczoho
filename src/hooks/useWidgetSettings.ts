import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AppearanceSettings {
  id?: string;
  store_id: string;
  user_id: string;
  widget_mode: string;
  widget_position: string;
  margin_top: number;
  margin_right: number;
  margin_bottom: number;
  margin_left: number;
  message_border_width: number;
  message_border_radius: number;
  message_border_style: string;
  message_border_color: string;
  message_background_color: string;
  message_text_color: string;
  progress_icon_color: string;
  progress_icon_bg_color: string;
  progress_title_color: string;
  progress_date_color: string;
  progress_line_color: string;
}

export interface TextSettings {
  id?: string;
  store_id: string;
  user_id: string;
  message_template: string;
  out_of_stock_message: string;
  today_label: string;
  tomorrow_label: string;
}

const DEFAULT_APPEARANCE: Omit<AppearanceSettings, 'store_id' | 'user_id'> = {
  widget_mode: 'message-bar',
  widget_position: 'below',
  margin_top: 16,
  margin_right: 0,
  margin_bottom: 16,
  margin_left: 0,
  message_border_width: 1,
  message_border_radius: 8,
  message_border_style: 'solid',
  message_border_color: '#e5e7eb',
  message_background_color: '#f0fdf4',
  message_text_color: '#166534',
  progress_icon_color: '#22c55e',
  progress_icon_bg_color: '#dcfce7',
  progress_title_color: '#374151',
  progress_date_color: '#6b7280',
  progress_line_color: '#e5e7eb',
};

const DEFAULT_TEXTS: Omit<TextSettings, 'store_id' | 'user_id'> = {
  message_template: '🚚 Pídelo {hoy_o_manana} antes de las {hora_corte} y recíbelo entre el {fecha_entrega_minima} y el {fecha_entrega_maxima}',
  out_of_stock_message: '⏳ Este producto está temporalmente agotado. Te notificaremos cuando esté disponible.',
  today_label: 'hoy',
  tomorrow_label: 'mañana',
};

export function useWidgetSettings(storeId: string | undefined, userId: string | undefined) {
  const [appearance, setAppearance] = useState<AppearanceSettings | null>(null);
  const [texts, setTexts] = useState<TextSettings | null>(null);
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
      
      const [appearanceResult, textsResult] = await Promise.all([
        supabase
          .from('widget_appearance_settings')
          .select('*')
          .eq('store_id', storeId)
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('widget_text_settings')
          .select('*')
          .eq('store_id', storeId)
          .eq('user_id', userId)
          .maybeSingle(),
      ]);

      if (appearanceResult.error) throw appearanceResult.error;
      if (textsResult.error) throw textsResult.error;

      if (appearanceResult.data) {
        setAppearance(appearanceResult.data as AppearanceSettings);
      } else {
        setAppearance({
          ...DEFAULT_APPEARANCE,
          store_id: storeId,
          user_id: userId,
        });
      }

      if (textsResult.data) {
        setTexts(textsResult.data as TextSettings);
      } else {
        setTexts({
          ...DEFAULT_TEXTS,
          store_id: storeId,
          user_id: userId,
        });
      }
    } catch (err) {
      console.error('Error fetching widget settings:', err);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los ajustes del widget',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [storeId, userId, toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveAppearance = async (newSettings: Partial<AppearanceSettings>) => {
    if (!storeId || !userId) return;

    try {
      setSaving(true);
      const dataToSave = {
        ...appearance,
        ...newSettings,
        store_id: storeId,
        user_id: userId,
      };

      const { data, error } = await supabase
        .from('widget_appearance_settings')
        .upsert(dataToSave, {
          onConflict: 'store_id,user_id',
        })
        .select()
        .single();

      if (error) throw error;

      setAppearance(data as AppearanceSettings);
      return data;
    } catch (err) {
      console.error('Error saving appearance settings:', err);
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los ajustes de apariencia',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const saveTexts = async (newSettings: Partial<TextSettings>) => {
    if (!storeId || !userId) return;

    try {
      setSaving(true);
      const dataToSave = {
        ...texts,
        ...newSettings,
        store_id: storeId,
        user_id: userId,
      };

      const { data, error } = await supabase
        .from('widget_text_settings')
        .upsert(dataToSave, {
          onConflict: 'store_id,user_id',
        })
        .select()
        .single();

      if (error) throw error;

      setTexts(data as TextSettings);
      return data;
    } catch (err) {
      console.error('Error saving text settings:', err);
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los ajustes de texto',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const saveAll = async (
    appearanceUpdates?: Partial<AppearanceSettings>,
    textUpdates?: Partial<TextSettings>
  ) => {
    if (!storeId || !userId) return;

    try {
      setSaving(true);
      
      const promises = [];
      
      if (appearanceUpdates || appearance) {
        const appearanceData = {
          ...appearance,
          ...appearanceUpdates,
          store_id: storeId,
          user_id: userId,
        };
        promises.push(
          supabase
            .from('widget_appearance_settings')
            .upsert(appearanceData, { onConflict: 'store_id,user_id' })
            .select()
            .single()
        );
      }
      
      if (textUpdates || texts) {
        const textsData = {
          ...texts,
          ...textUpdates,
          store_id: storeId,
          user_id: userId,
        };
        promises.push(
          supabase
            .from('widget_text_settings')
            .upsert(textsData, { onConflict: 'store_id,user_id' })
            .select()
            .single()
        );
      }

      const results = await Promise.all(promises);
      
      for (const result of results) {
        if (result.error) throw result.error;
      }

      toast({
        title: 'Guardado',
        description: 'Los ajustes del widget se han guardado correctamente',
      });
    } catch (err) {
      console.error('Error saving widget settings:', err);
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los ajustes',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateAppearance = (updates: Partial<AppearanceSettings>) => {
    if (appearance) {
      setAppearance({ ...appearance, ...updates });
    }
  };

  const updateTexts = (updates: Partial<TextSettings>) => {
    if (texts) {
      setTexts({ ...texts, ...updates });
    }
  };

  return {
    appearance,
    texts,
    loading,
    saving,
    saveAppearance,
    saveTexts,
    saveAll,
    updateAppearance,
    updateTexts,
    refetch: fetchSettings,
  };
}
