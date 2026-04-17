import { useState } from 'react';
import {
  Box, Card, Title, Text, Checkbox, Select, Spinner, Alert, Tag,
} from '@nimbus-ds/components';
import { RedoIcon } from '@nimbus-ds/icons';
import { supabase } from '@/integrations/supabase/client';
import { useSyncSettings } from '@/hooks/useSyncSettings';
import { ProgressButton } from '@/components/ProgressButton';
import { FieldHelp } from '@/components/FieldHelp';
import { toast } from 'sonner';

interface Props { storeId: string }

export function SyncStockView({ storeId }: Props) {
  const { settings, saving, save } = useSyncSettings(storeId);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [lastResult, setLastResult] = useState<{ updated: number; errors: number; total: number } | null>(null);

  const runSync = async () => {
    setRunning(true);
    setLastResult(null);
    setProgress({ current: 0, total: 0 });
    try {
      const { data, error } = await supabase.functions.invoke('sync-stock-run', { body: { storeId } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setProgress({ current: data.total || 0, total: data.total || 0 });
      setLastResult({ updated: data.updated, errors: data.errors, total: data.total });
      toast.success(`Sincronización completa: ${data.updated} actualizados, ${data.errors} errores`);
    } catch (e: any) {
      toast.error(e?.message || 'Error en la sincronización de stock');
    } finally {
      setRunning(false);
      setTimeout(() => setProgress(null), 800);
    }
  };

  if (!settings) {
    return <Box display="flex" justifyContent="center" padding="6"><Spinner /></Box>;
  }

  return (
    <Box display="flex" flexDirection="column" gap="4">
      <Card>
        <Card.Header>
          <Title as="h4" fontSize="h5">Configuración de stock</Title>
        </Card.Header>
        <Card.Body>
          <Box display="flex" flexDirection="column" gap="3">
            <Box display="flex" alignItems="center" gap="2">
              <Checkbox
                name="stock_enabled"
                label="Activar sincronización de stock"
                checked={settings.stock_enabled}
                onChange={(e) => save({ stock_enabled: e.target.checked })}
              />
              <FieldHelp help="Habilita el motor de sincronización de inventario entre Zoho y Tiendanube. Cuando está activo, podrá ejecutar sincronizaciones manuales y, próximamente, automáticas. Si lo desactiva, ningún cambio de stock será replicado entre las plataformas." />
            </Box>

            <Box>
              <Box display="flex" alignItems="center" gap="2">
                <Text fontWeight="medium">Dirección de sincronización</Text>
                <FieldHelp help="Define hacia dónde fluyen los cambios de inventario. 'Zoho → Tiendanube' es lo recomendado si gestiona el stock en Zoho (es la fuente de verdad). 'Tiendanube → Zoho' si las ventas online actualizan Zoho. 'Bidireccional' sincroniza en ambos sentidos, pero requiere definir una prioridad para resolver conflictos." />
              </Box>
              <Select
                id="stock_direction"
                name="stock_direction"
                value={settings.stock_direction}
                onChange={(e) => save({ stock_direction: e.target.value as any })}
                disabled={!settings.stock_enabled}
              >
                <Select.Option value="zoho_to_tn" label="Zoho → Tiendanube (Zoho como fuente principal)" />
                <Select.Option value="tn_to_zoho" label="Tiendanube → Zoho" />
                <Select.Option value="bidirectional" label="Bidireccional" />
              </Select>
            </Box>

            {settings.stock_direction === 'bidirectional' && (
              <Box>
                <Box display="flex" alignItems="center" gap="2">
                  <Text fontWeight="medium">Prioridad en caso de conflicto</Text>
                  <FieldHelp help="Cuando un mismo producto tiene cantidades diferentes en Zoho y Tiendanube al momento de sincronizar, esta opción decide cuál valor prevalece. Elija la plataforma donde gestiona habitualmente el inventario para evitar sobrescribir datos correctos." />
                </Box>
                <Select
                  id="stock_priority"
                  name="stock_priority"
                  value={settings.stock_priority}
                  onChange={(e) => save({ stock_priority: e.target.value as any })}
                  disabled={!settings.stock_enabled}
                >
                  <Select.Option value="zoho" label="Zoho" />
                  <Select.Option value="tiendanube" label="Tiendanube" />
                </Select>
              </Box>
            )}

            {saving && <Text fontSize="caption" color="neutral-textLow">Guardando…</Text>}
          </Box>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
            <Title as="h4" fontSize="h5">Ejecutar sincronización</Title>
            <ProgressButton
              onClick={runSync}
              loading={running}
              progress={progress}
              disabled={!settings.stock_enabled}
              icon={<RedoIcon />}
              loadingLabel="Sincronizando"
            >
              Sincronizar ahora
            </ProgressButton>
          </Box>
        </Card.Header>
        <Card.Body>
          <Text>
            Recorre todos los productos vinculados en el módulo "Productos" y ajusta el stock según la dirección configurada.
          </Text>
          {lastResult && (
            <Box marginTop="3" display="flex" gap="2" flexWrap="wrap">
              <Tag appearance="primary">Total: {lastResult.total}</Tag>
              <Tag appearance="success">Actualizados: {lastResult.updated}</Tag>
              <Tag appearance={lastResult.errors > 0 ? 'danger' : 'neutral'}>Errores: {lastResult.errors}</Tag>
            </Box>
          )}
        </Card.Body>
      </Card>

      <Alert appearance="warning" title="Importante">
        <Text>
          Para sincronizar stock, primero debes vincular productos en el módulo "Productos".
          El sistema utiliza el SKU como clave de mapeo entre las dos plataformas.
        </Text>
      </Alert>
    </Box>
  );
}
