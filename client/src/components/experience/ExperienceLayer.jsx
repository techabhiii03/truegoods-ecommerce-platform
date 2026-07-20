import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './ExperienceLayer.css';

const ExperienceLayer = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    setLoading(true);
    const timer = window.setTimeout(() => setLoading(false), 520);
    return () => window.clearTimeout(timer);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const targets = document.querySelectorAll('main section, main .product-card, main .admin-card, main .cart-item, main .order-card');
      targets.forEach((node, index) => {
        if (!node.dataset.revealReady) {
          node.dataset.revealReady = 'true';
          node.classList.add('tg-reveal');
          node.style.setProperty('--reveal-delay', `${Math.min(index % 6, 5) * 55}ms`);
        }
      });
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: .08, rootMargin: '0px 0px -35px' });
      targets.forEach((node) => observer.observe(node));
      window.__tgObserver = observer;
    }, 40);
    return () => {
      window.clearTimeout(timer);
      window.__tgObserver?.disconnect();
    };
  }, [location.pathname, location.search]);

  return <div className={`route-progress ${loading ? 'is-loading' : ''}`} aria-hidden="true"><span /></div>;
};

export default ExperienceLayer;
