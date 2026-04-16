import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

// ============================================
// HTML SANITIZATION UTILITIES
// ============================================

// Allowed tags for widget text templates
const ALLOWED_TAGS = ['strong', 'em', 'span', 'b', 'i', 'br'];
const ALLOWED_ATTRS = ['class'];

// Patterns that indicate malicious content
const DANGEROUS_PATTERNS = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,           // Script tags
  /javascript:/gi,                                   // JavaScript protocol
  /on\w+\s*=/gi,                                     // Event handlers (onclick, onerror, etc.)
  /<iframe[\s\S]*?>/gi,                              // Iframes
  /<object[\s\S]*?>/gi,                              // Objects
  /<embed[\s\S]*?>/gi,                               // Embeds
  /<link[\s\S]*?>/gi,                                // Links (for CSS injection)
  /<style[\s\S]*?>[\s\S]*?<\/style>/gi,             // Style tags
  /expression\s*\(/gi,                               // CSS expressions
  /url\s*\(\s*['"]?javascript:/gi,                  // URL with javascript
  /<img[^>]+onerror/gi,                             // Img with onerror
  /<svg[^>]+onload/gi,                              // SVG with onload
  /data:\s*text\/html/gi,                           // Data URLs with HTML
  /vbscript:/gi,                                     // VBScript protocol
];

/**
 * Sanitize text content to prevent XSS attacks
 * Removes dangerous HTML/JS patterns while preserving allowed safe tags
 */
function sanitizeText(input: string, maxLength = 500): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Trim and enforce max length
  let sanitized = input.trim().slice(0, maxLength);
  
  // Remove dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }
  
  // Remove any remaining script-like tags that we might have missed
  sanitized = sanitized.replace(/<\/?script[^>]*>/gi, '');
  
  // Escape HTML entities in the base text but preserve allowed tags
  // First, protect allowed tags
  const tagPlaceholders: { placeholder: string; tag: string }[] = [];
  let placeholderIndex = 0;
  
  for (const tag of ALLOWED_TAGS) {
    // Opening tags with optional attributes
    const openingPattern = new RegExp(`<${tag}(\\s+[^>]*)?>`, 'gi');
    sanitized = sanitized.replace(openingPattern, (match) => {
      const placeholder = `__TAG_PLACEHOLDER_${placeholderIndex}__`;
      tagPlaceholders.push({ placeholder, tag: match });
      placeholderIndex++;
      return placeholder;
    });
    
    // Closing tags
    const closingPattern = new RegExp(`</${tag}>`, 'gi');
    sanitized = sanitized.replace(closingPattern, (match) => {
      const placeholder = `__TAG_PLACEHOLDER_${placeholderIndex}__`;
      tagPlaceholders.push({ placeholder, tag: match });
      placeholderIndex++;
      return placeholder;
    });
  }
  
  // Escape any remaining HTML tags (not in our allowed list)
  sanitized = sanitized
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Restore allowed tags
  for (const { placeholder, tag } of tagPlaceholders) {
    sanitized = sanitized.replace(placeholder, tag);
  }
  
  return sanitized;
}

/**
 * Validate and sanitize a color value
 */
function sanitizeColor(input: string, defaultValue: string): string {
  if (!input || typeof input !== 'string') {
    return defaultValue;
  }
  // Only allow hex colors or rgb/rgba
  const hexPattern = /^#[0-9A-Fa-f]{3,8}$/;
  const rgbPattern = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/;
  
  if (hexPattern.test(input) || rgbPattern.test(input)) {
    return input;
  }
  return defaultValue;
}

/**
 * Validate and sanitize a numeric value
 */
function sanitizeNumber(input: unknown, defaultValue: number, min: number, max: number): number {
  if (typeof input !== 'number' || isNaN(input)) {
    return defaultValue;
  }
  return Math.min(max, Math.max(min, input));
}

interface DeliverySettings {
  id: string;
  store_id: string;
  preparation_min_days: number;
  preparation_max_days: number;
  shipping_min_days: number;
  shipping_max_days: number;
  cutoff_time: string;
  working_days: number[];
  preparation_calc_mode?: string;
  shipping_calc_mode?: string;
  widget_enabled?: boolean;
}

interface AppearanceSettings {
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

interface ProductSettings {
  product_id: string;
  preparation_min_days?: number;
  preparation_max_days?: number;
  shipping_min_days?: number;
  shipping_max_days?: number;
  working_days?: number[];
}

interface WidgetTexts {
  message_template: string;
  out_of_stock_message: string;
  today_label: string;
  tomorrow_label: string;
}

interface WidgetConfig {
  enabled: boolean;
  delivery: DeliverySettings;
  appearance: AppearanceSettings;
  product?: ProductSettings;
  texts: WidgetTexts;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(req.url);
    const storeId = url.searchParams.get('store_id');
    const productId = url.searchParams.get('product_id');

    if (!storeId) {
      return new Response(JSON.stringify({ error: 'store_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[widget-config] Fetching config for store: ${storeId}, product: ${productId || 'none'}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch store to verify it exists
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, store_id')
      .eq('store_id', storeId)
      .maybeSingle();

    if (storeError) {
      console.error('[widget-config] Store fetch error:', storeError);
      throw storeError;
    }

    if (!store) {
      console.log('[widget-config] Store not found:', storeId);
      return new Response(JSON.stringify({ enabled: false, error: 'Store not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all settings in parallel
    const [deliveryResult, appearanceResult, textsResult] = await Promise.all([
      supabase
        .from('delivery_settings')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle(),
      supabase
        .from('widget_appearance_settings')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle(),
      supabase
        .from('widget_text_settings')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle(),
    ]);

    if (deliveryResult.error) {
      console.error('[widget-config] Delivery settings error:', deliveryResult.error);
    }
    if (appearanceResult.error) {
      console.error('[widget-config] Appearance settings error:', appearanceResult.error);
    }
    if (textsResult.error) {
      console.error('[widget-config] Texts settings error:', textsResult.error);
    }

    // Default settings
    const defaultDelivery: DeliverySettings = {
      id: '',
      store_id: storeId,
      preparation_min_days: 1,
      preparation_max_days: 2,
      shipping_min_days: 3,
      shipping_max_days: 5,
      cutoff_time: '14:00:00',
      working_days: [1, 2, 3, 4, 5],
      preparation_calc_mode: 'min-max',
      shipping_calc_mode: 'min-max',
    };

    const defaultAppearance: AppearanceSettings = {
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

    const defaultTexts: WidgetTexts = {
      message_template: '🚚 Pídelo {hoy_o_manana} antes de las {hora_corte} y recíbelo entre el {fecha_entrega_minima} y el {fecha_entrega_maxima}',
      out_of_stock_message: '⏳ Este producto está temporalmente agotado. Te notificaremos cuando esté disponible.',
      today_label: 'hoy',
      tomorrow_label: 'mañana',
    };

    // Fetch product-specific settings if productId is provided
    let productSettings: ProductSettings | undefined;
    if (productId) {
      const { data: prodSettings, error: prodError } = await supabase
        .from('product_delivery_settings')
        .select('*')
        .eq('store_id', storeId)
        .eq('product_id', parseInt(productId, 10))
        .maybeSingle();
      
      if (prodError) {
        console.error('[widget-config] Product settings error:', prodError);
      } else if (prodSettings) {
        console.log(`[widget-config] Found product-specific settings for: ${productId}`);
        productSettings = {
          product_id: productId,
          preparation_min_days: prodSettings.preparation_min_days,
          preparation_max_days: prodSettings.preparation_max_days,
          shipping_min_days: prodSettings.shipping_min_days,
          shipping_max_days: prodSettings.shipping_max_days,
          working_days: prodSettings.working_days,
        };
      }
    }

    // Merge settings with defaults
    const finalDelivery: DeliverySettings = {
      ...defaultDelivery,
      ...deliveryResult.data,
      cutoff_time: deliveryResult.data?.cutoff_time || defaultDelivery.cutoff_time,
    };

    // Extract and SANITIZE appearance fields from the database result
    const dbAppearance = appearanceResult.data;
    const finalAppearance: AppearanceSettings = dbAppearance ? {
      widget_mode: ['message-bar', 'progress-bar', 'combined'].includes(dbAppearance.widget_mode) 
        ? dbAppearance.widget_mode 
        : defaultAppearance.widget_mode,
      widget_position: ['above', 'below'].includes(dbAppearance.widget_position) 
        ? dbAppearance.widget_position 
        : defaultAppearance.widget_position,
      margin_top: sanitizeNumber(dbAppearance.margin_top, defaultAppearance.margin_top, 0, 100),
      margin_right: sanitizeNumber(dbAppearance.margin_right, defaultAppearance.margin_right, 0, 100),
      margin_bottom: sanitizeNumber(dbAppearance.margin_bottom, defaultAppearance.margin_bottom, 0, 100),
      margin_left: sanitizeNumber(dbAppearance.margin_left, defaultAppearance.margin_left, 0, 100),
      message_border_width: sanitizeNumber(dbAppearance.message_border_width, defaultAppearance.message_border_width, 0, 10),
      message_border_radius: sanitizeNumber(dbAppearance.message_border_radius, defaultAppearance.message_border_radius, 0, 50),
      message_border_style: ['solid', 'dashed', 'dotted', 'none'].includes(dbAppearance.message_border_style) 
        ? dbAppearance.message_border_style 
        : defaultAppearance.message_border_style,
      message_border_color: sanitizeColor(dbAppearance.message_border_color, defaultAppearance.message_border_color),
      message_background_color: sanitizeColor(dbAppearance.message_background_color, defaultAppearance.message_background_color),
      message_text_color: sanitizeColor(dbAppearance.message_text_color, defaultAppearance.message_text_color),
      progress_icon_color: sanitizeColor(dbAppearance.progress_icon_color, defaultAppearance.progress_icon_color),
      progress_icon_bg_color: sanitizeColor(dbAppearance.progress_icon_bg_color, defaultAppearance.progress_icon_bg_color),
      progress_title_color: sanitizeColor(dbAppearance.progress_title_color, defaultAppearance.progress_title_color),
      progress_date_color: sanitizeColor(dbAppearance.progress_date_color, defaultAppearance.progress_date_color),
      progress_line_color: sanitizeColor(dbAppearance.progress_line_color, defaultAppearance.progress_line_color),
    } : defaultAppearance;

    // Extract and SANITIZE text fields from the database result
    // This prevents XSS attacks via malicious HTML/JavaScript in templates
    const dbTexts = textsResult.data;
    const finalTexts: WidgetTexts = dbTexts ? {
      message_template: sanitizeText(dbTexts.message_template, 500) || defaultTexts.message_template,
      out_of_stock_message: sanitizeText(dbTexts.out_of_stock_message, 300) || defaultTexts.out_of_stock_message,
      today_label: sanitizeText(dbTexts.today_label, 50) || defaultTexts.today_label,
      tomorrow_label: sanitizeText(dbTexts.tomorrow_label, 50) || defaultTexts.tomorrow_label,
    } : defaultTexts;

    // Check if widget is enabled (default to true if not set)
    const widgetEnabled = deliveryResult.data?.widget_enabled ?? true;

    const config: WidgetConfig = {
      enabled: widgetEnabled,
      delivery: finalDelivery,
      appearance: finalAppearance,
      product: productSettings,
      texts: finalTexts,
    };

    console.log('[widget-config] Returning config:', JSON.stringify(config, null, 2));

    return new Response(JSON.stringify(config), {
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('[widget-config] Error:', error);
    return new Response(JSON.stringify({ 
      enabled: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
