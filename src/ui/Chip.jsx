import { Button } from './Button.jsx';

/**
 * Selectable chip — defaults to ghost; active state via `active` class.
 */
export function Chip({
  active = false,
  variant = 'ghost',
  size = 'sm',
  className = '',
  children,
  ...rest
}) {
  return (
    <Button
      variant={variant}
      size={size}
      className={['ui-chip', active && 'ui-chip--active', className].filter(Boolean).join(' ')}
      aria-pressed={active}
      {...rest}
    >
      {children}
    </Button>
  );
}