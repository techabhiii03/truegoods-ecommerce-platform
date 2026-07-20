import './PageLoader.css';

export default function PageLoader({ label = 'Loading page' }) {
  return (
    <div className="page-loader" role="status" aria-live="polite" aria-label={label}>
      <div className="page-loader__hero" />
      <div className="page-loader__grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="page-loader__card" key={index}>
            <div className="page-loader__image" />
            <div className="page-loader__line page-loader__line--short" />
            <div className="page-loader__line" />
          </div>
        ))}
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
