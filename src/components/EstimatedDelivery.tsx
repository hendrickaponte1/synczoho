import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Loader2, Package, Truck, Clock, Calendar, Eye, Info, Power } from 'lucide-react';
import { useDeliverySettings } from '@/hooks/useDeliverySettings';
import { format, addDays, setHours, setMinutes, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface EstimatedDeliveryProps {
  storeId: string | undefined;
  userId: string | undefined;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
];

// Variables disponibles en español
const AVAILABLE_VARIABLES = [
  { variable: '{fecha_entrega_minima}', description: 'Fecha más temprana de entrega (ej: lunes 20)' },
  { variable: '{fecha_entrega_maxima}', description: 'Fecha más tardía de entrega (ej: viernes 24 de enero)' },
  { variable: '{horas_restantes}', description: 'Horas hasta la hora de corte' },
  { variable: '{minutos_restantes}', description: 'Minutos hasta la hora de corte' },
  { variable: '{hora_corte}', description: 'Hora de corte configurada (ej: 14:00)' },
  { variable: '{dias_preparacion_min}', description: 'Días mínimos de preparación' },
  { variable: '{dias_preparacion_max}', description: 'Días máximos de preparación' },
  { variable: '{dias_envio_min}', description: 'Días mínimos de envío' },
  { variable: '{dias_envio_max}', description: 'Días máximos de envío' },
  { variable: '{dias_laborales}', description: 'Lista de días laborales (ej: Lun-Vie)' },
];

export function EstimatedDelivery({ storeId, userId }: EstimatedDeliveryProps) {
  const { settings, loading, saving, saveSettings, updateSettings } = useDeliverySettings(storeId, userId);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for live preview (more responsive)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSave = () => {
    if (settings) {
      saveSettings(settings);
    }
  };

  const toggleWorkingDay = (day: number) => {
    if (!settings) return;
    const newDays = settings.working_days.includes(day)
      ? settings.working_days.filter(d => d !== day)
      : [...settings.working_days, day].sort((a, b) => a - b);
    updateSettings({ working_days: newDays });
  };

  // Validation: max days cannot be less than min days
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

  // Calculate delivery estimate for live preview
  const deliveryPreview = useMemo(() => {
    if (!settings) return null;

    const now = currentTime;
    const [cutoffHour, cutoffMinute] = settings.cutoff_time.split(':').map(Number);
    const cutoffToday = setMinutes(setHours(new Date(now), cutoffHour), cutoffMinute);
    
    // Calculate time remaining until cutoff
    const minutesUntilCutoff = differenceInMinutes(cutoffToday, now);
    const isPastCutoff = minutesUntilCutoff <= 0;
    
    let hoursRemaining = 0;
    let minutesRemaining = 0;
    
    if (!isPastCutoff) {
      hoursRemaining = Math.floor(minutesUntilCutoff / 60);
      minutesRemaining = minutesUntilCutoff % 60;
    }

    // Calculate delivery dates
    const getNextWorkingDay = (startDate: Date, daysToAdd: number): Date => {
      let currentDate = new Date(startDate);
      let addedDays = 0;
      
      // If no working days, return the same date plus days
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

    // If past cutoff, add 1 extra day to preparation
    const extraDay = isPastCutoff ? 1 : 0;
    const prepDaysMin = settings.preparation_min_days + extraDay;
    const prepDaysMax = settings.preparation_max_days + extraDay;

    const totalMinDays = prepDaysMin + settings.shipping_min_days;
    const totalMaxDays = prepDaysMax + settings.shipping_max_days;

    const minDeliveryDate = getNextWorkingDay(now, totalMinDays);
    const maxDeliveryDate = getNextWorkingDay(now, totalMaxDays);

    // Format working days for display
    const workingDaysLabels = settings.working_days
      .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
      .map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label.slice(0, 3))
      .filter(Boolean)
      .join(', ');

    return {
      isPastCutoff,
      hoursRemaining,
      minutesRemaining,
      minDeliveryDate,
      maxDeliveryDate,
      cutoffTime: settings.cutoff_time.slice(0, 5),
      prepMinDays: settings.preparation_min_days,
      prepMaxDays: settings.preparation_max_days,
      shipMinDays: settings.shipping_min_days,
      shipMaxDays: settings.shipping_max_days,
      workingDaysLabels: workingDaysLabels || 'Ninguno',
    };
  }, [settings, currentTime]);

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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold">Entrega Estimada</h2>
          <p className="text-muted-foreground">
            Configura los tiempos de entrega para tus clientes
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Widget Enable/Disable Switch */}
          <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-2">
            <div className="flex items-center gap-2">
              <Power className={`h-4 w-4 ${settings.widget_enabled ? 'text-green-500' : 'text-muted-foreground'}`} />
              <Label htmlFor="widget-enabled" className="text-sm font-medium cursor-pointer whitespace-nowrap">
                {settings.widget_enabled ? 'Widget activo' : 'Widget inactivo'}
              </Label>
            </div>
            <Switch
              id="widget-enabled"
              checked={settings.widget_enabled}
              onCheckedChange={(checked) => updateSettings({ widget_enabled: checked })}
            />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar cambios
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Configuration Cards */}
        <div className="space-y-6">
          {/* Preparation Time - First in natural flow */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5 text-primary" />
                1. Tiempo de preparación
              </CardTitle>
              <CardDescription>
                ¿Cuántos días tardas en preparar un pedido?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Label htmlFor="prep-min">Mínimo (días)</Label>
                  <Input
                    id="prep-min"
                    type="number"
                    min={0}
                    max={settings.preparation_max_days}
                    value={settings.preparation_min_days}
                    onChange={(e) => handlePreparationMinChange(parseInt(e.target.value) || 0)}
                  />
                </div>
                <span className="text-muted-foreground mt-6">a</span>
                <div className="flex-1">
                  <Label htmlFor="prep-max">Máximo (días)</Label>
                  <Input
                    id="prep-max"
                    type="number"
                    min={settings.preparation_min_days}
                    max={30}
                    value={settings.preparation_max_days}
                    onChange={(e) => handlePreparationMaxChange(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              {settings.preparation_max_days < settings.preparation_min_days && (
                <p className="text-xs text-destructive mt-2">
                  El máximo no puede ser menor al mínimo
                </p>
              )}
            </CardContent>
          </Card>

          {/* Shipping Time - Second in natural flow */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Truck className="h-5 w-5 text-primary" />
                2. Tiempo de envío
              </CardTitle>
              <CardDescription>
                ¿Cuántos días tarda el transportista en entregar?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Label htmlFor="ship-min">Mínimo (días)</Label>
                  <Input
                    id="ship-min"
                    type="number"
                    min={0}
                    max={settings.shipping_max_days}
                    value={settings.shipping_min_days}
                    onChange={(e) => handleShippingMinChange(parseInt(e.target.value) || 0)}
                  />
                </div>
                <span className="text-muted-foreground mt-6">a</span>
                <div className="flex-1">
                  <Label htmlFor="ship-max">Máximo (días)</Label>
                  <Input
                    id="ship-max"
                    type="number"
                    min={settings.shipping_min_days}
                    max={30}
                    value={settings.shipping_max_days}
                    onChange={(e) => handleShippingMaxChange(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              {settings.shipping_max_days < settings.shipping_min_days && (
                <p className="text-xs text-destructive mt-2">
                  El máximo no puede ser menor al mínimo
                </p>
              )}
            </CardContent>
          </Card>

          {/* Cutoff Time */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-primary" />
                3. Hora de corte
              </CardTitle>
              <CardDescription>
                Pedidos después de esta hora suman un día extra de preparación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                type="time"
                value={settings.cutoff_time.slice(0, 5)}
                onChange={(e) => updateSettings({ cutoff_time: e.target.value + ':00' })}
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* Working Days */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-primary" />
                4. Días laborales
              </CardTitle>
              <CardDescription>
                ¿Qué días de la semana trabaja tu tienda?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day.value}`}
                      checked={settings.working_days.includes(day.value)}
                      onCheckedChange={() => toggleWorkingDay(day.value)}
                    />
                    <Label
                      htmlFor={`day-${day.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Available Variables */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info className="h-5 w-5 text-primary" />
                Variables disponibles
              </CardTitle>
              <CardDescription>
                Usa estas variables en tus mensajes personalizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <TooltipProvider>
                  {AVAILABLE_VARIABLES.map((v) => (
                    <Tooltip key={v.variable}>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted cursor-help">
                          <code className="text-xs font-mono text-primary">{v.variable}</code>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[200px]">
                        <p className="text-xs">{v.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview */}
        <div className="md:sticky md:top-6 h-fit">
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Vista previa en vivo
              </CardTitle>
              <CardDescription>
                Así verán tus clientes el mensaje de entrega
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deliveryPreview && (
                <div className="rounded-lg border bg-card p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Truck className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      {!deliveryPreview.isPastCutoff ? (
                        <p className="text-sm font-medium text-foreground">
                          🚀 Pídelo en las próximas{' '}
                          <span className="text-primary font-bold">
                            {deliveryPreview.hoursRemaining}h {deliveryPreview.minutesRemaining}min
                          </span>{' '}
                          y recíbelo entre el{' '}
                          <span className="font-semibold">
                            {format(deliveryPreview.minDeliveryDate, "EEEE d", { locale: es })}
                          </span>{' '}
                          y el{' '}
                          <span className="font-semibold">
                            {format(deliveryPreview.maxDeliveryDate, "EEEE d 'de' MMMM", { locale: es })}
                          </span>
                        </p>
                      ) : (
                        <p className="text-sm font-medium text-foreground">
                          📦 Recíbelo entre el{' '}
                          <span className="font-semibold">
                            {format(deliveryPreview.minDeliveryDate, "EEEE d", { locale: es })}
                          </span>{' '}
                          y el{' '}
                          <span className="font-semibold">
                            {format(deliveryPreview.maxDeliveryDate, "EEEE d 'de' MMMM", { locale: es })}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Live variable values */}
              {deliveryPreview && (
                <div className="mt-4 rounded-md bg-muted/50 p-3 text-xs space-y-2">
                  <p className="font-medium text-foreground mb-2">Valores actuales de las variables:</p>
                  <div className="grid gap-1.5">
                    <div className="flex justify-between">
                      <code className="text-primary">{'{fecha_entrega_minima}'}</code>
                      <span>{format(deliveryPreview.minDeliveryDate, "EEEE d", { locale: es })}</span>
                    </div>
                    <div className="flex justify-between">
                      <code className="text-primary">{'{fecha_entrega_maxima}'}</code>
                      <span>{format(deliveryPreview.maxDeliveryDate, "EEEE d 'de' MMMM", { locale: es })}</span>
                    </div>
                    <div className="flex justify-between">
                      <code className="text-primary">{'{horas_restantes}'}</code>
                      <span>{deliveryPreview.hoursRemaining}h</span>
                    </div>
                    <div className="flex justify-between">
                      <code className="text-primary">{'{minutos_restantes}'}</code>
                      <span>{deliveryPreview.minutesRemaining}min</span>
                    </div>
                    <div className="flex justify-between">
                      <code className="text-primary">{'{hora_corte}'}</code>
                      <span>{deliveryPreview.cutoffTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <code className="text-primary">{'{dias_preparacion_min}'}</code>
                      <span>{deliveryPreview.prepMinDays}</span>
                    </div>
                    <div className="flex justify-between">
                      <code className="text-primary">{'{dias_preparacion_max}'}</code>
                      <span>{deliveryPreview.prepMaxDays}</span>
                    </div>
                    <div className="flex justify-between">
                      <code className="text-primary">{'{dias_envio_min}'}</code>
                      <span>{deliveryPreview.shipMinDays}</span>
                    </div>
                    <div className="flex justify-between">
                      <code className="text-primary">{'{dias_envio_max}'}</code>
                      <span>{deliveryPreview.shipMaxDays}</span>
                    </div>
                    <div className="flex justify-between">
                      <code className="text-primary">{'{dias_laborales}'}</code>
                      <span>{deliveryPreview.workingDaysLabels}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                <p className="font-medium mb-1">Hora actual del sistema:</p>
                <p>{format(currentTime, "EEEE d 'de' MMMM, HH:mm:ss", { locale: es })}</p>
                <p className="mt-2">
                  <span className="font-medium">Hora de corte:</span> {settings.cutoff_time.slice(0, 5)}
                  {deliveryPreview?.isPastCutoff && (
                    <span className="ml-2 text-amber-600">(Pasada - +1 día)</span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}