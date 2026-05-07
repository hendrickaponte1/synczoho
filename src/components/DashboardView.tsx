import { useEffect, useState } from 'react';
import { Box, Card, Title, Text, Tag, Button, Spinner } from '@nimbus-ds/components';
import {
  TagIcon,
  CashIcon,
  StatsIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
} from '@nimbus-ds/icons';
import { supabase } from '@/integrations/supabase/client';
import { useSyncSettings } from '@/hooks/useSyncSettings';

interface DashboardViewProps {
  storeId: string;
  onNavigate: (section: string) => void;
}

interface Metrics {
  productsSynced: number;
  productsPending: number;
  ordersSynced: number;
  ordersError: number;
  customersSynced: number;
  stockSynced: number;
  lastActivity: string | null;
}

const moduleDefs = [
  {
    id: 'sync-products',
    title: 'Productos',
    icon: TagIcon,
    description:
      'Importa tu catálogo desde Zoho Inventory hacia Tiendanube. El sistema detecta coincidencias por SKU para que decidas si crear, vincular o ignorar cada producto. Soporta importación masiva, filtros y reintentos individuales.',
    settingKey: null as keyof ReturnType<typeof useSyncSettings>['settings'] | null,
    alwaysOn: true,
  },
  {
    id: 'sync-orders',
    title: 'Órdenes',
    icon: CashIcon,
    description:
      'Envía automáticamente las órdenes de Tiendanube a Zoho Inventory mediante webhooks. Configura si se crean como borrador, se confirman al instante o generan factura cuando la orden se paga.',
    settingKey: 'orders_enabled' as const,
  },
  {
    id: 'sync-stock',
    title: 'Stock',
    icon: StatsIcon,
    description:
      'Mantén el inventario alineado entre Zoho y Tiendanube. Sincronización bidireccional con prioridad configurable para evitar conflictos cuando hay cambios simultáneos.',
    settingKey: 'stock_enabled' as const,
  },
  {
    id: 'sync-customers',
    title: 'Clientes',
    icon: UserGroupIcon,
    description:
      'Lleva los clientes de Tiendanube a Zoho como contactos. Sincronización masiva manual y vinculación automática por correo electrónico cuando se procesan órdenes nuevas.',
    settingKey: 'customers_auto_sync_on_order' as const,
  },
];

export function DashboardView({ storeId, onNavigate }: DashboardViewProps) {
  const { settings, loading: loadingSettings } = useSyncSettings(storeId);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('dashboard-metrics', {
          body: { store_id: storeId },
        });
        if (error) throw error;
        setMetrics(data.metrics);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, [storeId]);

  const isEnabled = (key: string | null): boolean => {
    if (!key) return true;
    if (!settings) return false;
    return Boolean((settings as any)[key]);
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return 'Sin actividad';
    return new Date(iso).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <Box display="flex" flexDirection="column" gap="6">
      {/* Métricas */}
      <Box display="grid" gap="4" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr', lg: 'repeat(4, 1fr)' }}>
        <MetricCard
          icon={<TagIcon size="medium" />}
          label="Productos sincronizados"
          value={loading ? '—' : String(metrics?.productsSynced ?? 0)}
          hint={metrics?.productsPending ? `${metrics.productsPending} pendientes` : undefined}
        />
        <MetricCard
          icon={<CashIcon size="medium" />}
          label="Órdenes enviadas a Zoho"
          value={loading ? '—' : String(metrics?.ordersSynced ?? 0)}
          hint={metrics?.ordersError ? `${metrics.ordersError} con error` : undefined}
          hintAppearance={metrics?.ordersError ? 'danger' : 'neutral'}
        />
        <MetricCard
          icon={<StatsIcon size="medium" />}
          label="SKUs con stock sincronizado"
          value={loading ? '—' : String(metrics?.stockSynced ?? 0)}
        />
        <MetricCard
          icon={<UserGroupIcon size="medium" />}
          label="Clientes sincronizados"
          value={loading ? '—' : String(metrics?.customersSynced ?? 0)}
        />
      </Box>

      <Card>
        <Card.Header>
          <Title as="h4" fontSize="h5">Última actividad</Title>
        </Card.Header>
        <Card.Body>
          <Text>{loading ? 'Cargando…' : formatDate(metrics?.lastActivity ?? null)}</Text>
        </Card.Body>
      </Card>

      {/* Módulos */}
      <Box display="flex" flexDirection="column" gap="3">
        <Title as="h3" fontSize="h4">Módulos de sincronización</Title>
        <Box display="grid" gap="4" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }}>
          {moduleDefs.map((m) => {
            const enabled = m.alwaysOn || isEnabled(m.settingKey);
            const Icon = m.icon;
            return (
              <Card key={m.id}>
                <Card.Header>
                  <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" gap="2">
                    <Box display="flex" alignItems="center" gap="2">
                      <Icon size="medium" />
                      <Title as="h4" fontSize="h5">{m.title}</Title>
                    </Box>
                    {loadingSettings && !m.alwaysOn ? (
                      <Spinner size="small" />
                    ) : enabled ? (
                      <Tag appearance="success">
                        <CheckCircleIcon size="small" /> Activo
                      </Tag>
                    ) : (
                      <Tag appearance="warning">
                        <ExclamationTriangleIcon size="small" /> Inactivo
                      </Tag>
                    )}
                  </Box>
                </Card.Header>
                <Card.Body>
                  <Box display="flex" flexDirection="column" gap="3">
                    <Text>{m.description}</Text>
                    <Box>
                      <Button appearance="neutral" onClick={() => onNavigate(m.id)}>
                        {enabled ? 'Abrir módulo' : 'Configurar'} <ChevronRightIcon />
                      </Button>
                    </Box>
                  </Box>
                </Card.Body>
              </Card>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}

function MetricCard({
  icon,
  label,
  value,
  hint,
  hintAppearance = 'neutral',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  hintAppearance?: 'neutral' | 'danger';
}) {
  return (
    <Card>
      <Card.Body>
        <Box display="flex" flexDirection="column" gap="2">
          <Box display="flex" alignItems="center" gap="2" color="neutral-textLow">
            {icon}
            <Text fontSize="caption" color="neutral-textLow">{label}</Text>
          </Box>
          <Title as="h3" fontSize="h2">{value}</Title>
          {hint && (
            <Text fontSize="caption" color={hintAppearance === 'danger' ? 'danger-textLow' : 'neutral-textLow'}>
              {hint}
            </Text>
          )}
        </Box>
      </Card.Body>
    </Card>
  );
}
