import './ui.css';

export default function Card({ children, className = '', interactive = false, as: Component = 'div', ...props }) {
  return <Component className={`ui-card ${interactive ? 'ui-card--interactive' : ''} ${className}`.trim()} {...props}>{children}</Component>;
}
