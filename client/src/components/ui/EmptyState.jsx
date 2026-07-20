import Button from './Button';
import './ui.css';

export default function EmptyState({ icon = '○', title, description, actionLabel, onAction }) {
  return (
    <section className="ui-empty" role="status">
      <span className="ui-empty__icon" aria-hidden="true">{icon}</span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {actionLabel && <Button onClick={onAction}>{actionLabel}</Button>}
    </section>
  );
}
