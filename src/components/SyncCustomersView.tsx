import { useEffect, useState } from 'react';
import {
  Box, Card, Title, Text, Button, Spinner, Alert, Tag, Table, Checkbox,
} from '@nimbus-ds/components';
import { RedoIcon } from '@nimbus-ds/icons';
import { supabase } from '@/integrations/supabase/client';
import { useSyncSettings } from '@/hooks/useSyncSettings';
import { toast } from 'sonner';

interface Props { storeId: string }

interface CustomerRow {
  id: string;
  email: string | null;
  zoho_contact_id: string | null;
  status: string;
  last_error: string | null;
  last_synced_at: string | null;
}

export function SyncCustomersView({ storeId }: Props) {
  const { settings, save } = useSyncSettings(storeId);
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<CustomerRow[]>([]);
  const [lastResult, setLastResult] = useState<{ created: number; linked: number; errors: number; total: number } | null>(null);

  const loadHistory = async () => {
    const { data } = await supabase
      .from('customer_sync_map')
      .select('id, email, zoho_contact_id, status, last_error, last_synced_at')
      .eq('store_id', storeId)
      .order('last_synced_at', { ascending: false })
      .limit(50);
    setHistory((data as CustomerRow[]) || []);
  };

  useEffect(() => { loadHistory(); /* eslint-disable-next-line */ }, [storeId]);

  const runBulk = async () => {
    setRunning(true);
    setLastResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('sync-customers-bulk', {
        body: { storeId, page: 1, limit: 50 },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setLastResult({ created: data.created, linked: data.linked, errors: data.errors, total: data.total });
      toast.success(`Sync clientes: ${data.created} creados, ${data.linked} vinculados, ${data.errors} errores`);
      await loadHistory();
    } catch (e: any) {
      toast.error(e?.message || 'Error en sync de clientes');
    } finally {
      setRunning(false);
    }
  };

  return (
    <Box display="flex" flexDirection="column" gap="4">
      <Card>
        <Card.Header>
          <Title as="h4" fontSize="h5">Configuración de clientes</Title>
        </Card.Header>
        <Card.Body>
          {!settings ? <Spinner /> : (
            <Checkbox
              name="customers_auto_sync_on_order"
              label="Crear/vincular cliente en Zoho automáticamente al recibir una orden"
              checked={settings.customers_auto_sync_on_order}
              onChange={(e) => save({ customers_auto_sync_on_order: e.target.checked })}
            />
          )}
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
            <Title as="h4" fontSize="h5">Sincronización masiva</Title>
            <Button appearance="primary" onClick={runBulk} disabled={running}>
              {running ? <Spinner size="small" /> : <RedoIcon />}
              Sincronizar clientes ahora
            </Button>
          </Box>
        </Card.Header>
        <Card.Body>
          <Text>
            Trae los clientes de Tiendanube y los crea o vincula en Zoho Inventory por email.
          </Text>
          {lastResult && (
            <Box marginTop="3" display="flex" gap="2" flexWrap="wrap">
              <Tag appearance="primary">Total: {lastResult.total}</Tag>
              <Tag appearance="success">Creados: {lastResult.created}</Tag>
              <Tag appearance="primary">Vinculados: {lastResult.linked}</Tag>
              <Tag appearance={lastResult.errors > 0 ? 'danger' : 'neutral'}>Errores: {lastResult.errors}</Tag>
            </Box>
          )}
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <Title as="h4" fontSize="h5">Historial de clientes sincronizados</Title>
        </Card.Header>
        <Card.Body>
          {history.length === 0 ? (
            <Alert appearance="neutral">Aún no hay clientes sincronizados.</Alert>
          ) : (
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.Cell as="th">Email</Table.Cell>
                  <Table.Cell as="th">Estado</Table.Cell>
                  <Table.Cell as="th">Zoho Contact ID</Table.Cell>
                  <Table.Cell as="th">Último sync</Table.Cell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {history.map((c) => (
                  <Table.Row key={c.id}>
                    <Table.Cell>{c.email || '—'}</Table.Cell>
                    <Table.Cell>
                      <Tag appearance={c.status === 'success' ? 'success' : c.status === 'error' ? 'danger' : 'neutral'}>
                        {c.status}
                      </Tag>
                      {c.last_error && <Text fontSize="caption" color="danger-textLow">{c.last_error.slice(0, 60)}</Text>}
                    </Table.Cell>
                    <Table.Cell>{c.zoho_contact_id || '—'}</Table.Cell>
                    <Table.Cell>
                      {c.last_synced_at ? new Date(c.last_synced_at).toLocaleString() : '—'}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Box>
  );
}
