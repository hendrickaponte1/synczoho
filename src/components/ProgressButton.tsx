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
 * Muestra una barra de fondo que se llena según current/total.
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
  const pct =
    progress && progress.total > 0
      ? Math.min(100, Math.round((progress.current / progress.total) * 100))
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
          backgroundColor="primary-surface"
          style={{ transition: 'width 0.3s ease', zIndex: 0, opacity: 0.5 }}
        />
      )}
      {loading && pct === null && (
        <Box
          position="absolute"
          top="0"
          left="0"
          height="100%"
          width="100%"
          backgroundColor="primary-surface"
          style={{
            zIndex: 0,
            opacity: 0.4,
            backgroundImage:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
            backgroundSize: '200% 100%',
            animation: 'progress-shimmer 1.5s infinite',
          }}
        />
      )}
      <Box position="relative" style={{ zIndex: 1 }}>
        <Button appearance={appearance} onClick={onClick} disabled={disabled || loading}>
          {icon}
          {loading
            ? progress
              ? `${loadingLabel || 'Procesando'} ${progress.current}/${progress.total}`
              : loadingLabel || 'Procesando…'
            : children}
        </Button>
      </Box>
    </Box>
  );
}
