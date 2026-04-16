import { ReactNode } from 'react';
import { Box, Title, Tabs, Text, Button } from '@nimbus-ds/components';
import { LogOutIcon, RedoIcon } from '@nimbus-ds/icons';

export interface AppSection {
  id: string;
  label: string;
}

interface AppShellProps {
  storeName: string;
  sections: AppSection[];
  activeSection: string;
  onSectionChange: (id: string) => void;
  pageTitle: string;
  pageActions?: ReactNode;
  onDisconnect?: () => void;
  children: ReactNode;
}

export function AppShell({
  storeName,
  sections,
  activeSection,
  onSectionChange,
  pageTitle,
  pageActions,
  onDisconnect,
  children,
}: AppShellProps) {
  return (
    <Box display="flex" flexDirection="column" minHeight="100vh" backgroundColor="neutral-background">
      {/* Top bar fina con marca + tienda */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        paddingX="6"
        paddingY="3"
        backgroundColor="neutral-surface"
        borderBottomColor="neutral-interactive"
        borderBottomStyle="solid"
        borderBottomWidth="1"
      >
        <Box display="flex" alignItems="center" gap="3">
          <Box
            backgroundColor="primary-interactive"
            borderRadius="2"
            width="32px"
            height="32px"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <RedoIcon color="neutral-background" />
          </Box>
          <Box display="flex" flexDirection="column">
            <Text fontSize="caption" fontWeight="bold" color="neutral-textHigh">
              TiendaSync
            </Text>
            <Text fontSize="caption" color="neutral-textLow">
              {storeName}
            </Text>
          </Box>
        </Box>

        {onDisconnect && (
          <Button appearance="transparent" onClick={onDisconnect}>
            <LogOutIcon /> Desconectar tienda
          </Button>
        )}
      </Box>

      {/* Header de página: título a la izquierda, navegación + acciones a la derecha */}
      <Box
        display="flex"
        flexDirection={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between"
        gap="4"
        paddingX="6"
        paddingY="6"
        backgroundColor="neutral-background"
      >
        <Title as="h1" fontSize="h1">
          {pageTitle}
        </Title>

        <Box
          display="flex"
          flexDirection={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'center' }}
          gap="3"
          flexWrap="wrap"
          justifyContent="flex-end"
        >
          <Tabs>
            {sections.map((s) => (
              <Tabs.Item
                key={s.id}
                label={s.label}
                active={activeSection === s.id}
                onClick={() => onSectionChange(s.id)}
              />
            ))}
          </Tabs>

          {pageActions && (
            <Box display="flex" gap="2" flexWrap="wrap">
              {pageActions}
            </Box>
          )}
        </Box>
      </Box>

      {/* Contenido */}
      <Box flex="1" paddingX="6" paddingBottom="8">
        {children}
      </Box>
    </Box>
  );
}
