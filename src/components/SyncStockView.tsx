import { useState } from 'react';
import {
  Box, Card, Title, Text, Checkbox, Select, Spinner, Alert, Tag, Table, Button, Skeleton,
} from '@nimbus-ds/components';
import { RedoIcon, EyeIcon, SearchIcon } from '@nimbus-ds/icons';
import { supabase } from '@/integrations/supabase/client';
import { useSyncSettings } from '@/hooks/useSyncSettings';
import { ProgressButton } from '@/components/ProgressButton';
import { FieldHelp } from '@/components/FieldHelp';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { toast } from 'sonner';

interface Props { storeId: string }

interface PreviewItem {
  sku: string;
  from: number;
  to: number;
  target: 'tn' | 'zoho';
  dry_run?: boolean;
}

interface PricePreviewItem {
  sku: string;
  tn_price: number;
  new_price: number;
  tn_promo: number | null;
  new_promo: number | null;
  dry_run?: boolean;
}

export function SyncStockView({ storeId }: Props) {
  const { settings, saving, save } = useSyncSettings(storeId);
  const [running, setRunning] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [lastResult, setLastResult] = useState<{ updated: number; errors: number; total: number; inSync: number } | null>(null);
  const [previewResult, setPreviewResult] = useState<{
    total: number; updated: number; inSync: number; unmatched: number; details: PreviewItem[];
  } | null>(null);

  // Price sync state
  const [priceRunning, setPriceRunning] = useState(false);
  const [pricePreviewing, setPricePreviewing] = useState(false);
  const [showPriceConfirm, setShowPriceConfirm] = useState(false);
  const [priceLastResult, setPriceLastResult] = useState<{ updated: number; errors: number; total: number; inSync: number } | null>(null);
  const [pricePreviewResult, setPricePreviewResult] = useState<{
    total: number; toUpdate: number; inSync: number; unmatched: number; details: PricePreviewItem[];
  } | null>(null);

  const runPreview = async () => {
    setPreviewing(true);
    setPreviewResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('sync-stock-run', {
        body: { storeId, dryRun: true },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPreviewResult({
        total: data.total,
        updated: data.updated,
        inSync: data.inSync,
        unmatched: data.unmatched,
        details: (data.details || []).filter((d: any) => d.dry_run),
      });
      toast.success(`Vista previa lista: ${data.updated} cambios pendientes`);
    } catch (e: any) {
      toast.error(e?.message || 'Error al generar la vista previa');
    } finally {
      setPreviewing(false);
    }
  };

  const runSync = async () => {
    setRunning(true);
    setLastResult(null);
    setPreviewResult(null);
    setProgress({ current: 0, total: 0 });
    try {
      const { data, error } = await supabase.functions.invoke('sync-stock-run', { body: { storeId } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setProgress({ current: data.total || 0, total: data.total || 0 });
      setLastResult({ updated: data.updated, errors: data.errors, total: data.total, inSync: data.inSync });
      toast.success(`Sincronización completa: ${data.updated} actualizados, ${data.errors} errores`);
    } catch (e: any) {
      toast.error(e?.message || 'Error en la sincronización de stock');
    } finally {
      setRunning(false);
      setTimeout(() => setProgress(null), 800);
    }
  };

  const runPricePreview = async () => {
    setPricePreviewing(true);
    setPricePreviewResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('sync-prices-run', {
        body: { storeId, dryRun: true },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPricePreviewResult({
        total: data.total,
        toUpdate: data.to_update,
        inSync: data.in_sync,
        unmatched: data.unmatched,
        details: data.details || [],
      });
      toast.success(`Vista previa lista: ${data.to_update} precios por actualizar`);
    } catch (e: any) {
      toast.error(e?.message || 'Error al generar la vista previa de precios');
    } finally {
      setPricePreviewing(false);
    }
  };

  const runPriceSync = async () => {
    setPriceRunning(true);
    setPriceLastResult(null);
    setPricePreviewResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('sync-prices-run', { body: { storeId } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPriceLastResult({ updated: data.updated, errors: data.errors, total: data.total, inSync: data.in_sync });
      toast.success(`Precios sincronizados: ${data.updated} actualizados, ${data.errors} errores`);
    } catch (e: any) {
      toast.error(e?.message || 'Error en la sincronización de precios');
    } finally {
      setPriceRunning(false);
    }
  };

  // SKUs sin match
  const [unmatchedLoading, setUnmatchedLoading] = useState(false);
  const [unmatchedResult, setUnmatchedResult] = useState<{
    zoho_only: { count: number; items: { sku: string; name: string; rate: number; stock_on_hand: number }[] };
    tn_only: { count: number; items: { sku: string; product_name: string; price: number; stock: number }[] };
    zoho_total: number;
    tn_total: number;
  } | null>(null);
  const [unmatchedTab, setUnmatchedTab] = useState<'zoho' | 'tn'>('zoho');

  const loadUnmatched = async () => {
    setUnmatchedLoading(true);
    setUnmatchedResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('sync-unmatched-list', {
        body: { storeId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setUnmatchedResult(data);
      toast.success(`Análisis listo: ${data.zoho_only.count} sin match en Zoho, ${data.tn_only.count} en Tiendanube`);
    } catch (e: any) {
      toast.error(e?.message || 'Error al analizar SKUs');
    } finally {
      setUnmatchedLoading(false);
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

            {settings.stock_enabled && (
              <Box>
                <Box display="flex" alignItems="center" gap="2">
                  <Text fontWeight="medium">Sincronización automática de stock</Text>
                  <FieldHelp help="Frecuencia con la que el sistema sincroniza el stock automáticamente. Requiere que el scheduler esté activo en Supabase. 'Desactivada' solo permite ejecución manual." />
                </Box>
                <Select
                  id="stock_schedule"
                  name="stock_schedule"
                  value={settings.stock_schedule}
                  onChange={(e) => save({ stock_schedule: e.target.value as any })}
                >
                  <Select.Option value="disabled" label="Desactivada (solo manual)" />
                  <Select.Option value="hourly" label="Cada hora" />
                  <Select.Option value="every6h" label="Cada 6 horas" />
                  <Select.Option value="daily" label="Una vez al día" />
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
            <Box display="flex" gap="2" alignItems="center">
              <Button
                onClick={runPreview}
                disabled={!settings.stock_enabled || previewing || running}
              >
                {previewing ? <Spinner size="small" /> : <EyeIcon />}
                Vista previa
              </Button>
              <ProgressButton
                onClick={() => setShowConfirm(true)}
                loading={running}
                progress={progress}
                disabled={!settings.stock_enabled}
                icon={<RedoIcon />}
                loadingLabel="Sincronizando"
              >
                Sincronizar ahora
              </ProgressButton>
            </Box>
          </Box>
        </Card.Header>
        <Card.Body>
          <Text>
            Recorre todos los productos con SKU coincidente entre Zoho y Tiendanube y ajusta el stock según la dirección configurada.
            Usa <strong>Vista previa</strong> para ver qué cambiaría antes de aplicar.
          </Text>
          {lastResult && (
            <Box marginTop="3" display="flex" gap="2" flexWrap="wrap">
              <Tag appearance="primary">Total: {lastResult.total}</Tag>
              <Tag appearance="success">Actualizados: {lastResult.updated}</Tag>
              <Tag appearance="neutral">Ya sincronizados: {lastResult.inSync}</Tag>
              <Tag appearance={lastResult.errors > 0 ? 'danger' : 'neutral'}>Errores: {lastResult.errors}</Tag>
            </Box>
          )}
          {previewResult && (
            <Box marginTop="4" display="flex" flexDirection="column" gap="3">
              <Box display="flex" gap="2" flexWrap="wrap">
                <Tag appearance="primary">Vinculados: {previewResult.total}</Tag>
                <Tag appearance={previewResult.updated > 0 ? 'warning' : 'success'}>
                  Cambios pendientes: {previewResult.updated}
                </Tag>
                <Tag appearance="neutral">Ya en sync: {previewResult.inSync}</Tag>
                <Tag appearance={previewResult.unmatched > 0 ? 'warning' : 'neutral'}>
                  Sin match SKU: {previewResult.unmatched}
                </Tag>
              </Box>
              {previewResult.details.length > 0 && (
                <Table>
                  <Table.Head>
                    <Table.Row>
                      <Table.Cell as="th">SKU</Table.Cell>
                      <Table.Cell as="th">Destino</Table.Cell>
                      <Table.Cell as="th">Stock actual</Table.Cell>
                      <Table.Cell as="th">Stock nuevo</Table.Cell>
                    </Table.Row>
                  </Table.Head>
                  <Table.Body>
                    {previewResult.details.map((d, i) => (
                      <Table.Row key={i}>
                        <Table.Cell>{d.sku}</Table.Cell>
                        <Table.Cell>
                          <Tag appearance="neutral">{d.target === 'tn' ? 'Tiendanube' : 'Zoho'}</Tag>
                        </Table.Cell>
                        <Table.Cell>{d.from}</Table.Cell>
                        <Table.Cell>
                          <Text color={d.to > d.from ? 'success-textLow' : 'danger-textLow'} fontWeight="bold">
                            {d.to}
                          </Text>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              )}
            </Box>
          )}
        </Card.Body>
      </Card>

      {/* Price sync card */}
      <Card>
        <Card.Header>
          <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
            <Box display="flex" alignItems="center" gap="2">
              <Title as="h4" fontSize="h5">Sincronización de precios</Title>
              <FieldHelp help="Copia los precios de lista y precios promocionales desde Zoho Inventory hacia Tiendanube. Usa el SKU como clave de mapeo. El campo 'rate' de Zoho se convierte en el precio de lista en Tiendanube; el campo 'sales_rate' (si es distinto) se convierte en el precio promocional." />
            </Box>
            <Box display="flex" gap="2" alignItems="center">
              <Button
                onClick={runPricePreview}
                disabled={!settings.prices_enabled || pricePreviewing || priceRunning}
              >
                {pricePreviewing ? <Spinner size="small" /> : <EyeIcon />}
                Vista previa
              </Button>
              <ProgressButton
                onClick={() => setShowPriceConfirm(true)}
                loading={priceRunning}
                progress={null}
                disabled={!settings.prices_enabled}
                icon={<RedoIcon />}
                loadingLabel="Sincronizando"
              >
                Sincronizar precios
              </ProgressButton>
            </Box>
          </Box>
        </Card.Header>
        <Card.Body>
          <Box display="flex" flexDirection="column" gap="3">
            <Box display="flex" alignItems="center" gap="2">
              <Checkbox
                name="prices_enabled"
                label="Activar sincronización de precios (Zoho → Tiendanube)"
                checked={settings.prices_enabled}
                onChange={(e) => save({ prices_enabled: e.target.checked })}
              />
            </Box>
            <Text>
              Compara los precios en Zoho con los de Tiendanube y actualiza sólo los que difieren.
              Usa <strong>Vista previa</strong> para ver qué cambiaría antes de aplicar.
            </Text>

            {settings.prices_enabled && (
              <Box>
                <Box display="flex" alignItems="center" gap="2">
                  <Text fontWeight="medium">Sincronización automática de precios</Text>
                  <FieldHelp help="Frecuencia con la que el sistema actualiza los precios automáticamente desde Zoho hacia Tiendanube." />
                </Box>
                <Select
                  id="prices_schedule"
                  name="prices_schedule"
                  value={settings.prices_schedule}
                  onChange={(e) => save({ prices_schedule: e.target.value as any })}
                >
                  <Select.Option value="disabled" label="Desactivada (solo manual)" />
                  <Select.Option value="hourly" label="Cada hora" />
                  <Select.Option value="every6h" label="Cada 6 horas" />
                  <Select.Option value="daily" label="Una vez al día" />
                </Select>
              </Box>
            )}

            {saving && <Text fontSize="caption" color="neutral-textLow">Guardando…</Text>}
            {priceLastResult && (
              <Box display="flex" gap="2" flexWrap="wrap">
                <Tag appearance="primary">Total vinculados: {priceLastResult.total}</Tag>
                <Tag appearance="success">Actualizados: {priceLastResult.updated}</Tag>
                <Tag appearance="neutral">Ya sincronizados: {priceLastResult.inSync}</Tag>
                <Tag appearance={priceLastResult.errors > 0 ? 'danger' : 'neutral'}>Errores: {priceLastResult.errors}</Tag>
              </Box>
            )}
            {pricePreviewResult && (
              <Box display="flex" flexDirection="column" gap="3">
                <Box display="flex" gap="2" flexWrap="wrap">
                  <Tag appearance="primary">Vinculados: {pricePreviewResult.total}</Tag>
                  <Tag appearance={pricePreviewResult.toUpdate > 0 ? 'warning' : 'success'}>
                    Por actualizar: {pricePreviewResult.toUpdate}
                  </Tag>
                  <Tag appearance="neutral">Ya en sync: {pricePreviewResult.inSync}</Tag>
                  <Tag appearance={pricePreviewResult.unmatched > 0 ? 'warning' : 'neutral'}>
                    Sin match SKU: {pricePreviewResult.unmatched}
                  </Tag>
                </Box>
                {pricePreviewResult.details.length > 0 && (
                  <Table>
                    <Table.Head>
                      <Table.Row>
                        <Table.Cell as="th">SKU</Table.Cell>
                        <Table.Cell as="th">Precio actual (TN)</Table.Cell>
                        <Table.Cell as="th">Precio nuevo (Zoho)</Table.Cell>
                        <Table.Cell as="th">Promo actual</Table.Cell>
                        <Table.Cell as="th">Promo nueva</Table.Cell>
                      </Table.Row>
                    </Table.Head>
                    <Table.Body>
                      {pricePreviewResult.details.map((d, i) => (
                        <Table.Row key={i}>
                          <Table.Cell>{d.sku}</Table.Cell>
                          <Table.Cell>
                            <Text fontSize="caption" color="neutral-textLow">${d.tn_price?.toFixed(2)}</Text>
                          </Table.Cell>
                          <Table.Cell>
                            <Text fontSize="caption" color="success-textLow" fontWeight="bold">${d.new_price?.toFixed(2)}</Text>
                          </Table.Cell>
                          <Table.Cell>
                            <Text fontSize="caption" color="neutral-textLow">
                              {d.tn_promo != null ? `$${d.tn_promo.toFixed(2)}` : '—'}
                            </Text>
                          </Table.Cell>
                          <Table.Cell>
                            <Text fontSize="caption" color={d.new_promo != null ? 'success-textLow' : 'neutral-textLow'}>
                              {d.new_promo != null ? `$${d.new_promo.toFixed(2)}` : '—'}
                            </Text>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                )}
              </Box>
            )}
          </Box>
        </Card.Body>
      </Card>

      {/* SKUs sin match */}
      <Card>
        <Card.Header>
          <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
            <Box display="flex" alignItems="center" gap="2">
              <SearchIcon />
              <Title as="h4" fontSize="h5">SKUs sin match</Title>
            </Box>
            <Button onClick={loadUnmatched} disabled={unmatchedLoading}>
              {unmatchedLoading ? <Spinner size="small" /> : <EyeIcon />}
              Analizar
            </Button>
          </Box>
        </Card.Header>
        <Card.Body>
          <Box display="flex" flexDirection="column" gap="3">
            <Text>
              Compara los SKUs de Zoho y Tiendanube para detectar productos sin correspondencia en
              ninguna de las dos plataformas.
            </Text>

            {unmatchedLoading && (
              <Box display="flex" flexDirection="column" gap="2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} height="20px" width="100%" borderRadius="4px" />
                ))}
              </Box>
            )}

            {unmatchedResult && !unmatchedLoading && (
              <Box display="flex" flexDirection="column" gap="3">
                {/* Resumen */}
                <Box display="flex" gap="2" flexWrap="wrap">
                  <Tag appearance="neutral">Zoho: {unmatchedResult.zoho_total} SKUs</Tag>
                  <Tag appearance="neutral">Tiendanube: {unmatchedResult.tn_total} SKUs</Tag>
                  <Tag appearance={unmatchedResult.zoho_only.count > 0 ? 'warning' : 'success'}>
                    Solo en Zoho: {unmatchedResult.zoho_only.count}
                  </Tag>
                  <Tag appearance={unmatchedResult.tn_only.count > 0 ? 'warning' : 'success'}>
                    Solo en TN: {unmatchedResult.tn_only.count}
                  </Tag>
                </Box>

                {/* Tabs */}
                <Box display="flex" gap="2">
                  <Button
                    appearance={unmatchedTab === 'zoho' ? 'primary' : 'neutral'}
                    onClick={() => setUnmatchedTab('zoho')}
                  >
                    En Zoho, no en TN ({unmatchedResult.zoho_only.count})
                  </Button>
                  <Button
                    appearance={unmatchedTab === 'tn' ? 'primary' : 'neutral'}
                    onClick={() => setUnmatchedTab('tn')}
                  >
                    En TN, no en Zoho ({unmatchedResult.tn_only.count})
                  </Button>
                </Box>

                {unmatchedTab === 'zoho' && (
                  unmatchedResult.zoho_only.count === 0 ? (
                    <Alert appearance="success" title="Todo vinculado">
                      <Text>Todos los SKUs de Zoho tienen un producto correspondiente en Tiendanube.</Text>
                    </Alert>
                  ) : (
                    <Table>
                      <Table.Head>
                        <Table.Row>
                          <Table.Cell as="th">SKU</Table.Cell>
                          <Table.Cell as="th">Nombre en Zoho</Table.Cell>
                          <Table.Cell as="th">Precio</Table.Cell>
                          <Table.Cell as="th">Stock</Table.Cell>
                        </Table.Row>
                      </Table.Head>
                      <Table.Body>
                        {unmatchedResult.zoho_only.items.map((it) => (
                          <Table.Row key={it.sku}>
                            <Table.Cell>
                              <Text fontSize="caption" fontWeight="medium">{it.sku}</Text>
                            </Table.Cell>
                            <Table.Cell>
                              <Text fontSize="caption" color="neutral-textLow">{it.name}</Text>
                            </Table.Cell>
                            <Table.Cell>
                              <Text fontSize="caption">${it.rate.toLocaleString('es-AR')}</Text>
                            </Table.Cell>
                            <Table.Cell>
                              <Text fontSize="caption" color={it.stock_on_hand > 0 ? 'success-textLow' : 'danger-textLow'}>
                                {it.stock_on_hand}
                              </Text>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table>
                  )
                )}

                {unmatchedTab === 'tn' && (
                  unmatchedResult.tn_only.count === 0 ? (
                    <Alert appearance="success" title="Todo vinculado">
                      <Text>Todos los SKUs de Tiendanube tienen un producto correspondiente en Zoho.</Text>
                    </Alert>
                  ) : (
                    <Table>
                      <Table.Head>
                        <Table.Row>
                          <Table.Cell as="th">SKU</Table.Cell>
                          <Table.Cell as="th">Producto en TN</Table.Cell>
                          <Table.Cell as="th">Precio</Table.Cell>
                          <Table.Cell as="th">Stock</Table.Cell>
                        </Table.Row>
                      </Table.Head>
                      <Table.Body>
                        {unmatchedResult.tn_only.items.map((it) => (
                          <Table.Row key={it.sku}>
                            <Table.Cell>
                              <Text fontSize="caption" fontWeight="medium">{it.sku}</Text>
                            </Table.Cell>
                            <Table.Cell>
                              <Text fontSize="caption" color="neutral-textLow">{it.product_name}</Text>
                            </Table.Cell>
                            <Table.Cell>
                              <Text fontSize="caption">${it.price.toLocaleString('es-AR')}</Text>
                            </Table.Cell>
                            <Table.Cell>
                              <Text fontSize="caption" color={it.stock > 0 ? 'success-textLow' : 'danger-textLow'}>
                                {it.stock}
                              </Text>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table>
                  )
                )}

                {(unmatchedResult.zoho_only.count > 200 || unmatchedResult.tn_only.count > 200) && (
                  <Text fontSize="caption" color="neutral-textLow">
                    Mostrando los primeros 200 resultados.
                  </Text>
                )}
              </Box>
            )}
          </Box>
        </Card.Body>
      </Card>

      <Alert appearance="warning" title="Importante">
        <Text>
          Para sincronizar stock y precios, primero debes vincular productos en el módulo "Productos".
          El sistema utiliza el SKU como clave de mapeo entre las dos plataformas.
        </Text>
      </Alert>

      <ConfirmDialog
        open={showPriceConfirm}
        title="¿Confirmar sincronización de precios?"
        description="Esta operación actualizará los precios de lista y promocionales en Tiendanube con los valores de Zoho Inventory. Los cambios se aplican inmediatamente. Usa 'Vista previa' primero si quieres revisar los cambios antes de aplicarlos."
        confirmLabel="Sí, actualizar precios"
        cancelLabel="Cancelar"
        onConfirm={() => { setShowPriceConfirm(false); runPriceSync(); }}
        onCancel={() => setShowPriceConfirm(false)}
      />

      <ConfirmDialog
        open={showConfirm}
        title="¿Confirmar sincronización de stock?"
        description={`Esta operación ajustará las cantidades de inventario entre Zoho y Tiendanube según la dirección configurada (${
          settings.stock_direction === 'zoho_to_tn'
            ? 'Zoho → Tiendanube'
            : settings.stock_direction === 'tn_to_zoho'
            ? 'Tiendanube → Zoho'
            : 'Bidireccional'
        }). Usa "Vista previa" primero si quieres revisar los cambios antes de aplicarlos.`}
        confirmLabel="Sí, sincronizar"
        cancelLabel="Cancelar"
        onConfirm={() => { setShowConfirm(false); runSync(); }}
        onCancel={() => setShowConfirm(false)}
      />
    </Box>
  );
}
