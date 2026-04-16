import { ReactNode } from 'react';
import { Box, Button, Title } from '@nimbus-ds/components';

export interface AppSection {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

interface AppShellProps {
  sections: AppSection[];
  activeSection: string;
  onSectionChange: (id: string) => void;
  pageActions?: ReactNode;
  children: ReactNode;
}

export function AppShell({
  sections,
  activeSection,
  onSectionChange,
  pageActions,
  children,
}: AppShellProps) {
  const activeLabel = sections.find((s) => s.id === activeSection)?.label ?? '';

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh" backgroundColor="neutral-background">
      <Box
        display="flex"
        flexDirection={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'stretch', md: 'center' }}
        justifyContent="space-between"
        gap="4"
        paddingX="6"
        paddingY="5"
        backgroundColor="neutral-background"
      >
        {/* Título de la sección a la izquierda */}
        <Box display="flex" alignItems="center">
          <Title as="h1" fontSize="h2">{activeLabel}</Title>
        </Box>

        {/* Navegación + acciones contextuales a la derecha */}
        <Box display="flex" alignItems="center" gap="2" flexWrap="wrap" justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
          {sections.map((s) => (
            <Button
              key={s.id}
              appearance={activeSection === s.id ? 'primary' : 'neutral'}
              onClick={() => onSectionChange(s.id)}
              disabled={s.disabled}
            >
              {s.icon}
              {s.label}
            </Button>
          ))}
          {pageActions}
        </Box>
      </Box>

      <Box flex="1" paddingX="6" paddingBottom="8">
        {children}
      </Box>
    </Box>
  );
}
