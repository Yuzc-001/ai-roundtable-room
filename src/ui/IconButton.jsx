import { forwardRef } from 'react';
import { Button } from './Button.jsx';

/**
 * Icon-only control — requires aria-label for a11y.
 */
export const IconButton = forwardRef(function IconButton({
  label,
  active = false,
  variant = 'subtle',
  className = '',
  children,
  ...rest
}, ref) {
  return (
    <Button
      ref={ref}
      variant={variant}
      className={['icon-btn-lite', active && 'active', className].filter(Boolean).join(' ')}
      aria-label={label}
      title={rest.title ?? label}
      {...rest}
    >
      {children}
    </Button>
  );
});