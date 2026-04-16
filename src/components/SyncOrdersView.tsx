import { useEffect, useState } from 'react';
import {
  Box, Card, Title, Text, Button, Checkbox, Tag, Spinner, Table, Alert, Pagination,
} from '@nimbus-ds/components';
import { RedoIcon, CheckCircleIcon, ExclamationTriangleIcon, ExternalLinkIcon } from '@nimbus-ds/icons';
import { supabase } from '@/integrations/supabase/client';
import { useSyncSettings } from '@/hooks/useSyncSettings';
import { toast } from 'sonner';

interface Props { storeId: string }

interface OrderRow {
  id: number;
  number: number;
  contact_name: string | null;
  contact_email: string | null;
  status: string;
  payment_status: string;
  total: string;
  currency: string;
  created_at: string;
  sync_status: 'not_synced' | 'pending' | 'success' | 'error';
  zoho_salesorder_id: string | null;
  zoho_invoice_id: string | null;
  last_error: string | null;
  last_synced_at: string | null;
}

const PER_PAGE = 25;

export function SyncOrdersView({ storeId }: Props) {
  const { settings, saving, save } = useSyncSettings(storeId);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [retryingId, setRetryingId] = useState<number | null>(null);

  const loadOrders = async (p = page) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-orders-list', {
        body: { storeId, page: p, perPage: PER_PAGE },
      });
      if (error) throw error;
      setOrders(data.orders || []);
    } catch (e: any) {
      toast.error(e?.message || 'Error cargando órdenes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(1); /* eslint-disable-next-line */ }, [storeId]);

  const retryOrder = async (orderId: number) => {
    setRetryingId(orderId);
    try {
      const { data, error } = await supabase.functions.invoke('zoho-create-salesorder', {
        body: { storeId, orderId, event: 'manual' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Orden #${orderId} sincronizada`);
      loadOrders(page);
    } catch (e: any) {
      toast.error(e?.message || 'Error reintentando');
    } finally {
      setRetryingId(null);
    }
  };

  const syncStatusTag = (s: OrderRow['sync_status']) => {
    if (s === 'success') return <Tag appearance="success">Sincronizada</Tag>;
    if (s === 'error') return <Tag appearance="danger">Error</Tag>;
    if (s === 'pending') return <Tag appearance="warning">Pendiente</Tag>;
    return <Tag appearance="neutral">Sin sincronizar</Tag>;
  };

  return (
    <Box display="flex" flexDirection="column" gap="4">
      <Card>
        <Card.Header>
          <Title as="h4" fontSize="h5">Configuración de órdenes</Title>
        </Card.Header>
        <Card.Body>
          {!settings ? (
            <Spinner />
          ) : (
            <Box display="flex" flexDirection="column" gap="3">
              <Checkbox
                name="orders_enabled"
                label="Activar sincronización automática de órdenes (vía webhook)"
                checked={settings.orders_enabled}
                onChange={(e) => save({ orders_enabled: e.target.checked })}
              />
              <Checkbox
                name="orders_create_as_draft"
                label="Crear órdenes en Zoho como borrador (Draft)"
                checked={settings.orders_create_as_draft}
                onChange={(e) => save({ orders_create_as_draft: e.target.checked, orders_auto_confirm: e.target.checked ? false : settings.orders_auto_confirm })}
              />
              <Checkbox
                name="orders_auto_confirm"
                label="Auto-confirmar Sales Order al crearse"
                checked={settings.orders_auto_confirm}
                onChange={(e) => save({ orders_auto_confirm: e.target.checked, orders_create_as_draft: e.target.checked ? false : settings.orders_create_as_draft })}
              />
              <Checkbox
                name="orders_generate_invoice_on_paid"
                label="Generar factura automáticamente cuando la orden esté pagada"
                checked={settings.orders_generate_invoice_on_paid}
                onChange={(e) => save({ orders_generate_invoice_on_paid: e.target.checked })}
              />
              <Checkbox
                name="customers_auto_sync_on_order"
                label="Crear/vincular cliente en Zoho al recibir la orden"
                checked={settings.customers_auto_sync_on_order}
                onChange={(e) => save({ customers_auto_sync_on_order: e.target.checked })}
              />
              {saving && <Text fontSize="caption" color="neutral-textLow">Guardando…</Text>}
            </Box>
          )}
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
            <Title as="h4" fontSize="h5">Órdenes recientes</Title>
            <Button appearance="neutral" onClick={() => loadOrders(page)}>
              <RedoIcon /> Actualizar
            </Button>
          </Box>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <Box display="flex" justifyContent="center" padding="6"><Spinner /></Box>
          ) : orders.length === 0 ? (
            <Alert appearance="neutral">No hay órdenes para mostrar.</Alert>
          ) : (
            <Box display="flex" flexDirection="column" gap="3">
              <Table>
                <Table.Head>
                  <Table.Row>
                    <Table.Cell as="th">#</Table.Cell>
                    <Table.Cell as="th">Cliente</Table.Cell>
                    <Table.Cell as="th">Estado pago</Table.Cell>
                    <Table.Cell as="th">Total</Table.Cell>
                    <Table.Cell as="th">Sync Zoho</Table.Cell>
                    <Table.Cell as="th">Acción</Table.Cell>
                  </Table.Row>
                </Table.Head>
                <Table.Body>
                  {orders.map((o) => (
                    <Table.Row key={o.id}>
                      <Table.Cell>#{o.number}</Table.Cell>
                      <Table.Cell>
                        <Text>{o.contact_name || '—'}</Text>
                        <Text fontSize="caption" color="neutral-textLow">{o.contact_email}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Tag appearance={o.payment_status === 'paid' ? 'success' : 'warning'}>
                          {o.payment_status}
                        </Tag>
                      </Table.Cell>
                      <Table.Cell>{o.currency} {o.total}</Table.Cell>
                      <Table.Cell>
                        {syncStatusTag(o.sync_status)}
                        {o.last_error && (
                          <Text fontSize="caption" color="danger-textLow">{o.last_error.slice(0, 80)}</Text>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <Button
                          appearance="neutral"
                          onClick={() => retryOrder(o.id)}
                          disabled={retryingId === o.id}
                        >
                          {retryingId === o.id ? <Spinner size="small" /> : <RedoIcon />}
                          {o.sync_status === 'success' ? 'Re-sincronizar' : 'Sincronizar'}
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
              <Box display="flex" justifyContent="center">
                <Pagination
                  pageCount={page + 1}
                  activePage={page}
                  onPageChange={(p) => { setPage(p); loadOrders(p); }}
                />
              </Box>
            </Box>
          )}
        </Card.Body>
      </Card>

      <Alert appearance="primary" title="Webhook de Tiendanube">
        <Text>
          Para sincronización automática, registrá este webhook URL en tu app de Tiendanube
          (eventos: <code>order/created</code>, <code>order/updated</code>, <code>order/paid</code>):
        </Text>
        <Text fontSize="caption">
          {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tiendanube-webhook`}
        </Text>
      </Alert>
    </Box>
  );
}
