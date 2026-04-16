import { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  CreditCard, 
  HelpCircle,
  Palette,
  Settings2,
  Sparkles,
  MoreHorizontal,
  ShoppingBag,
  Truck,
  MapPin,
  Clock,
  Calendar,
  CheckCircle2,
  Loader2,
  Copy,
  Eye,
  PackageX,
  Box,
  Gift,
  Star,
  Heart,
  Zap,
  Home,
  Plus,
  X,
  Globe,
  Timer,
  Languages,
  Layout,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyEnd,
  Square,
  Circle,
  Type,
  Move,
  Pipette,
  ChevronUp,
  ChevronDown,
  Power,
  FileText
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDeliverySettings } from '@/hooks/useDeliverySettings';
import { useWidgetSettings } from '@/hooks/useWidgetSettings';
import { format, addDays, setHours, setMinutes, setSeconds, differenceInSeconds } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { ProductTab } from './ProductTab';
import { FAQsTab } from './FAQsTab';

interface DeliveryAdminPanelProps {
  storeId: string | undefined;
  userId: string | undefined;
}

const AVAILABLE_VARIABLES = [
  { key: '{fecha_entrega_minima}', label: 'Fecha mínima de entrega estimada', example: 'martes 21' },
  { key: '{fecha_entrega_maxima}', label: 'Fecha máxima de entrega estimada', example: 'jueves 23 de enero' },
  { key: '{fecha_preparacion_minima}', label: 'Fecha mínima de preparación', example: 'lunes 20' },
  { key: '{fecha_preparacion_maxima}', label: 'Fecha máxima de preparación', example: 'martes 21' },
  { key: '{hora_corte}', label: 'Hora de corte', example: '14:00' },
  { key: '{horas_restantes}', label: 'Horas hasta la hora de corte', example: '3' },
  { key: '{minutos_restantes}', label: 'Minutos hasta la hora de corte', example: '45' },
  { key: '{segundos_restantes}', label: 'Segundos hasta la hora de corte', example: '30' },
  { key: '{nombre_pais}', label: 'Nombre del país del visitante', example: 'Argentina' },
  { key: '{nombre_pais_avanzado}', label: 'Nombre del país (con popup)', example: 'Argentina' },
  { key: '{nombre_region}', label: 'Región del país del visitante', example: 'Buenos Aires' },
  { key: '{bandera_pais}', label: 'Bandera del país', example: '🇦🇷' },
  { key: '{bandera_pais_avanzado}', label: 'Bandera del país (con popup)', example: '🇦🇷' },
  { key: '{hoy_o_manana}', label: '"hoy" antes del corte, "mañana" después', example: 'hoy' },
  { key: '{dias_preparacion_min}', label: 'Días mínimos de preparación', example: '1' },
  { key: '{dias_preparacion_max}', label: 'Días máximos de preparación', example: '2' },
  { key: '{dias_envio_min}', label: 'Días mínimos de envío', example: '3' },
  { key: '{dias_envio_max}', label: 'Días máximos de envío', example: '5' },
  { key: '{dias_laborales}', label: 'Lista de días laborales', example: 'Lun-Vie' },
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
];

const DATE_FORMATS = [
  { value: 'M D', label: 'M D - Jan 31', example: 'Jan 31' },
  { value: 'D M', label: 'D M - 31 Jan', example: '31 Jan' },
  { value: 'DD/MM', label: 'DD/MM - 31/01', example: '31/01' },
  { value: 'MM/DD', label: 'MM/DD - 01/31', example: '01/31' },
  { value: 'EEEE d MMMM', label: 'Full - martes 31 de enero', example: 'martes 31 de enero' },
];

const COUNTDOWN_FORMATS = [
  { value: 'HH:MM:SS', label: '01:59:30' },
  { value: 'HHh MMm SSs', label: '01h 59m 30s' },
  { value: 'HH Hours MM Minutes', label: '01 Hours 59 Minutes' },
  { value: 'HHh MMm', label: '01h 59m (sin segundos)' },
];

const LANGUAGES = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
];

const TIMELINE_ICONS = [
  { id: 'shopping-bag', icon: ShoppingBag, label: 'Bolsa de compras' },
  { id: 'package', icon: Package, label: 'Paquete' },
  { id: 'box', icon: Box, label: 'Caja' },
  { id: 'truck', icon: Truck, label: 'Camión' },
  { id: 'map-pin', icon: MapPin, label: 'Ubicación' },
  { id: 'home', icon: Home, label: 'Casa' },
  { id: 'gift', icon: Gift, label: 'Regalo' },
  { id: 'star', icon: Star, label: 'Estrella' },
  { id: 'heart', icon: Heart, label: 'Corazón' },
  { id: 'zap', icon: Zap, label: 'Rayo' },
  { id: 'check', icon: CheckCircle2, label: 'Check' },
];

const DEFAULT_MESSAGE = `🚚 Pídelo {hoy_o_manana} antes de las {hora_corte} y recíbelo entre el {fecha_entrega_minima} y el {fecha_entrega_maxima}`;
const DEFAULT_OUT_OF_STOCK_MESSAGE = `⏳ Este producto está temporalmente agotado. Te notificaremos cuando esté disponible.`;

const MESSAGE_TEMPLATES = [
  {
    id: 'free-shipping',
    name: 'Envío Gratis',
    icon: '🎁',
    description: 'Ideal para promocionar envío gratuito',
    template: 'Envío gratis a {bandera_pais} {nombre_pais_avanzado}. Pide en las próximas {hora_corte} para despacho {hoy_o_manana}, y recibirás tu paquete entre el {fecha_entrega_minima} y el {fecha_entrega_maxima}'
  },
  {
    id: 'urgency',
    name: 'Urgencia',
    icon: '⏰',
    description: 'Crea sensación de urgencia para comprar ahora',
    template: '¿Lo quieres pronto? Pide en las próximas {horas_restantes}h {minutos_restantes}m {segundos_restantes}s y recíbelo entre el {fecha_entrega_minima} y el {fecha_entrega_maxima}'
  },
  {
    id: 'informative',
    name: 'Informativo',
    icon: '📋',
    description: 'Mensaje simple y directo',
    template: 'Fecha estimada de entrega: Entre el {fecha_entrega_minima} y el {fecha_entrega_maxima}'
  },
  {
    id: 'fast-dispatch',
    name: 'Despacho Rápido',
    icon: '🚚',
    description: 'Destaca la rapidez del envío',
    template: '🚚 Pide antes de las {hora_corte} y te lo entregamos entre el {fecha_entrega_minima} y el {fecha_entrega_maxima}'
  },
  {
    id: 'manufacturing',
    name: 'Fabricación',
    icon: '🔧',
    description: 'Para productos hechos a medida',
    template: 'Producto hecho a medida para ti. Envío estimado entre el {fecha_entrega_minima} y el {fecha_entrega_maxima}'
  },
  {
    id: 'minimalist',
    name: 'Minimalista',
    icon: '✨',
    description: 'Mensaje corto y elegante',
    template: 'Llega el {fecha_entrega_minima} - {fecha_entrega_maxima}, si compras hoy'
  },
  {
    id: 'trust',
    name: 'Confianza',
    icon: '✅',
    description: 'Genera confianza con seguimiento',
    template: '✅ Envío con seguimiento a {nombre_pais_avanzado} {bandera_pais}. Entrega esperada: {fecha_entrega_minima} al {fecha_entrega_maxima}'
  },
];

interface TimelineStatus {
  icon: string;
  title: string;
}

export function DeliveryAdminPanel({ storeId, userId }: DeliveryAdminPanelProps) {
  const { settings, loading, saving, saveSettings, updateSettings } = useDeliverySettings(storeId, userId);
  const { 
    appearance, 
    texts, 
    loading: widgetLoading, 
    saving: widgetSaving,
    saveAppearance,
    saveTexts,
    updateAppearance,
    updateTexts,
  } = useWidgetSettings(storeId, userId);
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mainTab, setMainTab] = useState('dashboard');
  const [subTab, setSubTab] = useState('widget');
  
  // Out of stock message state
  const [outOfStockEnabled, setOutOfStockEnabled] = useState(false);
  
  // Templates modal state
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);
  
  // Progress bar widget state
  const [activeStatusTab, setActiveStatusTab] = useState<'ordered' | 'ready' | 'delivered'>('ordered');
  const [timelineStatuses, setTimelineStatuses] = useState<Record<string, TimelineStatus>>({
    ordered: { icon: 'shopping-bag', title: 'Pedido' },
    ready: { icon: 'package', title: 'Preparado' },
    delivered: { icon: 'map-pin', title: 'Entregado' },
  });

  // Countdown settings
  const [countdownFormat, setCountdownFormat] = useState('HH:MM:SS');
  const [cutoffHour, setCutoffHour] = useState(14);
  const [cutoffMinute, setCutoffMinute] = useState(0);
  const [timezoneMode, setTimezoneMode] = useState<'visitor' | 'fixed'>('visitor');
  const [fixedTimezone, setFixedTimezone] = useState('America/Argentina/Buenos_Aires');
  const [countdownMode, setCountdownMode] = useState<'include' | 'exclude'>('exclude');
  
  // Holidays & Translation
  const [holidays, setHolidays] = useState<string[]>([]);
  const [newHoliday, setNewHoliday] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['es']);
  const [newLanguage, setNewLanguage] = useState('');
  
  // Date format
  const [dateFormat, setDateFormat] = useState('M D');

  // Country modal styles (local state - not persisted yet)
  const [modalDisplayMode, setModalDisplayMode] = useState<'popup' | 'dropdown'>('popup');
  const [modalArrowPosition, setModalArrowPosition] = useState<'left' | 'center' | 'right'>('center');
  const [modalBackgroundColor, setModalBackgroundColor] = useState('#ffffff');
  const [modalBackgroundOpacity, setModalBackgroundOpacity] = useState(100);
  const [modalBorderWidth, setModalBorderWidth] = useState(1);
  const [modalBorderRadius, setModalBorderRadius] = useState(8);
  const [modalBorderColor, setModalBorderColor] = useState('#e5e7eb');
  const [modalFontSize, setModalFontSize] = useState(14);
  const [modalTextColor, setModalTextColor] = useState('#374151');
  const [widgetLocation, setWidgetLocation] = useState<'automatic' | 'manual'>('automatic');

  // Sub-tab for appearance
  const [appearanceSubTab, setAppearanceSubTab] = useState('layout');

  // Derived values from widget settings hooks
  const widgetMessage = texts?.message_template || DEFAULT_MESSAGE;
  const outOfStockMessage = texts?.out_of_stock_message || DEFAULT_OUT_OF_STOCK_MESSAGE;
  const widgetMode = (appearance?.widget_mode || 'message-bar') as 'message-bar' | 'bar-message' | 'message-only' | 'bar-only';
  const widgetPosition = (appearance?.widget_position || 'below') as 'above' | 'below';
  const marginTop = appearance?.margin_top ?? 16;
  const marginRight = appearance?.margin_right ?? 0;
  const marginBottom = appearance?.margin_bottom ?? 16;
  const marginLeft = appearance?.margin_left ?? 0;
  const messageBorderWidth = appearance?.message_border_width ?? 1;
  const messageBorderRadius = appearance?.message_border_radius ?? 8;
  const messageBorderStyle = (appearance?.message_border_style || 'solid') as 'solid' | 'dashed' | 'dotted';
  const messageBorderColor = appearance?.message_border_color || '#e5e7eb';
  const messageBackgroundColor = appearance?.message_background_color || '#f0fdf4';
  const messageTextColor = appearance?.message_text_color || '#166534';
  const progressIconColor = appearance?.progress_icon_color || '#22c55e';
  const progressIconBgColor = appearance?.progress_icon_bg_color || '#dcfce7';
  const progressTitleColor = appearance?.progress_title_color || '#374151';
  const progressDateColor = appearance?.progress_date_color || '#6b7280';
  const progressLineColor = appearance?.progress_line_color || '#e5e7eb';

  // Calc modes from delivery settings
  const orderReadyCalcMode = (settings?.preparation_calc_mode === 'min-only' ? 'min' : settings?.preparation_calc_mode === 'none' ? 'none' : 'minmax') as 'minmax' | 'min' | 'none';
  const deliveryCalcMode = (settings?.shipping_calc_mode === 'min-only' ? 'min' : settings?.shipping_calc_mode === 'none' ? 'none' : 'minmax') as 'minmax' | 'min' | 'none';

  // Sync cutoff time from settings
  useEffect(() => {
    if (settings) {
      const [hour, minute] = settings.cutoff_time.split(':').map(Number);
      setCutoffHour(hour);
      setCutoffMinute(minute);
    }
  }, [settings]);

  // Update current time every second for live preview
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSave = async () => {
    try {
      // Save delivery settings
      if (settings) {
        await saveSettings(settings);
      }
      
      // Save appearance settings
      if (appearance) {
        await saveAppearance(appearance);
      }
      
      // Save text settings
      if (texts) {
        await saveTexts(texts);
      }
      
      toast({
        title: "✓ Configuración guardada",
        description: "La configuración surtirá efecto en menos de 1 minuto",
      });
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  // Wrapper functions to update appearance
  const setWidgetMessage = (value: string | ((prev: string) => string)) => {
    const newValue = typeof value === 'function' ? value(widgetMessage) : value;
    updateTexts({ message_template: newValue });
  };

  const setOutOfStockMessage = (value: string | ((prev: string) => string)) => {
    const newValue = typeof value === 'function' ? value(outOfStockMessage) : value;
    updateTexts({ out_of_stock_message: newValue });
  };

  const setWidgetMode = (value: 'message-bar' | 'bar-message' | 'message-only' | 'bar-only') => {
    updateAppearance({ widget_mode: value });
  };

  const setWidgetPosition = (value: 'above' | 'below') => {
    updateAppearance({ widget_position: value });
  };

  const setMarginTop = (value: number) => updateAppearance({ margin_top: value });
  const setMarginRight = (value: number) => updateAppearance({ margin_right: value });
  const setMarginBottom = (value: number) => updateAppearance({ margin_bottom: value });
  const setMarginLeft = (value: number) => updateAppearance({ margin_left: value });
  const setMessageBorderWidth = (value: number) => updateAppearance({ message_border_width: value });
  const setMessageBorderRadius = (value: number) => updateAppearance({ message_border_radius: value });
  const setMessageBorderStyle = (value: 'solid' | 'dashed' | 'dotted') => updateAppearance({ message_border_style: value });
  const setMessageBorderColor = (value: string) => updateAppearance({ message_border_color: value });
  const setMessageBackgroundColor = (value: string) => updateAppearance({ message_background_color: value });
  const setMessageTextColor = (value: string) => updateAppearance({ message_text_color: value });
  const setProgressIconColor = (value: string) => updateAppearance({ progress_icon_color: value });
  const setProgressIconBgColor = (value: string) => updateAppearance({ progress_icon_bg_color: value });
  const setProgressTitleColor = (value: string) => updateAppearance({ progress_title_color: value });
  const setProgressDateColor = (value: string) => updateAppearance({ progress_date_color: value });
  const setProgressLineColor = (value: string) => updateAppearance({ progress_line_color: value });

  // Calc mode handlers
  const setOrderReadyCalcMode = (value: 'minmax' | 'min' | 'none') => {
    const dbValue = value === 'minmax' ? 'min-max' : value === 'min' ? 'min-only' : 'none';
    updateSettings({ preparation_calc_mode: dbValue });
  };

  const setDeliveryCalcMode = (value: 'minmax' | 'min' | 'none') => {
    const dbValue = value === 'minmax' ? 'min-max' : value === 'min' ? 'min-only' : 'none';
    updateSettings({ shipping_calc_mode: dbValue });
  };

  const toggleWorkingDay = (day: number, target: 'settings' | 'delivery' | 'orderReady' = 'settings') => {
    if (settings) {
      const newDays = settings.working_days.includes(day)
        ? settings.working_days.filter(d => d !== day)
        : [...settings.working_days, day].sort((a, b) => a - b);
      updateSettings({ working_days: newDays });
    }
  };

  // Validation handlers for min/max ranges
  const handlePreparationMinChange = (value: number) => {
    const newMin = Math.max(0, Math.min(30, value));
    const updates: Partial<typeof settings> = { preparation_min_days: newMin };
    if (settings && newMin > settings.preparation_max_days) {
      updates.preparation_max_days = newMin;
    }
    updateSettings(updates);
  };

  const handlePreparationMaxChange = (value: number) => {
    const newMax = Math.max(0, Math.min(30, value));
    if (settings && newMax < settings.preparation_min_days) {
      return; // Don't allow max to be less than min
    }
    updateSettings({ preparation_max_days: newMax });
  };

  const handleShippingMinChange = (value: number) => {
    const newMin = Math.max(0, Math.min(30, value));
    const updates: Partial<typeof settings> = { shipping_min_days: newMin };
    if (settings && newMin > settings.shipping_max_days) {
      updates.shipping_max_days = newMin;
    }
    updateSettings(updates);
  };

  const handleShippingMaxChange = (value: number) => {
    const newMax = Math.max(0, Math.min(30, value));
    if (settings && newMax < settings.shipping_min_days) {
      return; // Don't allow max to be less than min
    }
    updateSettings({ shipping_max_days: newMax });
  };

  // Handle cutoff time changes and sync with settings
  const handleCutoffHourChange = (hour: number) => {
    setCutoffHour(hour);
    updateSettings({ cutoff_time: `${String(hour).padStart(2, '0')}:${String(cutoffMinute).padStart(2, '0')}:00` });
  };

  const handleCutoffMinuteChange = (minute: number) => {
    setCutoffMinute(minute);
    updateSettings({ cutoff_time: `${String(cutoffHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00` });
  };

  const insertVariable = (variable: string, target: 'main' | 'outOfStock' = 'main') => {
    if (target === 'main') {
      setWidgetMessage(prev => prev + ' ' + variable);
    } else {
      setOutOfStockMessage(prev => prev + ' ' + variable);
    }
  };

  const updateTimelineStatus = (status: string, field: 'icon' | 'title', value: string) => {
    if (field === 'title' && value.length > 30) return;
    setTimelineStatuses(prev => ({
      ...prev,
      [status]: { ...prev[status], [field]: value }
    }));
  };

  const getIconComponent = (iconId: string) => {
    const found = TIMELINE_ICONS.find(i => i.id === iconId);
    return found ? found.icon : ShoppingBag;
  };

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable);
    toast({
      title: "Variable copiada",
      description: `${variable} copiada al portapapeles`,
    });
  };

  // Calculate delivery preview
  const deliveryPreview = useMemo(() => {
    if (!settings) return null;

    const now = currentTime;
    const [cutoffH, cutoffM] = settings.cutoff_time.split(':').map(Number);
    const cutoffToday = setSeconds(setMinutes(setHours(new Date(now), cutoffH), cutoffM), 0);
    
    const secondsUntilCutoff = differenceInSeconds(cutoffToday, now);
    const isPastCutoff = secondsUntilCutoff <= 0;
    
    let hoursRemaining = 0;
    let minutesRemaining = 0;
    let secondsRemaining = 0;
    
    if (!isPastCutoff) {
      hoursRemaining = Math.floor(secondsUntilCutoff / 3600);
      minutesRemaining = Math.floor((secondsUntilCutoff % 3600) / 60);
      secondsRemaining = secondsUntilCutoff % 60;
    }

    const getNextWorkingDay = (startDate: Date, daysToAdd: number): Date => {
      let currentDate = new Date(startDate);
      let addedDays = 0;
      
      if (settings.working_days.length === 0) {
        return addDays(currentDate, daysToAdd);
      }
      
      while (addedDays < daysToAdd) {
        currentDate = addDays(currentDate, 1);
        const dayOfWeek = currentDate.getDay();
        if (settings.working_days.includes(dayOfWeek)) {
          addedDays++;
        }
      }
      return currentDate;
    };

    // Use calculation modes to determine which days to use
    const prepMinDays = orderReadyCalcMode !== 'none' ? settings.preparation_min_days : 0;
    const prepMaxDays = orderReadyCalcMode === 'minmax' ? settings.preparation_max_days : prepMinDays;
    const shipMinDays = deliveryCalcMode !== 'none' ? settings.shipping_min_days : 0;
    const shipMaxDays = deliveryCalcMode === 'minmax' ? settings.shipping_max_days : shipMinDays;

    const extraDay = isPastCutoff ? 1 : 0;
    const effectivePrepMin = prepMinDays + extraDay;
    const effectivePrepMax = prepMaxDays + extraDay;

    const totalMinDays = effectivePrepMin + shipMinDays;
    const totalMaxDays = effectivePrepMax + shipMaxDays;

    const minDeliveryDate = getNextWorkingDay(now, totalMinDays);
    const maxDeliveryDate = getNextWorkingDay(now, totalMaxDays);
    const orderReadyMinDate = getNextWorkingDay(now, effectivePrepMin);
    const orderReadyMaxDate = getNextWorkingDay(now, effectivePrepMax);

    // Format working days for display
    const workingDaysLabels = settings.working_days
      .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
      .map(d => DAYS_OF_WEEK.find(day => day.value === d)?.short)
      .filter(Boolean)
      .join(', ');

    return {
      isPastCutoff,
      hoursRemaining,
      minutesRemaining,
      secondsRemaining,
      minDeliveryDate,
      maxDeliveryDate,
      orderReadyMinDate,
      orderReadyMaxDate,
      orderedDate: now,
      cutoffTime: settings.cutoff_time.slice(0, 5),
      prepMinDays,
      prepMaxDays,
      shipMinDays,
      shipMaxDays,
      workingDaysLabels: workingDaysLabels || 'Ninguno',
    };
  }, [settings, currentTime, orderReadyCalcMode, deliveryCalcMode]);

  // Replace variables in message for preview (Spanish variables)
  const previewMessage = useMemo(() => {
    if (!deliveryPreview || !settings) return widgetMessage;
    
    return widgetMessage
      // Spanish variables
      .replace('{fecha_entrega_minima}', format(deliveryPreview.minDeliveryDate, "EEEE d", { locale: es }))
      .replace('{fecha_entrega_maxima}', format(deliveryPreview.maxDeliveryDate, "EEEE d 'de' MMMM", { locale: es }))
      .replace('{fecha_preparacion_minima}', format(deliveryPreview.orderReadyMinDate, "EEEE d", { locale: es }))
      .replace('{fecha_preparacion_maxima}', format(deliveryPreview.orderReadyMaxDate, "EEEE d", { locale: es }))
      .replace('{hora_corte}', deliveryPreview.cutoffTime)
      .replace('{horas_restantes}', String(deliveryPreview.hoursRemaining))
      .replace('{minutos_restantes}', String(deliveryPreview.minutesRemaining))
      .replace('{segundos_restantes}', String(deliveryPreview.secondsRemaining))
      .replace('{nombre_pais}', 'Argentina')
      .replace('{nombre_pais_avanzado}', 'Argentina')
      .replace('{nombre_region}', 'Buenos Aires')
      .replace('{bandera_pais}', '🇦🇷')
      .replace('{bandera_pais_avanzado}', '🇦🇷')
      .replace('{hoy_o_manana}', deliveryPreview.isPastCutoff ? 'mañana' : 'hoy')
      .replace('{dias_preparacion_min}', String(deliveryPreview.prepMinDays))
      .replace('{dias_preparacion_max}', String(deliveryPreview.prepMaxDays))
      .replace('{dias_envio_min}', String(deliveryPreview.shipMinDays))
      .replace('{dias_envio_max}', String(deliveryPreview.shipMaxDays))
      .replace('{dias_laborales}', deliveryPreview.workingDaysLabels)
      // Legacy English variables for backwards compatibility
      .replace('{order_delivered_minimum_date}', format(deliveryPreview.minDeliveryDate, "EEEE d", { locale: es }))
      .replace('{order_delivered_maximum_date}', format(deliveryPreview.maxDeliveryDate, "EEEE d 'de' MMMM", { locale: es }))
      .replace('{order_ready_minimum_date}', format(deliveryPreview.orderReadyMinDate, "EEEE d", { locale: es }))
      .replace('{order_ready_maximum_date}', format(deliveryPreview.orderReadyMaxDate, "EEEE d", { locale: es }))
      .replace('{cutoff_time}', deliveryPreview.cutoffTime)
      .replace('{country_name}', 'Argentina')
      .replace('{country_name_advanced}', 'Argentina')
      .replace('{region_name}', 'Buenos Aires')
      .replace('{country_flag}', '🇦🇷')
      .replace('{country_flag_advanced}', '🇦🇷')
      .replace(/\{country_code_(\w+)_flag\}/g, '🏳️')
      .replace('{today_and_tomorrow}', deliveryPreview.isPastCutoff ? 'mañana' : 'hoy');
  }, [widgetMessage, deliveryPreview, settings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No se pudieron cargar los ajustes
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Entrega Estimada</h1>
          <p className="text-muted-foreground">
            Configura y personaliza el widget de fecha de entrega para tu tienda
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Widget Enable/Disable Switch */}
          <div className={`flex items-center gap-3 rounded-lg border px-4 py-2 transition-colors ${settings?.widget_enabled ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800' : 'bg-muted/50 border-border'}`}>
            <div className="flex items-center gap-2">
              <Power className={`h-4 w-4 ${settings?.widget_enabled ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
              <Label htmlFor="widget-enabled" className="text-sm font-medium cursor-pointer whitespace-nowrap">
                {settings?.widget_enabled ? 'Widget activo' : 'Widget inactivo'}
              </Label>
            </div>
            <Switch
              id="widget-enabled"
              checked={settings?.widget_enabled ?? true}
              onCheckedChange={(checked) => updateSettings({ widget_enabled: checked })}
            />
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Guardar cambios
          </Button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-6">
        <TabsList className="bg-muted/50 p-1 h-auto flex-wrap">
          <TabsTrigger value="dashboard" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="product" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Package className="h-4 w-4" />
            Configuración de Producto
          </TabsTrigger>
          <TabsTrigger value="category" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <FolderTree className="h-4 w-4" />
            Categoría
          </TabsTrigger>
          <TabsTrigger value="plans" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <CreditCard className="h-4 w-4" />
            Planes
          </TabsTrigger>
          <TabsTrigger value="faqs" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <HelpCircle className="h-4 w-4" />
            FAQs
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Content */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Sub-Navigation Tabs */}
          <Tabs value={subTab} onValueChange={setSubTab} className="space-y-6">
            <TabsList className="bg-transparent border-b rounded-none h-auto p-0 w-full justify-start gap-0">
              <TabsTrigger 
                value="widget" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Widget
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                <Settings2 className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
              <TabsTrigger 
                value="appearance" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                <Palette className="h-4 w-4 mr-2" />
                Apariencia
              </TabsTrigger>
              <TabsTrigger 
                value="advanced" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                <Settings2 className="h-4 w-4 mr-2" />
                Avanzado
              </TabsTrigger>
              <TabsTrigger 
                value="other" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                <MoreHorizontal className="h-4 w-4 mr-2" />
                Otros
              </TabsTrigger>
            </TabsList>

            {/* Widget Editor Tab */}
            <TabsContent value="widget" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Editor Section */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Editor de Mensaje</CardTitle>
                      <CardDescription>
                        Personaliza el mensaje que verán tus clientes. Usa las variables disponibles para mostrar información dinámica.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="widget-message">Mensaje del Widget</Label>
                          <Dialog open={templatesModalOpen} onOpenChange={setTemplatesModalOpen}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="gap-2">
                                <FileText className="h-4 w-4" />
                                Ver Plantillas
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <FileText className="h-5 w-5" />
                                  Plantillas de Texto para el Mensaje
                                </DialogTitle>
                                <DialogDescription>
                                  Selecciona una plantilla para reemplazar el mensaje actual del widget
                                </DialogDescription>
                              </DialogHeader>
                              <div className="flex-1 overflow-y-auto pr-2 space-y-3 py-4">
                                {MESSAGE_TEMPLATES.map((template) => (
                                  <div
                                    key={template.id}
                                    className="group relative rounded-lg border border-border bg-card p-4 hover:border-primary hover:bg-accent/50 transition-all cursor-pointer"
                                    onClick={() => {
                                      setWidgetMessage(template.template);
                                      setTemplatesModalOpen(false);
                                      toast({
                                        title: "Plantilla aplicada",
                                        description: `Se ha aplicado la plantilla "${template.name}"`,
                                      });
                                    }}
                                  >
                                    <div className="flex items-start gap-3">
                                      <span className="text-2xl">{template.icon}</span>
                                      <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                          <h4 className="font-semibold text-foreground">{template.name}</h4>
                                          <Badge variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            Usar
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{template.description}</p>
                                        <div className="mt-2 p-2 rounded bg-muted/50 border border-border/50">
                                          <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                                            {template.template}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <Textarea
                          id="widget-message"
                          value={widgetMessage}
                          onChange={(e) => setWidgetMessage(e.target.value)}
                          placeholder="Escribe tu mensaje aquí..."
                          className="min-h-[120px] font-mono text-sm resize-none"
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Variables Disponibles</Label>
                        <p className="text-xs text-muted-foreground">
                          Haz clic en una variable para insertarla en el mensaje o usa el botón de copiar
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {AVAILABLE_VARIABLES.map((variable) => (
                            <div 
                              key={variable.key}
                              className="group flex items-center"
                            >
                              <Badge 
                                variant="secondary"
                                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors font-mono text-xs py-1.5 pr-1"
                                onClick={() => insertVariable(variable.key)}
                              >
                                {variable.key}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyVariable(variable.key);
                                  }}
                                  className="ml-1.5 p-0.5 rounded hover:bg-primary-foreground/20"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Referencia de Variables:</p>
                        <div className="grid gap-1.5">
                          {AVAILABLE_VARIABLES.map((variable) => (
                            <div key={variable.key} className="flex items-center justify-between text-xs">
                              <code className="text-primary font-mono">{variable.key}</code>
                              <span className="text-muted-foreground">→ {variable.example}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Out of Stock Message Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <PackageX className="h-5 w-5 text-destructive" />
                        Mensaje para productos agotados
                      </CardTitle>
                      <CardDescription>
                        Personaliza el mensaje que se muestra cuando un producto no tiene inventario
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="out-of-stock-toggle">Mensaje personalizado</Label>
                          <p className="text-xs text-muted-foreground">
                            Activa para mostrar un mensaje diferente en productos sin stock
                          </p>
                        </div>
                        <Switch
                          id="out-of-stock-toggle"
                          checked={outOfStockEnabled}
                          onCheckedChange={setOutOfStockEnabled}
                        />
                      </div>
                      
                      {outOfStockEnabled && (
                        <>
                          <Separator />
                          <div className="space-y-2">
                            <Label htmlFor="out-of-stock-message">Mensaje de producto agotado</Label>
                            <Textarea
                              id="out-of-stock-message"
                              value={outOfStockMessage}
                              onChange={(e) => setOutOfStockMessage(e.target.value)}
                              placeholder="Escribe el mensaje para productos sin stock..."
                              className="min-h-[100px] font-mono text-sm resize-none"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Variables Disponibles</Label>
                            <div className="flex flex-wrap gap-2">
                              {AVAILABLE_VARIABLES.slice(0, 6).map((variable) => (
                                <Badge 
                                  key={variable.key}
                                  variant="secondary"
                                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors font-mono text-xs py-1.5"
                                  onClick={() => insertVariable(variable.key, 'outOfStock')}
                                >
                                  {variable.key}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                            <p className="text-sm font-medium text-destructive mb-1">Vista previa:</p>
                            <p className="text-sm">{outOfStockMessage}</p>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Progress Bar Widget Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Sparkles className="h-5 w-5 text-accent" />
                        Barra de Progreso
                      </CardTitle>
                      <CardDescription>
                        Configura la línea de tiempo visual que muestra el progreso del pedido
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Order Status Editor */}
                      <div className="space-y-4">
                        <Label>Editor de Estados del Pedido</Label>
                        
                        {/* Status Tabs */}
                        <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
                          {(['ordered', 'ready', 'delivered'] as const).map((status) => (
                            <button
                              key={status}
                              onClick={() => setActiveStatusTab(status)}
                              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                activeStatusTab === status 
                                  ? 'bg-background shadow-sm text-foreground' 
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              {status === 'ordered' ? 'Pedido' : status === 'ready' ? 'Preparado' : 'Entregado'}
                            </button>
                          ))}
                        </div>

                        {/* Status Configuration */}
                        <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                          <div className="space-y-2">
                            <Label className="text-sm">Seleccionar ícono</Label>
                            <div className="flex flex-wrap gap-2">
                              {TIMELINE_ICONS.map((iconOption) => {
                                const IconComponent = iconOption.icon;
                                const isSelected = timelineStatuses[activeStatusTab]?.icon === iconOption.id;
                                return (
                                  <button
                                    key={iconOption.id}
                                    onClick={() => updateTimelineStatus(activeStatusTab, 'icon', iconOption.id)}
                                    className={`p-2.5 rounded-lg border-2 transition-all ${
                                      isSelected 
                                        ? 'border-primary bg-primary/10 text-primary' 
                                        : 'border-transparent bg-muted hover:border-muted-foreground/30'
                                    }`}
                                    title={iconOption.label}
                                  >
                                    <IconComponent className="h-5 w-5" />
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="status-title" className="text-sm">Título del estado</Label>
                              <span className={`text-xs ${
                                (timelineStatuses[activeStatusTab]?.title.length || 0) > 25 
                                  ? 'text-destructive' 
                                  : 'text-muted-foreground'
                              }`}>
                                {timelineStatuses[activeStatusTab]?.title.length || 0}/30
                              </span>
                            </div>
                            <Input
                              id="status-title"
                              value={timelineStatuses[activeStatusTab]?.title || ''}
                              onChange={(e) => updateTimelineStatus(activeStatusTab, 'title', e.target.value)}
                              placeholder="Título del estado..."
                              maxLength={30}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Preview Section */}
                <div className="lg:sticky lg:top-6 h-fit space-y-6">
                  <Card className="border-2 border-primary/20 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Eye className="h-5 w-5 text-primary" />
                        Vista Previa del Widget
                      </CardTitle>
                      <CardDescription>
                        Vista previa en tiempo real de cómo verán tus clientes el widget
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                      {/* Widget Preview with applied styles */}
                      <div 
                        className="space-y-4"
                        style={{
                          marginTop: `${marginTop}px`,
                          marginRight: `${marginRight}px`,
                          marginBottom: `${marginBottom}px`,
                          marginLeft: `${marginLeft}px`,
                        }}
                      >
                        {/* Message + Bar or Bar + Message based on widgetMode */}
                        {(widgetMode === 'message-bar' || widgetMode === 'message-only') && (
                          <div 
                            className="p-4"
                            style={{
                              borderWidth: `${messageBorderWidth}px`,
                              borderRadius: `${messageBorderRadius}px`,
                              borderStyle: messageBorderStyle,
                              borderColor: messageBorderColor,
                              backgroundColor: messageBackgroundColor,
                              color: messageTextColor,
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div 
                                className="rounded-full p-2.5 shrink-0"
                                style={{ backgroundColor: `${progressIconBgColor}20` }}
                              >
                                <Truck className="h-5 w-5" style={{ color: progressIconBgColor }} />
                              </div>
                              <p className="text-sm font-medium leading-relaxed">
                                {previewMessage}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Timeline Visual */}
                        {(widgetMode !== 'message-only') && (
                          <div className="space-y-4">
                            <p className="text-sm font-medium text-muted-foreground">Línea de tiempo de entrega</p>
                            <div className="relative">
                              {/* Timeline Line */}
                              <div 
                                className="absolute top-6 left-6 right-6 h-0.5"
                                style={{ background: `linear-gradient(to right, ${progressLineColor}, ${progressLineColor}80, ${progressLineColor}60)` }}
                              />
                              
                              {/* Timeline Steps */}
                              <div className="relative flex justify-between">
                                {/* Ordered */}
                                {(() => {
                                  const OrderedIcon = getIconComponent(timelineStatuses.ordered?.icon || 'shopping-bag');
                                  return (
                                    <div className="flex flex-col items-center">
                                      <div 
                                        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg ring-4 ring-background"
                                        style={{ backgroundColor: progressIconBgColor }}
                                      >
                                        <OrderedIcon className="h-5 w-5" style={{ color: progressIconColor }} />
                                      </div>
                                      <div className="mt-3 text-center">
                                        <p className="text-xs font-semibold" style={{ color: progressTitleColor }}>
                                          {timelineStatuses.ordered?.title || 'Pedido'}
                                        </p>
                                        <p className="text-[10px]" style={{ color: progressDateColor }}>
                                          {deliveryPreview && format(deliveryPreview.orderedDate, "d MMM", { locale: es })}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* Order Ready */}
                                {(() => {
                                  const ReadyIcon = getIconComponent(timelineStatuses.ready?.icon || 'package');
                                  return (
                                    <div className="flex flex-col items-center">
                                      <div 
                                        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg ring-4 ring-background"
                                        style={{ backgroundColor: `${progressIconBgColor}99` }}
                                      >
                                        <ReadyIcon className="h-5 w-5" style={{ color: progressIconColor }} />
                                      </div>
                                      <div className="mt-3 text-center">
                                        <p className="text-xs font-semibold" style={{ color: progressTitleColor }}>
                                          {timelineStatuses.ready?.title || 'Preparado'}
                                        </p>
                                        <p className="text-[10px]" style={{ color: progressDateColor }}>
                                          {deliveryPreview && format(deliveryPreview.orderReadyMaxDate, "d MMM", { locale: es })}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* Delivered */}
                                {(() => {
                                  const DeliveredIcon = getIconComponent(timelineStatuses.delivered?.icon || 'map-pin');
                                  return (
                                    <div className="flex flex-col items-center">
                                      <div 
                                        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg ring-4 ring-background"
                                        style={{ backgroundColor: `${progressIconBgColor}66` }}
                                      >
                                        <DeliveredIcon className="h-5 w-5" style={{ color: progressIconColor }} />
                                      </div>
                                      <div className="mt-3 text-center">
                                        <p className="text-xs font-semibold" style={{ color: progressTitleColor }}>
                                          {timelineStatuses.delivered?.title || 'Entregado'}
                                        </p>
                                        <p className="text-[10px]" style={{ color: progressDateColor }}>
                                          {deliveryPreview && format(deliveryPreview.minDeliveryDate, "d", { locale: es })} - {deliveryPreview && format(deliveryPreview.maxDeliveryDate, "d MMM", { locale: es })}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Bar + Message (inverted order) */}
                        {widgetMode === 'bar-message' && (
                          <div 
                            className="p-4"
                            style={{
                              borderWidth: `${messageBorderWidth}px`,
                              borderRadius: `${messageBorderRadius}px`,
                              borderStyle: messageBorderStyle,
                              borderColor: messageBorderColor,
                              backgroundColor: messageBackgroundColor,
                              color: messageTextColor,
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div 
                                className="rounded-full p-2.5 shrink-0"
                                style={{ backgroundColor: `${progressIconBgColor}20` }}
                              >
                                <Truck className="h-5 w-5" style={{ color: progressIconBgColor }} />
                              </div>
                              <p className="text-sm font-medium leading-relaxed">
                                {previewMessage}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* System Info */}
                      <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Hora actual:</span>
                          <span className="font-medium">{format(currentTime, "HH:mm:ss", { locale: es })}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Hora de corte:</span>
                          <span className="font-medium">{settings.cutoff_time.slice(0, 5)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Estado:</span>
                          <Badge variant={deliveryPreview?.isPastCutoff ? "destructive" : "default"} className="text-[10px]">
                            {deliveryPreview?.isPastCutoff ? "Después del corte" : "Antes del corte"}
                          </Badge>
                        </div>
                        {deliveryPreview && !deliveryPreview.isPastCutoff && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Tiempo restante:</span>
                            <span className="font-medium text-primary font-mono">
                              {String(deliveryPreview.hoursRemaining).padStart(2, '0')}h {String(deliveryPreview.minutesRemaining).padStart(2, '0')}m {String(deliveryPreview.secondsRemaining).padStart(2, '0')}s
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Configuration Panel */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Date Range Setting */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Calendar className="h-5 w-5 text-primary" />
                        Configuración de Rango de Fechas
                      </CardTitle>
                      <CardDescription>
                        Configura los días de trabajo y rangos para el cálculo de fechas
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      {/* 1. Order Ready Block (Preparation) - FIRST in natural flow */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          <Label className="text-base font-semibold">1. Preparación del Pedido</Label>
                        </div>
                        
                        <div className="grid gap-4 pl-6 border-l-2 border-primary/20">
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Días laborales</Label>
                            <div className="flex flex-wrap gap-2">
                              {DAYS_OF_WEEK.map((day) => (
                                <div key={day.value} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`ready-day-${day.value}`}
                                    checked={settings.working_days.includes(day.value)}
                                    onCheckedChange={() => toggleWorkingDay(day.value, 'settings')}
                                  />
                                  <Label htmlFor={`ready-day-${day.value}`} className="text-sm cursor-pointer">
                                    {day.short}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {orderReadyCalcMode !== 'none' && (
                            <div className="space-y-2">
                              <Label className="text-sm text-muted-foreground">Rango de días (Preparación)</Label>
                              <div className="flex items-center gap-3">
                                <div className="flex-1">
                                  <Label htmlFor="prep-min" className="text-xs">Días mínimos</Label>
                                  <Input
                                    id="prep-min"
                                    type="number"
                                    min={0}
                                    max={orderReadyCalcMode === 'minmax' ? settings.preparation_max_days : 30}
                                    value={settings.preparation_min_days}
                                    onChange={(e) => handlePreparationMinChange(parseInt(e.target.value) || 0)}
                                  />
                                </div>
                                {orderReadyCalcMode === 'minmax' && (
                                  <>
                                    <span className="text-muted-foreground mt-5">-</span>
                                    <div className="flex-1">
                                      <Label htmlFor="prep-max" className="text-xs">Días máximos</Label>
                                      <Input
                                        id="prep-max"
                                        type="number"
                                        min={settings.preparation_min_days}
                                        max={30}
                                        value={settings.preparation_max_days}
                                        onChange={(e) => handlePreparationMaxChange(parseInt(e.target.value) || 0)}
                                      />
                                    </div>
                                  </>
                                )}
                              </div>
                              {orderReadyCalcMode === 'minmax' && settings.preparation_max_days < settings.preparation_min_days && (
                                <p className="text-xs text-destructive">
                                  El máximo no puede ser menor al mínimo
                                </p>
                              )}
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Modo de cálculo</Label>
                            <RadioGroup
                              value={orderReadyCalcMode}
                              onValueChange={(value) => setOrderReadyCalcMode(value as 'minmax' | 'min' | 'none')}
                              className="flex flex-wrap gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="minmax" id="ready-minmax" />
                                <Label htmlFor="ready-minmax" className="cursor-pointer font-normal text-sm">
                                  Días mínimos y máximos
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="min" id="ready-min" />
                                <Label htmlFor="ready-min" className="cursor-pointer font-normal text-sm">
                                  Solo días mínimos
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="none" id="ready-none" />
                                <Label htmlFor="ready-none" className="cursor-pointer font-normal text-sm">
                                  Ninguno
                                </Label>
                              </div>
                            </RadioGroup>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* 2. Order Delivery Block (Shipping) - SECOND in natural flow */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-accent" />
                          <Label className="text-base font-semibold">2. Entrega del Pedido</Label>
                        </div>
                        
                        <div className="grid gap-4 pl-6 border-l-2 border-accent/20">
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Días laborales del transportista</Label>
                            <div className="flex flex-wrap gap-2">
                              {DAYS_OF_WEEK.map((day) => (
                                <div key={day.value} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`delivery-day-${day.value}`}
                                    checked={settings?.working_days.includes(day.value)}
                                    onCheckedChange={() => toggleWorkingDay(day.value)}
                                  />
                                  <Label htmlFor={`delivery-day-${day.value}`} className="text-sm cursor-pointer">
                                    {day.short}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {deliveryCalcMode !== 'none' && (
                            <div className="space-y-2">
                              <Label className="text-sm text-muted-foreground">Rango de días (Envío)</Label>
                              <div className="flex items-center gap-3">
                                <div className="flex-1">
                                  <Label htmlFor="ship-min" className="text-xs">Días mínimos</Label>
                                  <Input
                                    id="ship-min"
                                    type="number"
                                    min={0}
                                    max={deliveryCalcMode === 'minmax' ? settings.shipping_max_days : 30}
                                    value={settings.shipping_min_days}
                                    onChange={(e) => handleShippingMinChange(parseInt(e.target.value) || 0)}
                                  />
                                </div>
                                {deliveryCalcMode === 'minmax' && (
                                  <>
                                    <span className="text-muted-foreground mt-5">-</span>
                                    <div className="flex-1">
                                      <Label htmlFor="ship-max" className="text-xs">Días máximos</Label>
                                      <Input
                                        id="ship-max"
                                        type="number"
                                        min={settings.shipping_min_days}
                                        max={30}
                                        value={settings.shipping_max_days}
                                        onChange={(e) => handleShippingMaxChange(parseInt(e.target.value) || 0)}
                                      />
                                    </div>
                                  </>
                                )}
                              </div>
                              {deliveryCalcMode === 'minmax' && settings.shipping_max_days < settings.shipping_min_days && (
                                <p className="text-xs text-destructive">
                                  El máximo no puede ser menor al mínimo
                                </p>
                              )}
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Modo de cálculo</Label>
                            <RadioGroup
                              value={deliveryCalcMode}
                              onValueChange={(value) => setDeliveryCalcMode(value as 'minmax' | 'min' | 'none')}
                              className="flex flex-wrap gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="minmax" id="delivery-minmax" />
                                <Label htmlFor="delivery-minmax" className="cursor-pointer font-normal text-sm">
                                  Días mínimos y máximos
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="min" id="delivery-min" />
                                <Label htmlFor="delivery-min" className="cursor-pointer font-normal text-sm">
                                  Solo días mínimos
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="none" id="delivery-none" />
                                <Label htmlFor="delivery-none" className="cursor-pointer font-normal text-sm">
                                  Ninguno
                                </Label>
                              </div>
                            </RadioGroup>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Countdown Setting */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Timer className="h-5 w-5 text-primary" />
                        Configuración de Cuenta Regresiva
                      </CardTitle>
                      <CardDescription>
                        Configura el formato del contador y la hora de corte
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Formato del contador</Label>
                          <Select value={countdownFormat} onValueChange={setCountdownFormat}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona formato" />
                            </SelectTrigger>
                            <SelectContent>
                              {COUNTDOWN_FORMATS.map((format) => (
                                <SelectItem key={format.value} value={format.value}>
                                  {format.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Hora de corte</Label>
                          <div className="flex items-center gap-2">
                            <Select value={String(cutoffHour)} onValueChange={(v) => handleCutoffHourChange(Number(v))}>
                              <SelectTrigger className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 24 }, (_, i) => (
                                  <SelectItem key={i} value={String(i)}>
                                    {String(i).padStart(2, '0')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span className="text-lg font-bold">:</span>
                            <Select value={String(cutoffMinute)} onValueChange={(v) => handleCutoffMinuteChange(Number(v))}>
                              <SelectTrigger className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 60 }, (_, i) => (
                                  <SelectItem key={i} value={String(i)}>
                                    {String(i).padStart(2, '0')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span className="text-sm text-muted-foreground">hrs</span>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <Label>Zona horaria</Label>
                        <RadioGroup
                          value={timezoneMode}
                          onValueChange={(value) => setTimezoneMode(value as 'visitor' | 'fixed')}
                          className="space-y-3"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="visitor" id="tz-visitor" />
                            <Label htmlFor="tz-visitor" className="cursor-pointer font-normal">
                              <span className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                Adaptar a la zona horaria del visitante
                              </span>
                            </Label>
                          </div>
                          <div className="flex items-start space-x-2">
                            <RadioGroupItem value="fixed" id="tz-fixed" className="mt-1" />
                            <div className="space-y-2">
                              <Label htmlFor="tz-fixed" className="cursor-pointer font-normal">
                                Zona horaria fija
                              </Label>
                              {timezoneMode === 'fixed' && (
                                <Select value={fixedTimezone} onValueChange={setFixedTimezone}>
                                  <SelectTrigger className="w-64">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="America/Argentina/Buenos_Aires">Argentina (GMT-3)</SelectItem>
                                    <SelectItem value="America/Mexico_City">México (GMT-6)</SelectItem>
                                    <SelectItem value="America/Santiago">Chile (GMT-4)</SelectItem>
                                    <SelectItem value="America/Bogota">Colombia (GMT-5)</SelectItem>
                                    <SelectItem value="America/Lima">Perú (GMT-5)</SelectItem>
                                    <SelectItem value="Europe/Madrid">España (GMT+1)</SelectItem>
                                    <SelectItem value="America/New_York">Nueva York (GMT-5)</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          </div>
                        </RadioGroup>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <Label>Modo de cuenta regresiva</Label>
                        <RadioGroup
                          value={countdownMode}
                          onValueChange={(value) => setCountdownMode(value as 'include' | 'exclude')}
                          className="space-y-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="exclude" id="countdown-exclude" />
                            <Label htmlFor="countdown-exclude" className="cursor-pointer font-normal text-sm">
                              Excluir días no laborales y feriados del contador
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="include" id="countdown-include" />
                            <Label htmlFor="countdown-include" className="cursor-pointer font-normal text-sm">
                              Incluir todos los días en el contador
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Holidays & Translation */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Calendar className="h-5 w-5 text-primary" />
                          Días Feriados
                        </CardTitle>
                        <CardDescription>
                          Define días feriados que no se contarán como días laborales
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex gap-2">
                          <Input
                            type="date"
                            value={newHoliday}
                            onChange={(e) => setNewHoliday(e.target.value)}
                            placeholder="YYYY-MM-DD"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              if (newHoliday && !holidays.includes(newHoliday)) {
                                setHolidays([...holidays, newHoliday].sort());
                                setNewHoliday('');
                              }
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {holidays.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {holidays.map((holiday) => (
                              <Badge key={holiday} variant="secondary" className="py-1 px-2 gap-1">
                                {holiday}
                                <button
                                  onClick={() => setHolidays(holidays.filter(h => h !== holiday))}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            No hay feriados configurados
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Languages className="h-5 w-5 text-primary" />
                          Traducción de Variables
                        </CardTitle>
                        <CardDescription>
                          Traduce las variables automáticas a otros idiomas
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex gap-2">
                          <Select value={newLanguage} onValueChange={setNewLanguage}>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Seleccionar idioma" />
                            </SelectTrigger>
                            <SelectContent>
                              {LANGUAGES.filter(l => !selectedLanguages.includes(l.value)).map((lang) => (
                                <SelectItem key={lang.value} value={lang.value}>
                                  {lang.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            onClick={() => {
                              if (newLanguage && !selectedLanguages.includes(newLanguage)) {
                                setSelectedLanguages([...selectedLanguages, newLanguage]);
                                setNewLanguage('');
                              }
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Añadir
                          </Button>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {selectedLanguages.map((langCode) => {
                            const lang = LANGUAGES.find(l => l.value === langCode);
                            return (
                              <Badge key={langCode} variant="secondary" className="py-1 px-2 gap-1">
                                {lang?.label || langCode}
                                {langCode !== 'es' && (
                                  <button
                                    onClick={() => setSelectedLanguages(selectedLanguages.filter(l => l !== langCode))}
                                    className="ml-1 hover:text-destructive"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                              </Badge>
                            );
                          })}
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          Variables afectadas: {'{today_and_tomorrow}'}, {'{country_name}'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Date Setting */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Calendar className="h-5 w-5 text-primary" />
                        Configuración de Fecha
                      </CardTitle>
                      <CardDescription>
                        Elige el formato en que se mostrarán las fechas
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label>Formato de fecha</Label>
                        <Select value={dateFormat} onValueChange={setDateFormat}>
                          <SelectTrigger className="w-full max-w-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DATE_FORMATS.map((format) => (
                              <SelectItem key={format.value} value={format.value}>
                                <span className="flex items-center gap-2">
                                  <span>{format.label}</span>
                                  <span className="text-muted-foreground text-xs">({format.example})</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sticky Preview */}
                <div className="lg:sticky lg:top-6 h-fit">
                  <Card className="border-2 border-primary/20 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Eye className="h-5 w-5 text-primary" />
                        Vista Previa del Widget
                      </CardTitle>
                      <CardDescription>
                        Vista previa en tiempo real de cómo verán tus clientes el widget
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                      {/* Widget Preview with applied styles */}
                      <div 
                        className="space-y-4"
                        style={{
                          marginTop: `${marginTop}px`,
                          marginRight: `${marginRight}px`,
                          marginBottom: `${marginBottom}px`,
                          marginLeft: `${marginLeft}px`,
                        }}
                      >
                        {/* Message Preview */}
                        {widgetMode !== 'bar-only' && (
                          <div 
                            className="p-4"
                            style={{
                              borderWidth: `${messageBorderWidth}px`,
                              borderRadius: `${messageBorderRadius}px`,
                              borderStyle: messageBorderStyle,
                              borderColor: messageBorderColor,
                              backgroundColor: messageBackgroundColor,
                              color: messageTextColor,
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div 
                                className="rounded-full p-2.5 shrink-0"
                                style={{ backgroundColor: `${progressIconBgColor}20` }}
                              >
                                <Truck className="h-5 w-5" style={{ color: progressIconBgColor }} />
                              </div>
                              <p className="text-sm font-medium leading-relaxed">
                                {previewMessage}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Timeline Visual */}
                        {(widgetMode !== 'message-only') && (
                          <div className="space-y-4">
                            <div className="relative">
                              {/* Timeline Line */}
                              <div 
                                className="absolute top-6 left-6 right-6 h-0.5"
                                style={{ background: `linear-gradient(to right, ${progressLineColor}, ${progressLineColor}80, ${progressLineColor}60)` }}
                              />
                              
                              {/* Timeline Steps */}
                              <div className="relative flex justify-between">
                                {/* Ordered */}
                                {(() => {
                                  const OrderedIcon = getIconComponent(timelineStatuses.ordered?.icon || 'shopping-bag');
                                  return (
                                    <div className="flex flex-col items-center">
                                      <div 
                                        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg ring-4 ring-background"
                                        style={{ backgroundColor: progressIconBgColor }}
                                      >
                                        <OrderedIcon className="h-5 w-5" style={{ color: progressIconColor }} />
                                      </div>
                                      <div className="mt-3 text-center">
                                        <p className="text-xs font-semibold" style={{ color: progressTitleColor }}>
                                          {timelineStatuses.ordered?.title || 'Pedido'}
                                        </p>
                                        <p className="text-[10px]" style={{ color: progressDateColor }}>
                                          {deliveryPreview && format(deliveryPreview.orderedDate, "d MMM", { locale: es })}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* Order Ready */}
                                {(() => {
                                  const ReadyIcon = getIconComponent(timelineStatuses.ready?.icon || 'package');
                                  return (
                                    <div className="flex flex-col items-center">
                                      <div 
                                        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg ring-4 ring-background"
                                        style={{ backgroundColor: `${progressIconBgColor}99` }}
                                      >
                                        <ReadyIcon className="h-5 w-5" style={{ color: progressIconColor }} />
                                      </div>
                                      <div className="mt-3 text-center">
                                        <p className="text-xs font-semibold" style={{ color: progressTitleColor }}>
                                          {timelineStatuses.ready?.title || 'Listo'}
                                        </p>
                                        <p className="text-[10px]" style={{ color: progressDateColor }}>
                                          {deliveryPreview && format(deliveryPreview.orderReadyMaxDate, "d MMM", { locale: es })}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* Delivered */}
                                {(() => {
                                  const DeliveredIcon = getIconComponent(timelineStatuses.delivered?.icon || 'map-pin');
                                  return (
                                    <div className="flex flex-col items-center">
                                      <div 
                                        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg ring-4 ring-background"
                                        style={{ backgroundColor: `${progressIconBgColor}66` }}
                                      >
                                        <DeliveredIcon className="h-5 w-5" style={{ color: progressIconColor }} />
                                      </div>
                                      <div className="mt-3 text-center">
                                        <p className="text-xs font-semibold" style={{ color: progressTitleColor }}>
                                          {timelineStatuses.delivered?.title || 'Entregado'}
                                        </p>
                                        <p className="text-[10px]" style={{ color: progressDateColor }}>
                                          {deliveryPreview && format(deliveryPreview.minDeliveryDate, "d", { locale: es })} - {deliveryPreview && format(deliveryPreview.maxDeliveryDate, "d MMM", { locale: es })}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* System Info */}
                      <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Hora actual:</span>
                          <span className="font-medium">{format(currentTime, "HH:mm:ss", { locale: es })}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Hora de corte:</span>
                          <span className="font-medium">{String(cutoffHour).padStart(2, '0')}:{String(cutoffMinute).padStart(2, '0')}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Estado:</span>
                          <Badge variant={deliveryPreview?.isPastCutoff ? "destructive" : "default"} className="text-[10px]">
                            {deliveryPreview?.isPastCutoff ? "Después del corte" : "Antes del corte"}
                          </Badge>
                        </div>
                        {deliveryPreview && !deliveryPreview.isPastCutoff && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Tiempo restante:</span>
                            <span className="font-medium text-primary font-mono">
                              {String(deliveryPreview.hoursRemaining).padStart(2, '0')}h {String(deliveryPreview.minutesRemaining).padStart(2, '0')}m {String(deliveryPreview.secondsRemaining).padStart(2, '0')}s
                            </span>
                          </div>
                        )}
                        <Separator className="my-2" />
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Modo preparación:</span>
                          <Badge variant="outline" className="text-[10px]">
                            {orderReadyCalcMode === 'minmax' ? 'Mín y Máx' : orderReadyCalcMode === 'min' ? 'Solo Mín' : 'Ninguno'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Días preparación:</span>
                          <span className="font-medium">
                            {orderReadyCalcMode === 'none' ? '0' : orderReadyCalcMode === 'min' ? `${deliveryPreview?.prepMinDays || 0}` : `${deliveryPreview?.prepMinDays || 0} - ${deliveryPreview?.prepMaxDays || 0}`} días
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Modo envío:</span>
                          <Badge variant="outline" className="text-[10px]">
                            {deliveryCalcMode === 'minmax' ? 'Mín y Máx' : deliveryCalcMode === 'min' ? 'Solo Mín' : 'Ninguno'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Días envío:</span>
                          <span className="font-medium">
                            {deliveryCalcMode === 'none' ? '0' : deliveryCalcMode === 'min' ? `${deliveryPreview?.shipMinDays || 0}` : `${deliveryPreview?.shipMinDays || 0} - ${deliveryPreview?.shipMaxDays || 0}`} días
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Días laborales:</span>
                          <span className="font-medium">{deliveryPreview?.workingDaysLabels || 'Ninguno'}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Formato fecha:</span>
                          <span className="font-medium">{DATE_FORMATS.find(f => f.value === dateFormat)?.example || dateFormat}</span>
                        </div>
                        {holidays.length > 0 && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Feriados:</span>
                            <span className="font-medium">{holidays.length} días</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-6">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Configuration Panel */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Appearance Sub-tabs */}
                  <div className="flex gap-1 bg-muted/50 p-1 rounded-lg flex-wrap">
                    {[
                      { id: 'layout', label: 'Diseño', icon: Layout },
                      { id: 'margins', label: 'Márgenes y Bordes', icon: Square },
                      { id: 'progress', label: 'Barra de Progreso', icon: Sparkles },
                      { id: 'modal', label: 'Modal de Países', icon: Globe },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setAppearanceSubTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                          appearanceSubTab === tab.id 
                            ? 'bg-background shadow-sm text-foreground' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Layout Configuration */}
                  {appearanceSubTab === 'layout' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Layout className="h-5 w-5 text-primary" />
                          Configuración de Diseño
                        </CardTitle>
                        <CardDescription>
                          Define cómo se mostrará el widget en tu tienda
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Widget Mode */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Modo del Widget</Label>
                          <RadioGroup
                            value={widgetMode}
                            onValueChange={(value) => setWidgetMode(value as typeof widgetMode)}
                            className="grid grid-cols-2 gap-3"
                          >
                            <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                              <RadioGroupItem value="message-bar" id="mode-message-bar" />
                              <Label htmlFor="mode-message-bar" className="cursor-pointer font-normal text-sm">
                                Mensaje + Barra de Progreso
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                              <RadioGroupItem value="bar-message" id="mode-bar-message" />
                              <Label htmlFor="mode-bar-message" className="cursor-pointer font-normal text-sm">
                                Barra + Mensaje
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                              <RadioGroupItem value="message-only" id="mode-message-only" />
                              <Label htmlFor="mode-message-only" className="cursor-pointer font-normal text-sm">
                                Solo Mensaje
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                              <RadioGroupItem value="bar-only" id="mode-bar-only" />
                              <Label htmlFor="mode-bar-only" className="cursor-pointer font-normal text-sm">
                                Solo Barra de Progreso
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <Separator />

                        {/* Widget Location */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Ubicación del Widget</Label>
                          <RadioGroup
                            value={widgetLocation}
                            onValueChange={(value) => setWidgetLocation(value as typeof widgetLocation)}
                            className="space-y-3"
                          >
                            <div className="flex items-start space-x-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                              <RadioGroupItem value="automatic" id="loc-automatic" className="mt-1" />
                              <div>
                                <Label htmlFor="loc-automatic" className="cursor-pointer font-normal">
                                  Automático
                                </Label>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Se insertará automáticamente debajo del botón de compra
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                              <RadioGroupItem value="manual" id="loc-manual" className="mt-1" />
                              <div className="flex-1">
                                <Label htmlFor="loc-manual" className="cursor-pointer font-normal">
                                  Manual
                                </Label>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Inserta este div donde quieras mostrar el widget
                                </p>
                                {widgetLocation === 'manual' && (
                                  <div className="mt-2 p-2 bg-muted rounded-md font-mono text-xs">
                                    <code>&lt;div id="delivery-widget"&gt;&lt;/div&gt;</code>
                                  </div>
                                )}
                              </div>
                            </div>
                          </RadioGroup>
                        </div>

                        <Separator />

                        {/* Widget Position */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Posición</Label>
                          <RadioGroup
                            value={widgetPosition}
                            onValueChange={(value) => setWidgetPosition(value as typeof widgetPosition)}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors flex-1">
                              <RadioGroupItem value="above" id="pos-above" />
                              <Label htmlFor="pos-above" className="cursor-pointer font-normal text-sm flex items-center gap-2">
                                <ChevronUp className="h-4 w-4" />
                                Arriba del botón
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors flex-1">
                              <RadioGroupItem value="below" id="pos-below" />
                              <Label htmlFor="pos-below" className="cursor-pointer font-normal text-sm flex items-center gap-2">
                                <ChevronDown className="h-4 w-4" />
                                Abajo del botón
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Margins & Borders Configuration */}
                  {appearanceSubTab === 'margins' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Square className="h-5 w-5 text-primary" />
                          Márgenes y Bordes
                        </CardTitle>
                        <CardDescription>
                          Ajusta los espaciados y estilos del borde del mensaje
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Margins */}
                        <div className="space-y-4">
                          <Label className="text-sm font-medium">Márgenes del Widget (px)</Label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Superior</Label>
                              <Input
                                type="number"
                                value={marginTop}
                                onChange={(e) => setMarginTop(Number(e.target.value))}
                                min={0}
                                max={100}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Derecho</Label>
                              <Input
                                type="number"
                                value={marginRight}
                                onChange={(e) => setMarginRight(Number(e.target.value))}
                                min={0}
                                max={100}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Inferior</Label>
                              <Input
                                type="number"
                                value={marginBottom}
                                onChange={(e) => setMarginBottom(Number(e.target.value))}
                                min={0}
                                max={100}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Izquierdo</Label>
                              <Input
                                type="number"
                                value={marginLeft}
                                onChange={(e) => setMarginLeft(Number(e.target.value))}
                                min={0}
                                max={100}
                              />
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Message Border Styles */}
                        <div className="space-y-4">
                          <Label className="text-sm font-medium">Estilo del Mensaje</Label>
                          
                          {/* Border Sub-tabs */}
                          <Tabs defaultValue="border" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="border">Borde</TabsTrigger>
                              <TabsTrigger value="color">Color</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="border" className="space-y-4 mt-4">
                              <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-xs text-muted-foreground">Ancho (px)</Label>
                                  <Input
                                    type="number"
                                    value={messageBorderWidth}
                                    onChange={(e) => setMessageBorderWidth(Number(e.target.value))}
                                    min={0}
                                    max={10}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs text-muted-foreground">Radio (px)</Label>
                                  <Input
                                    type="number"
                                    value={messageBorderRadius}
                                    onChange={(e) => setMessageBorderRadius(Number(e.target.value))}
                                    min={0}
                                    max={50}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs text-muted-foreground">Estilo</Label>
                                  <Select value={messageBorderStyle} onValueChange={(v) => setMessageBorderStyle(v as typeof messageBorderStyle)}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="solid">Sólido</SelectItem>
                                      <SelectItem value="dashed">Discontinuo</SelectItem>
                                      <SelectItem value="dotted">Punteado</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="color" className="space-y-4 mt-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-xs text-muted-foreground flex items-center gap-2">
                                    <Pipette className="h-3 w-3" />
                                    Color del Borde
                                  </Label>
                                  <div className="flex gap-2">
                                    <input
                                      type="color"
                                      value={messageBorderColor}
                                      onChange={(e) => setMessageBorderColor(e.target.value)}
                                      className="w-12 h-10 rounded cursor-pointer border"
                                    />
                                    <Input
                                      value={messageBorderColor}
                                      onChange={(e) => setMessageBorderColor(e.target.value)}
                                      className="flex-1 font-mono text-sm"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs text-muted-foreground flex items-center gap-2">
                                    <Pipette className="h-3 w-3" />
                                    Color de Fondo
                                  </Label>
                                  <div className="flex gap-2">
                                    <input
                                      type="color"
                                      value={messageBackgroundColor}
                                      onChange={(e) => setMessageBackgroundColor(e.target.value)}
                                      className="w-12 h-10 rounded cursor-pointer border"
                                    />
                                    <Input
                                      value={messageBackgroundColor}
                                      onChange={(e) => setMessageBackgroundColor(e.target.value)}
                                      className="flex-1 font-mono text-sm"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs text-muted-foreground flex items-center gap-2">
                                    <Type className="h-3 w-3" />
                                    Color del Texto
                                  </Label>
                                  <div className="flex gap-2">
                                    <input
                                      type="color"
                                      value={messageTextColor}
                                      onChange={(e) => setMessageTextColor(e.target.value)}
                                      className="w-12 h-10 rounded cursor-pointer border"
                                    />
                                    <Input
                                      value={messageTextColor}
                                      onChange={(e) => setMessageTextColor(e.target.value)}
                                      className="flex-1 font-mono text-sm"
                                    />
                                  </div>
                                </div>
                              </div>
                            </TabsContent>
                          </Tabs>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Progress Bar Style */}
                  {appearanceSubTab === 'progress' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Sparkles className="h-5 w-5 text-primary" />
                          Estilo de la Barra de Progreso
                        </CardTitle>
                        <CardDescription>
                          Personaliza los colores de la línea de tiempo
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Icon Color */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <Circle className="h-4 w-4" />
                              Color del Icono
                            </Label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={progressIconColor}
                                onChange={(e) => setProgressIconColor(e.target.value)}
                                className="w-12 h-10 rounded cursor-pointer border"
                              />
                              <Input
                                value={progressIconColor}
                                onChange={(e) => setProgressIconColor(e.target.value)}
                                className="flex-1 font-mono text-sm"
                              />
                            </div>
                          </div>

                          {/* Icon Background Color */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <Circle className="h-4 w-4 fill-current" />
                              Fondo del Icono
                            </Label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={progressIconBgColor}
                                onChange={(e) => setProgressIconBgColor(e.target.value)}
                                className="w-12 h-10 rounded cursor-pointer border"
                              />
                              <Input
                                value={progressIconBgColor}
                                onChange={(e) => setProgressIconBgColor(e.target.value)}
                                className="flex-1 font-mono text-sm"
                              />
                            </div>
                          </div>

                          {/* Title Color */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <Type className="h-4 w-4" />
                              Color del Título de Estado
                            </Label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={progressTitleColor}
                                onChange={(e) => setProgressTitleColor(e.target.value)}
                                className="w-12 h-10 rounded cursor-pointer border"
                              />
                              <Input
                                value={progressTitleColor}
                                onChange={(e) => setProgressTitleColor(e.target.value)}
                                className="flex-1 font-mono text-sm"
                              />
                            </div>
                          </div>

                          {/* Date Color */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Color de la Fecha
                            </Label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={progressDateColor}
                                onChange={(e) => setProgressDateColor(e.target.value)}
                                className="w-12 h-10 rounded cursor-pointer border"
                              />
                              <Input
                                value={progressDateColor}
                                onChange={(e) => setProgressDateColor(e.target.value)}
                                className="flex-1 font-mono text-sm"
                              />
                            </div>
                          </div>

                          {/* Line Color */}
                          <div className="space-y-2 md:col-span-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <Move className="h-4 w-4" />
                              Color de la Línea de Progreso
                            </Label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={progressLineColor}
                                onChange={(e) => setProgressLineColor(e.target.value)}
                                className="w-12 h-10 rounded cursor-pointer border"
                              />
                              <Input
                                value={progressLineColor}
                                onChange={(e) => setProgressLineColor(e.target.value)}
                                className="flex-1 font-mono text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Country Modal Configuration */}
                  {appearanceSubTab === 'modal' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Globe className="h-5 w-5 text-primary" />
                          Configuración del Modal de Países
                        </CardTitle>
                        <CardDescription>
                          Personaliza el popup que muestra opciones de país
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Display Mode & Arrow Position */}
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">Modo de Visualización</Label>
                            <RadioGroup
                              value={modalDisplayMode}
                              onValueChange={(v) => setModalDisplayMode(v as typeof modalDisplayMode)}
                              className="flex gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="popup" id="modal-popup" />
                                <Label htmlFor="modal-popup" className="cursor-pointer font-normal text-sm">
                                  Popup
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="dropdown" id="modal-dropdown" />
                                <Label htmlFor="modal-dropdown" className="cursor-pointer font-normal text-sm">
                                  Dropdown
                                </Label>
                              </div>
                            </RadioGroup>
                          </div>

                          <div className="space-y-3">
                            <Label className="text-sm font-medium">Posición de la Flecha</Label>
                            <RadioGroup
                              value={modalArrowPosition}
                              onValueChange={(v) => setModalArrowPosition(v as typeof modalArrowPosition)}
                              className="flex gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="left" id="arrow-left" />
                                <Label htmlFor="arrow-left" className="cursor-pointer font-normal text-sm">
                                  Izquierda
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="center" id="arrow-center" />
                                <Label htmlFor="arrow-center" className="cursor-pointer font-normal text-sm">
                                  Centro
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="right" id="arrow-right" />
                                <Label htmlFor="arrow-right" className="cursor-pointer font-normal text-sm">
                                  Derecha
                                </Label>
                              </div>
                            </RadioGroup>
                          </div>
                        </div>

                        <Separator />

                        {/* Modal Style Tabs */}
                        <Tabs defaultValue="modal-color" className="w-full">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="modal-color">Color</TabsTrigger>
                            <TabsTrigger value="modal-border">Borde</TabsTrigger>
                            <TabsTrigger value="modal-font">Fuente</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="modal-color" className="space-y-4 mt-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Color de Fondo</Label>
                                <div className="flex gap-2">
                                  <input
                                    type="color"
                                    value={modalBackgroundColor}
                                    onChange={(e) => setModalBackgroundColor(e.target.value)}
                                    className="w-12 h-10 rounded cursor-pointer border"
                                  />
                                  <Input
                                    value={modalBackgroundColor}
                                    onChange={(e) => setModalBackgroundColor(e.target.value)}
                                    className="flex-1 font-mono text-sm"
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Opacidad del Fondo (%)</Label>
                                <div className="flex items-center gap-4">
                                  <Slider
                                    value={[modalBackgroundOpacity]}
                                    onValueChange={([value]) => setModalBackgroundOpacity(value)}
                                    min={0}
                                    max={100}
                                    step={5}
                                    className="flex-1"
                                  />
                                  <span className="text-sm font-medium w-12 text-right">{modalBackgroundOpacity}%</span>
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="modal-border" className="space-y-4 mt-4">
                            <div className="grid md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Ancho (px)</Label>
                                <Input
                                  type="number"
                                  value={modalBorderWidth}
                                  onChange={(e) => setModalBorderWidth(Number(e.target.value))}
                                  min={0}
                                  max={10}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Radio (px)</Label>
                                <Input
                                  type="number"
                                  value={modalBorderRadius}
                                  onChange={(e) => setModalBorderRadius(Number(e.target.value))}
                                  min={0}
                                  max={30}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Color del Borde</Label>
                                <div className="flex gap-2">
                                  <input
                                    type="color"
                                    value={modalBorderColor}
                                    onChange={(e) => setModalBorderColor(e.target.value)}
                                    className="w-12 h-10 rounded cursor-pointer border"
                                  />
                                  <Input
                                    value={modalBorderColor}
                                    onChange={(e) => setModalBorderColor(e.target.value)}
                                    className="flex-1 font-mono text-sm"
                                  />
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="modal-font" className="space-y-4 mt-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Tamaño de Fuente (px)</Label>
                                <Input
                                  type="number"
                                  value={modalFontSize}
                                  onChange={(e) => setModalFontSize(Number(e.target.value))}
                                  min={10}
                                  max={24}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Color del Texto</Label>
                                <div className="flex gap-2">
                                  <input
                                    type="color"
                                    value={modalTextColor}
                                    onChange={(e) => setModalTextColor(e.target.value)}
                                    className="w-12 h-10 rounded cursor-pointer border"
                                  />
                                  <Input
                                    value={modalTextColor}
                                    onChange={(e) => setModalTextColor(e.target.value)}
                                    className="flex-1 font-mono text-sm"
                                  />
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>

                        {/* Modal Preview */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Vista Previa del Modal</Label>
                          <div 
                            className="p-4 relative"
                            style={{
                              backgroundColor: `${modalBackgroundColor}${Math.round(modalBackgroundOpacity * 2.55).toString(16).padStart(2, '0')}`,
                              borderWidth: `${modalBorderWidth}px`,
                              borderRadius: `${modalBorderRadius}px`,
                              borderColor: modalBorderColor,
                              borderStyle: 'solid',
                            }}
                          >
                            {/* Arrow */}
                            <div 
                              className={`absolute -top-2 w-4 h-4 rotate-45 ${
                                modalArrowPosition === 'left' ? 'left-4' : 
                                modalArrowPosition === 'right' ? 'right-4' : 'left-1/2 -translate-x-1/2'
                              }`}
                              style={{
                                backgroundColor: modalBackgroundColor,
                                borderLeft: `${modalBorderWidth}px solid ${modalBorderColor}`,
                                borderTop: `${modalBorderWidth}px solid ${modalBorderColor}`,
                              }}
                            />
                            <div className="space-y-2">
                              {['🇦🇷 Argentina', '🇨🇱 Chile', '🇲🇽 México', '🇨🇴 Colombia'].map((country) => (
                                <div 
                                  key={country}
                                  className="px-3 py-2 rounded hover:bg-black/5 cursor-pointer transition-colors"
                                  style={{ fontSize: `${modalFontSize}px`, color: modalTextColor }}
                                >
                                  {country}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Sticky Preview */}
                <div className="lg:sticky lg:top-6 h-fit">
                  <Card className="border-2 border-primary/20 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Eye className="h-5 w-5 text-primary" />
                        Vista Previa del Widget
                      </CardTitle>
                      <CardDescription>
                        Vista previa en tiempo real de cómo verán tus clientes el widget
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {/* Widget Preview with applied styles */}
                      <div 
                        className="space-y-4"
                        style={{
                          marginTop: `${marginTop}px`,
                          marginRight: `${marginRight}px`,
                          marginBottom: `${marginBottom}px`,
                          marginLeft: `${marginLeft}px`,
                        }}
                      >
                        {/* Message + Bar or Bar + Message based on widgetMode */}
                        {(widgetMode === 'message-bar' || widgetMode === 'message-only') && (
                          <div 
                            className="p-4"
                            style={{
                              borderWidth: `${messageBorderWidth}px`,
                              borderRadius: `${messageBorderRadius}px`,
                              borderStyle: messageBorderStyle,
                              borderColor: messageBorderColor,
                              backgroundColor: messageBackgroundColor,
                              color: messageTextColor,
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div 
                                className="rounded-full p-2.5 shrink-0"
                                style={{ backgroundColor: `${progressIconBgColor}20` }}
                              >
                                <Truck className="h-5 w-5" style={{ color: progressIconBgColor }} />
                              </div>
                              <p className="text-sm font-medium leading-relaxed">
                                {previewMessage}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Timeline Visual */}
                        {(widgetMode !== 'message-only') && (
                          <div className="space-y-4">
                            <div className="relative">
                              {/* Timeline Line */}
                              <div 
                                className="absolute top-6 left-6 right-6 h-0.5"
                                style={{ background: `linear-gradient(to right, ${progressLineColor}, ${progressLineColor}80, ${progressLineColor}60)` }}
                              />
                              
                              {/* Timeline Steps */}
                              <div className="relative flex justify-between">
                                {/* Ordered */}
                                {(() => {
                                  const OrderedIcon = getIconComponent(timelineStatuses.ordered?.icon || 'shopping-bag');
                                  return (
                                    <div className="flex flex-col items-center">
                                      <div 
                                        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg ring-4 ring-background"
                                        style={{ backgroundColor: progressIconBgColor }}
                                      >
                                        <OrderedIcon className="h-5 w-5" style={{ color: progressIconColor }} />
                                      </div>
                                      <div className="mt-3 text-center">
                                        <p className="text-xs font-semibold" style={{ color: progressTitleColor }}>
                                          {timelineStatuses.ordered?.title || 'Pedido'}
                                        </p>
                                        <p className="text-[10px]" style={{ color: progressDateColor }}>
                                          {deliveryPreview && format(deliveryPreview.orderedDate, "d MMM", { locale: es })}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* Order Ready */}
                                {(() => {
                                  const ReadyIcon = getIconComponent(timelineStatuses.ready?.icon || 'package');
                                  return (
                                    <div className="flex flex-col items-center">
                                      <div 
                                        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg ring-4 ring-background"
                                        style={{ backgroundColor: `${progressIconBgColor}99` }}
                                      >
                                        <ReadyIcon className="h-5 w-5" style={{ color: progressIconColor }} />
                                      </div>
                                      <div className="mt-3 text-center">
                                        <p className="text-xs font-semibold" style={{ color: progressTitleColor }}>
                                          {timelineStatuses.ready?.title || 'Preparado'}
                                        </p>
                                        <p className="text-[10px]" style={{ color: progressDateColor }}>
                                          {deliveryPreview && format(deliveryPreview.orderReadyMaxDate, "d MMM", { locale: es })}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* Delivered */}
                                {(() => {
                                  const DeliveredIcon = getIconComponent(timelineStatuses.delivered?.icon || 'map-pin');
                                  return (
                                    <div className="flex flex-col items-center">
                                      <div 
                                        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg ring-4 ring-background"
                                        style={{ backgroundColor: `${progressIconBgColor}66` }}
                                      >
                                        <DeliveredIcon className="h-5 w-5" style={{ color: progressIconColor }} />
                                      </div>
                                      <div className="mt-3 text-center">
                                        <p className="text-xs font-semibold" style={{ color: progressTitleColor }}>
                                          {timelineStatuses.delivered?.title || 'Entregado'}
                                        </p>
                                        <p className="text-[10px]" style={{ color: progressDateColor }}>
                                          {deliveryPreview && format(deliveryPreview.minDeliveryDate, "d", { locale: es })} - {deliveryPreview && format(deliveryPreview.maxDeliveryDate, "d MMM", { locale: es })}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Bar + Message (inverted order) */}
                        {widgetMode === 'bar-message' && (
                          <div 
                            className="p-4"
                            style={{
                              borderWidth: `${messageBorderWidth}px`,
                              borderRadius: `${messageBorderRadius}px`,
                              borderStyle: messageBorderStyle,
                              borderColor: messageBorderColor,
                              backgroundColor: messageBackgroundColor,
                              color: messageTextColor,
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div 
                                className="rounded-full p-2.5 shrink-0"
                                style={{ backgroundColor: `${progressIconBgColor}20` }}
                              >
                                <Truck className="h-5 w-5" style={{ color: progressIconBgColor }} />
                              </div>
                              <p className="text-sm font-medium leading-relaxed">
                                {previewMessage}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configuración Avanzada</CardTitle>
                  <CardDescription>
                    Opciones avanzadas para usuarios experimentados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <div className="text-center space-y-2">
                      <Settings2 className="h-12 w-12 mx-auto opacity-50" />
                      <p>Configuración avanzada próximamente</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Other Tab */}
            <TabsContent value="other" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Otras Opciones</CardTitle>
                  <CardDescription>
                    Configuraciones adicionales del widget
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <div className="text-center space-y-2">
                      <MoreHorizontal className="h-12 w-12 mx-auto opacity-50" />
                      <p>Más opciones próximamente</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Product Configuration Tab */}
        <TabsContent value="product" className="space-y-6">
          <ProductTab 
            storeId={storeId}
            globalSettings={{
              shippingMinDays: settings.shipping_min_days,
              shippingMaxDays: settings.shipping_max_days,
              preparationMinDays: settings.preparation_min_days,
              preparationMaxDays: settings.preparation_max_days,
              workingDays: settings.working_days,
              cutoffTime: settings.cutoff_time,
            }}
            appearanceSettings={{
              messageBorderWidth,
              messageBorderRadius,
              messageBorderStyle,
              messageBorderColor,
              messageBackgroundColor,
              messageTextColor,
              progressIconColor,
              progressIconBgColor,
              progressTitleColor,
              progressDateColor,
              progressLineColor,
            }}
          />
        </TabsContent>

        {/* Category Tab */}
        <TabsContent value="category" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración por Categoría</CardTitle>
              <CardDescription>
                Define tiempos de entrega por categoría de productos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <div className="text-center space-y-2">
                  <FolderTree className="h-12 w-12 mx-auto opacity-50" />
                  <p>Configuración de categorías próximamente</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Planes y Precios</CardTitle>
              <CardDescription>
                Elige el plan que mejor se adapte a tus necesidades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <div className="text-center space-y-2">
                  <CreditCard className="h-12 w-12 mx-auto opacity-50" />
                  <p>Planes y precios próximamente</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAQs Tab */}
        <TabsContent value="faqs" className="space-y-6">
          <FAQsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
