import { ReactNode } from 'react';
import { Box, Button } from '@nimbus-ds/components';

export interface AppSection {
  id: string;
  label: string;
  icon?: ReactNode;
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
  return (
    <Box display="flex" flexDirection="column" minHeight="100vh" backgroundColor="neutral-background">
      {/* Header limpio: solo navegación entre módulos a la izquierda + acciones contextuales a la derecha */}
      <Box
        display="flex"
        flexDirection={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'stretch', md: 'center' }}
        justifyContent="space-between"
        gap="3"
        paddingX="6"
        paddingY="4"
        backgroundColor="neutral-background"
      >
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
          <Box display="flex" gap="2" flexWrap="wrap" justifyContent="flex-end">
            {pageActions}
          </Box>
        )}
      </Box>

      <Box flex="1" paddingX="6" paddingBottom="8">
        {children}
      </Box>
    </Box>
  );
}
