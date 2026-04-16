import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  Text,
  Title,
  Button,
  Input,
  Select,
  Checkbox,
  Tag,
  Spinner,
  EmptyMessage,
  Table,
  Pagination,
  Alert,
  Modal,
  IconButton,
  Tooltip,
  Sidebar,
} from '@nimbus-ds/components';
import {
  SearchIcon,
  RedoIcon,
  ExternalLinkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CloseIcon,
  DownloadIcon,
} from '@nimbus-ds/icons';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ZohoItem {
  item_id: string;
  name: string;
  sku: string | null;
  status: string;
  rate: number;
  stock_on_hand: number;
  description: string;
  category_name: string | null;
  match_status: 'new' | 'linked' | 'imported' | 'conflict' | 'error' | 'ignored';
  tiendanube_product_id: number | null;
  last_synced_at: string | null;
  last_error: string | null;
}

interface ImportResult {
  zoho_item_id: string;
  status: 'success' | 'error' | 'skipped';
  message?: string;
  tiendanube_product_id?: number | null;
  action: string;
}

interface SyncProductsViewProps {
  storeId: string;
}

const PER_PAGE = 25;

const matchStatusTag: Record<string, { label: string; appearance: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' }> = {
  new: { label: 'Nuevo', appearance: 'primary' },
  linked: { label: 'Vinculado', appearance: 'success' },
  imported: { label: 'Importado', appearance: 'success' },
  conflict: { label: 'Conflicto', appearance: 'warning' },
  error: { label: 'Error', appearance: 'danger' },
  ignored: { label: 'Ignorado', appearance: 'neutral' },
};

export function SyncProductsView({ storeId }: SyncProductsViewProps) {
  const [items, setItems] = useState<ZohoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<string>('');
  const [matchFilter, setMatchFilter] = useState<string>('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [publishOnImport, setPublishOnImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [detail, setDetail] = useState<ZohoItem | null>(null);

  const load = async (opts?: { page?: number }) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: e } = await supabase.functions.invoke('zoho-list-items', {
        body: {
          store_id: storeId,
          page: opts?.page ?? page,
          per_page: PER_PAGE,
          search: search || undefined,
          status: statusFilter || undefined,
          stock: stockFilter || undefined,
          match: matchFilter || undefined,
        },
      });
      if (e) throw e;
      if (data?.error) throw new Error(data.error);
      setItems(data.items || []);
      setHasMore(!!data.page_context?.has_more_page);
      setSelected(new Set());
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al cargar items de Zoho');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ page: 1 });
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, search, statusFilter, stockFilter, matchFilter]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.item_id)));
  };

  const selectedItems = useMemo(
    () => items.filter((i) => selected.has(i.item_id)),
    [items, selected],
  );

  const summary = useMemo(() => {
    const s = { create: 0, update: 0, link: 0, conflict: 0 };
    selectedItems.forEach((i) => {
      if (i.match_status === 'linked' || i.match_status === 'imported') s.update++;
      else if (i.match_status === 'conflict') s.conflict++;
      else s.create++;
    });
    return s;
  }, [selectedItems]);

  const runImport = async (retryItems?: ImportResult[]) => {
    setImporting(true);
    setConfirmOpen(false);
    try {
      const target = retryItems
        ? retryItems
            .map((r) => items.find((i) => i.item_id === r.zoho_item_id))
            .filter(Boolean) as ZohoItem[]
        : selectedItems;

      const payload = target.map((it) => {
        let action: 'create' | 'update' | 'link';
        if (it.match_status === 'linked' || it.match_status === 'imported') action = 'update';
        else if (it.match_status === 'conflict' && it.tiendanube_product_id) action = 'link';
        else action = 'create';
        return {
          zoho_item_id: it.item_id,
          action,
          tiendanube_product_id: it.tiendanube_product_id,
        };
      });

      const { data, error: e } = await supabase.functions.invoke('zoho-sync-import', {
        body: { store_id: storeId, items: payload, publish: publishOnImport },
      });
      if (e) throw e;
      if (data?.error) throw new Error(data.error);
      setResults(data.results || []);
      const okCount = (data.results || []).filter((r: ImportResult) => r.status === 'success').length;
      const errCount = (data.results || []).filter((r: ImportResult) => r.status === 'error').length;
      if (errCount === 0) toast.success(`${okCount} producto(s) sincronizado(s)`);
      else toast.warning(`${okCount} ok · ${errCount} con error`);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Error en la importación');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Box display="flex" flexDirection="column" gap="4">
      {/* Filtros */}
      <Card>
        <Card.Body>
          <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap="3" flexWrap="wrap" alignItems="flex-end">
            <Box flex="1" minWidth="220px" display="flex" flexDirection="column" gap="1">
              <Text fontSize="caption" color="neutral-textLow">Buscar</Text>
              <Input
                placeholder="Nombre o SKU..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setSearch(searchInput);
                }}
                append={<SearchIcon />}
              />
            </Box>

            <Box display="flex" flexDirection="column" gap="1" minWidth="160px">
              <Text fontSize="caption" color="neutral-textLow">Estado en Zoho</Text>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <Select.Option label="Todos" value="" />
                <Select.Option label="Activos" value="active" />
                <Select.Option label="Inactivos" value="inactive" />
              </Select>
            </Box>

            <Box display="flex" flexDirection="column" gap="1" minWidth="160px">
              <Text fontSize="caption" color="neutral-textLow">Stock</Text>
              <Select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
                <Select.Option label="Todos" value="" />
                <Select.Option label="Con stock" value="in" />
                <Select.Option label="Sin stock" value="out" />
              </Select>
            </Box>

            <Box display="flex" flexDirection="column" gap="1" minWidth="180px">
              <Text fontSize="caption" color="neutral-textLow">Estado de sync</Text>
              <Select value={matchFilter} onChange={(e) => setMatchFilter(e.target.value)}>
                <Select.Option label="Todos" value="" />
                <Select.Option label="Nuevos" value="new" />
                <Select.Option label="Vinculados" value="linked" />
                <Select.Option label="Importados" value="imported" />
                <Select.Option label="Conflictos" value="conflict" />
                <Select.Option label="Con errores" value="error" />
              </Select>
            </Box>

            <Button appearance="neutral" onClick={() => setSearch(searchInput)}>
              Aplicar
            </Button>
            <Button
              appearance="transparent"
              onClick={() => {
                setSearchInput('');
                setSearch('');
                setStatusFilter('');
                setStockFilter('');
                setMatchFilter('');
              }}
            >
              Limpiar
            </Button>
          </Box>
        </Card.Body>
      </Card>

      {/* Acciones bulk */}
      {selected.size > 0 && (
        <Alert appearance="primary" title={`${selected.size} item(s) seleccionado(s)`}>
          <Box display="flex" gap="2" alignItems="center">
            <Button appearance="primary" onClick={() => setConfirmOpen(true)}>
              <DownloadIcon /> Sincronizar seleccionados
            </Button>
            <Button appearance="transparent" onClick={() => setSelected(new Set())}>
              Cancelar
            </Button>
          </Box>
        </Alert>
      )}

      {error && (
        <Alert appearance="danger" title="Error">
          {error}
        </Alert>
      )}

      {/* Tabla */}
      <Card padding="none">
        {loading ? (
          <Box padding="8" display="flex" justifyContent="center">
            <Spinner size="large" />
          </Box>
        ) : items.length === 0 ? (
          <Box padding="8">
            <EmptyMessage
              title="Sin items"
              text="No hay productos en Zoho con estos filtros."
              icon={<SearchIcon size="large" />}
            />
          </Box>
        ) : (
          <Box overflow="auto">
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.Cell as="th" width="40px">
                    <Checkbox
                      name="all"
                      checked={selected.size === items.length}
                      onChange={toggleAll}
                    />
                  </Table.Cell>
                  <Table.Cell as="th">Producto</Table.Cell>
                  <Table.Cell as="th">SKU</Table.Cell>
                  <Table.Cell as="th">Precio</Table.Cell>
                  <Table.Cell as="th">Stock</Table.Cell>
                  <Table.Cell as="th">Estado</Table.Cell>
                  <Table.Cell as="th">Último sync</Table.Cell>
                  <Table.Cell as="th" width="80px">Acciones</Table.Cell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {items.map((it) => {
                  const tag = matchStatusTag[it.match_status] || matchStatusTag.new;
                  return (
                    <Table.Row key={it.item_id}>
                      <Table.Cell>
                        <Checkbox
                          name={it.item_id}
                          checked={selected.has(it.item_id)}
                          onChange={() => toggle(it.item_id)}
                        />
                      </Table.Cell>
                      <Table.Cell>
                        <Box display="flex" flexDirection="column" gap="1">
                          <Text fontWeight="medium" color="neutral-textHigh">{it.name}</Text>
                          {it.category_name && (
                            <Text fontSize="caption" color="neutral-textLow">{it.category_name}</Text>
                          )}
                        </Box>
                      </Table.Cell>
                      <Table.Cell>
                        <Text fontSize="caption">{it.sku || '—'}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text>${Number(it.rate ?? 0).toLocaleString('es-AR')}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text color={it.stock_on_hand > 0 ? 'success-textLow' : 'danger-textLow'}>
                          {it.stock_on_hand}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Tag appearance={tag.appearance}>{tag.label}</Tag>
                        {it.last_error && (
                          <Tooltip content={it.last_error}>
                            <Box display="inline-block" marginLeft="1">
                              <ExclamationTriangleIcon color="danger-interactive" />
                            </Box>
                          </Tooltip>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <Text fontSize="caption" color="neutral-textLow">
                          {it.last_synced_at ? new Date(it.last_synced_at).toLocaleString('es-AR') : '—'}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <IconButton source={<ExternalLinkIcon />} size="2rem" onClick={() => setDetail(it)} />
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table>
          </Box>
        )}

        <Box padding="4" display="flex" justifyContent="space-between" alignItems="center">
          <Text fontSize="caption" color="neutral-textLow">
            Página {page}
          </Text>
          <Pagination
            pageCount={hasMore ? page + 1 : page}
            activePage={page}
            onPageChange={(p) => setPage(p)}
          />
        </Box>
      </Card>

      {/* Modal de confirmación */}
      <Modal open={confirmOpen} onDismiss={() => setConfirmOpen(false)}>
        <Modal.Header title="Confirmar sincronización" />
        <Modal.Body padding="base">
          <Box display="flex" flexDirection="column" gap="3">
            <Text>
              Vas a sincronizar <strong>{selectedItems.length}</strong> producto(s) desde Zoho a Tiendanube:
            </Text>
            <Box display="flex" flexDirection="column" gap="1" backgroundColor="neutral-surface" padding="3" borderRadius="2">
              <Text fontSize="caption">• <strong>{summary.create}</strong> nuevo(s) → se crean en Tiendanube</Text>
              <Text fontSize="caption">• <strong>{summary.update}</strong> ya vinculado(s) → se actualizan</Text>
              <Text fontSize="caption">• <strong>{summary.conflict}</strong> conflicto(s) por nombre → se vinculan al producto detectado</Text>
            </Box>
            <Checkbox
              name="publish"
              label="Publicar productos al importar (por defecto se crean como borrador)"
              checked={publishOnImport}
              onChange={(e) => setPublishOnImport(e.target.checked)}
            />
          </Box>
        </Modal.Body>
        <Modal.Footer>
          <Button appearance="transparent" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button appearance="primary" onClick={() => runImport()} disabled={importing}>
            {importing ? <Spinner size="small" /> : 'Confirmar y sincronizar'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de resultados */}
      <Modal open={!!results} onDismiss={() => setResults(null)} maxWidth="700px">
        <Modal.Header title="Resultado de la sincronización" />
        <Modal.Body padding="base">
          <Box display="flex" flexDirection="column" gap="2" maxHeight="400px" overflow="auto">
            {(results || []).map((r) => {
              const it = items.find((i) => i.item_id === r.zoho_item_id);
              return (
                <Box
                  key={r.zoho_item_id}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  padding="2"
                  backgroundColor="neutral-surface"
                  borderRadius="2"
                  gap="2"
                >
                  <Box display="flex" alignItems="center" gap="2" flex="1">
                    {r.status === 'success' ? (
                      <CheckCircleIcon color="success-interactive" />
                    ) : (
                      <ExclamationTriangleIcon color="danger-interactive" />
                    )}
                    <Box display="flex" flexDirection="column">
                      <Text fontSize="caption" fontWeight="medium">{it?.name || r.zoho_item_id}</Text>
                      {r.message && <Text fontSize="caption" color="danger-textLow">{r.message}</Text>}
                    </Box>
                  </Box>
                  <Tag appearance={r.status === 'success' ? 'success' : 'danger'}>{r.action}</Tag>
                </Box>
              );
            })}
          </Box>
        </Modal.Body>
        <Modal.Footer>
          {(results || []).some((r) => r.status === 'error') && (
            <Button
              appearance="neutral"
              onClick={() => runImport((results || []).filter((r) => r.status === 'error'))}
            >
              <RedoIcon /> Reintentar errores
            </Button>
          )}
          <Button appearance="primary" onClick={() => setResults(null)}>Cerrar</Button>
        </Modal.Footer>
      </Modal>

      {/* Sidebar de detalle */}
      <Sidebar open={!!detail} onRemove={() => setDetail(null)} position="right">
        <Sidebar.Header title={detail?.name || ''} />
        <Sidebar.Body>
          {detail && (
            <Box display="flex" flexDirection="column" gap="3">
              <Row label="Item ID Zoho" value={detail.item_id} />
              <Row label="SKU" value={detail.sku || '—'} />
              <Row label="Precio" value={`$${Number(detail.rate).toLocaleString('es-AR')}`} />
              <Row label="Stock" value={String(detail.stock_on_hand)} />
              <Row label="Estado en Zoho" value={detail.status} />
              <Row label="Categoría" value={detail.category_name || '—'} />
              <Row label="Producto en Tiendanube" value={detail.tiendanube_product_id ? `#${detail.tiendanube_product_id}` : 'No vinculado'} />
              {detail.description && (
                <Box display="flex" flexDirection="column" gap="1">
                  <Text fontSize="caption" color="neutral-textLow">Descripción</Text>
                  <Text fontSize="caption">{detail.description}</Text>
                </Box>
              )}
              {detail.last_error && (
                <Alert appearance="danger" title="Último error">
                  {detail.last_error}
                </Alert>
              )}
            </Box>
          )}
        </Sidebar.Body>
      </Sidebar>
    </Box>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Box display="flex" justifyContent="space-between" gap="2">
      <Text fontSize="caption" color="neutral-textLow">{label}</Text>
      <Text fontSize="caption" fontWeight="medium">{value}</Text>
    </Box>
  );
}
