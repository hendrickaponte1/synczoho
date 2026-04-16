import { Box, Card, Title, Text, Tag } from '@nimbus-ds/components';
import { ZohoConnectCard } from '@/components/ZohoConnectCard';

interface ConfigurationViewProps {
  storeId: string;
  storeName: string;
  storeMeta?: { country?: string; currency?: string } | null;
}

export function ConfigurationView({ storeId, storeName, storeMeta }: ConfigurationViewProps) {
  return (
    <Box display="flex" flexDirection="column" gap="4">
      <Box display="grid" gap="4" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }}>
        <Card>
          <Card.Header>
            <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
              <Title as="h4" fontSize="h5">Tiendanube</Title>
              <Tag appearance="success">Conectada</Tag>
            </Box>
          </Card.Header>
          <Card.Body>
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
          </Card.Body>
        </Card>

        <ZohoConnectCard storeId={storeId} />
      </Box>
    </Box>
  );
}
