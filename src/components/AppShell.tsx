import { ReactNode } from 'react';
import { Box, Title, Text, Button } from '@nimbus-ds/components';
import { LogOutIcon, RedoIcon } from '@nimbus-ds/icons';

export interface AppSection {
  id: string;
  label: string;
  icon?: ReactNode;
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
    <Box
      display="flex"
      flexDirection="column"
      minHeight="100vh"
      backgroundColor="neutral-background"
    >
      {/* Top bar fina con marca + tienda */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        paddingX="6"
        paddingY="3"
        backgroundColor="neutral-surface"
        borderColor="neutral-interactive"
        borderStyle="solid"
        borderBottomWidth="1"
        borderTopWidth="none"
        borderLeftWidth="none"
        borderRightWidth="none"
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
          {/* Navegación entre módulos como botones (más cercano al screenshot Tiendanube) */}
          <Box display="flex" gap="2" flexWrap="wrap">
            {sections.map((s) => (
              <Button
                key={s.id}
                appearance={activeSection === s.id ? 'primary' : 'neutral'}
                onClick={() => onSectionChange(s.id)}
              >
                {s.icon}
                {s.label}
              </Button>
            ))}
          </Box>

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
