import './ui.css';

export default function Input({ label, error, hint, id, className = '', ...props }) {
  const inputId = id || props.name;
  return (
    <label className={`ui-field ${className}`.trim()} htmlFor={inputId}>
      {label && <span className="ui-field__label">{label}</span>}
      <input id={inputId} className={`ui-input ${error ? 'ui-input--error' : ''}`} {...props} />
      {error ? <span className="ui-field__error">{error}</span> : hint && <span className="ui-field__hint">{hint}</span>}
    </label>
  );
}
