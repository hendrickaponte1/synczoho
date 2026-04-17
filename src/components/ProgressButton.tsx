import { ReactNode } from 'react';
import { Box, Button } from '@nimbus-ds/components';

interface ProgressButtonProps {
  onClick: () => void;
  loading: boolean;
  progress?: { current: number; total: number } | null;
  disabled?: boolean;
  appearance?: 'primary' | 'neutral' | 'danger' | 'transparent';
  icon?: ReactNode;
  children: ReactNode;
  loadingLabel?: string;
}

/**
 * Botón con barra de progreso integrada para procesos masivos.
 * - Si hay total conocido: muestra barra que se llena con porcentaje "X% (current/total)".
 * - Si no hay total: muestra contador animado "Procesando… X" con shimmer.
 */
export function ProgressButton({
  onClick,
  loading,
  progress,
  disabled,
  appearance = 'primary',
  icon,
  children,
  loadingLabel,
}: ProgressButtonProps) {
  const hasTotal = !!(progress && progress.total > 0);
  const pct = hasTotal
    ? Math.min(100, Math.round((progress!.current / progress!.total) * 100))
    : null;

  return (
    <Box position="relative" overflow="hidden" borderRadius="2" display="inline-flex">
      {loading && pct !== null && (
        <Box
          position="absolute"
          top="0"
          left="0"
          height="100%"
          width={`${pct}%` as any}
          backgroundColor="primary-interactive"
          style={{
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 0,
            opacity: 0.85,
          }}
        />
      )}
      {loading && pct === null && (
        <Box
          position="absolute"
          top="0"
          left="0"
          height="100%"
          width="100%"
          backgroundColor="primary-interactive"
          style={{
            zIndex: 0,
            opacity: 0.5,
            backgroundImage:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)',
            backgroundSize: '200% 100%',
            animation: 'progress-shimmer 1.2s infinite',
          }}
        />
      )}
      <Box position="relative" style={{ zIndex: 1 }}>
        <Button appearance={appearance} onClick={onClick} disabled={disabled || loading}>
          {icon}
          {loading
            ? hasTotal
              ? `${loadingLabel || 'Procesando'} ${pct}% (${progress!.current}/${progress!.total})`
              : progress
                ? `${loadingLabel || 'Procesando'} ${progress.current}…`
                : loadingLabel || 'Procesando…'
            : children}
        </Button>
      </Box>
    </Box>
  );
}
