import { useState } from 'react';
import { Box, Card, Title, Text, Tag, Button, Spinner } from '@nimbus-ds/components';
import { LogOutIcon } from '@nimbus-ds/icons';
import { ZohoConnectCard } from '@/components/ZohoConnectCard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ConfigurationViewProps {
  storeId: string;
  storeName: string;
  storeMeta?: { country?: string; currency?: string } | null;
  onDisconnect?: () => void;
}

export function ConfigurationView({ storeId, storeName, storeMeta, onDisconnect }: ConfigurationViewProps) {
  const [disconnecting, setDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    if (!confirm('¿Desconectar esta tienda? Se eliminará la conexión con Zoho y el acceso a la app.')) return;
    setDisconnecting(true);
    try {
      const { error } = await supabase.functions.invoke('tiendanube-disconnect', {
        body: { store_id: storeId },
      });
      if (error) throw error;
      toast.success('Tienda desconectada correctamente');
      onDisconnect?.();
    } catch (e: any) {
      toast.error(e.message || 'Error al desconectar la tienda');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <Box display="flex" flexDirection="column" gap="4">
      <Box display="grid" gap="4" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }}>
        <Card>
          <Card.Header>
            <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
              <Box display="flex" alignItems="center" gap="2">
                <img
                  src="/tiendanube-logo.png"
                  alt="Tiendanube"
                  style={{ height: 24, width: 'auto' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <Title as="h4" fontSize="h5">Tiendanube</Title>
              </Box>
              <Tag appearance="success">Conectada</Tag>
            </Box>
          </Card.Header>
          <Card.Body>
            <Box display="flex" flexDirection="column" gap="3">
              <Box display="flex" flexDirection="column" gap="1">
                <Text>
                  Tienda: <strong>{storeName}</strong>
                </Text>
                {storeMeta && (storeMeta.country || storeMeta.currency) && (
                  <Text fontSize="caption" color="neutral-textLow">
                    {storeMeta.country && `País: ${storeMeta.country}`}
                    {storeMeta.country && storeMeta.currency && ' · '}
                    {storeMeta.currency && `Moneda: ${storeMeta.currency}`}
                  </Text>
                )}
              </Box>
              {onDisconnect && (
                <Box>
                  <Button appearance="danger" onClick={handleDisconnect} disabled={disconnecting}>
                    {disconnecting ? <Spinner size="small" /> : <LogOutIcon />}
                    {disconnecting ? 'Desconectando...' : 'Desconectar tienda'}
                  </Button>
                </Box>
              )}
            </Box>
          </Card.Body>
        </Card>

        <ZohoConnectCard storeId={storeId} />
      </Box>
    </Box>
  );
}
