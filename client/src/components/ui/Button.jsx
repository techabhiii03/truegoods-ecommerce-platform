import './ui.css';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}) {
  return (
    <button
      className={`ui-button ui-button--${variant} ui-button--${size} ${className}`.trim()}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="ui-spinner" aria-hidden="true" /> : icon}
      <span>{children}</span>
    </button>
  );
}
