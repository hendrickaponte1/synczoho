import { Box, Tooltip, Text } from '@nimbus-ds/components';
import { InfoCircleIcon } from '@nimbus-ds/icons';
import type { ReactNode } from 'react';

interface FieldHelpProps {
  /** Texto del label (a mostrar al lado del ícono) */
  label?: ReactNode;
  /** Contenido educativo del tooltip */
  help: string;
}

/**
 * Ícono de información con tooltip educativo.
 * Si se pasa `label`, lo renderiza junto al ícono. Si no, sólo el ícono.
 *
 * Uso típico junto a un Checkbox/Select para explicar qué hace la opción.
 */
export function FieldHelp({ label, help }: FieldHelpProps) {
  return (
    <Box display="inline-flex" alignItems="center" gap="1">
      {label && (
        <Text as="span" fontSize="caption" color="neutral-textLow">
          {label}
        </Text>
      )}
      <Tooltip content={help} position="top">
        <span style={{ display: 'inline-flex', alignItems: 'center', color: 'hsl(var(--muted-foreground))', cursor: 'help' }}>
          <InfoCircleIcon size="small" />
        </span>
      </Tooltip>
    </Box>
  );
}
