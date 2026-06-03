import { forwardRef } from 'react';

const VARIANT_CLASS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  subtle: 'btn-subtle',
  danger: 'btn-danger',
};

function joinClasses(...parts) {
  return parts.filter(Boolean).join(' ');
}

/**
 * Unified button — maps to the five-level `.btn-*` system only.
 * @param {'primary'|'secondary'|'ghost'|'subtle'|'danger'} variant
 * @param {'sm'|'md'} [size]
 */
export const Button = forwardRef(function Button({
  variant = 'ghost',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  type = 'button',
  href,
  children,
  ...rest
}, ref) {
  const mapped = VARIANT_CLASS[variant];
  if (!mapped && import.meta.env?.DEV) {
    console.warn(`[Button] Unknown variant "${variant}", falling back to ghost.`);
  }
  const isDisabled = disabled || loading;
  const classes = joinClasses(
    'btn',
    mapped || VARIANT_CLASS.ghost,
    size === 'sm' && 'btn-sm',
    loading && 'btn-loading',
    className,
  );
  const label = (
    <>
      {loading ? <span className="btn-spinner" aria-hidden="true" /> : null}
      <span className={loading ? 'btn-label btn-label--loading' : 'btn-label'}>{children}</span>
    </>
  );
  if (href) {
    return (
      <a
        ref={ref}
        href={href}
        className={classes}
        aria-disabled={isDisabled || undefined}
        {...rest}
      >
        {label}
      </a>
    );
  }
  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...rest}
    >
      {label}
    </button>
  );
});