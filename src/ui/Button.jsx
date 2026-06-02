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
export function Button({
  variant = 'ghost',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  type = 'button',
  children,
  ...rest
}) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      className={joinClasses(
        'btn',
        VARIANT_CLASS[variant] || VARIANT_CLASS.ghost,
        size === 'sm' && 'btn-sm',
        loading && 'btn-loading',
        className,
      )}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className="btn-spinner" aria-hidden="true" /> : null}
      <span className={loading ? 'btn-label btn-label--loading' : 'btn-label'}>{children}</span>
    </button>
  );
}