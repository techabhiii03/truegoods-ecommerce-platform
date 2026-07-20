import { useCallback, useEffect, useRef, useState } from 'react';
import ProductCard from '../product/ProductCard';
import './RecommendationCarousel.css';

const RecommendationCarousel = ({ title, products, loading }) => {
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [progress, setProgress] = useState(0);

  const updateControls = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const maxScroll = Math.max(track.scrollWidth - track.clientWidth, 0);
    setCanScrollLeft(track.scrollLeft > 2);
    setCanScrollRight(track.scrollLeft < maxScroll - 2);
    setProgress(maxScroll > 0 ? (track.scrollLeft / maxScroll) * 100 : 0);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    const frame = requestAnimationFrame(updateControls);
    const observer = new ResizeObserver(updateControls);
    observer.observe(track);
    Array.from(track.children).forEach((child) => observer.observe(child));
    window.addEventListener('resize', updateControls);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', updateControls);
    };
  }, [products, updateControls]);

  const scroll = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    const amount = Math.max(track.clientWidth * 0.82, 320);
    track.scrollBy({ left: direction * amount, behavior: 'smooth' });
  };

  const handleSlider = (event) => {
    const track = trackRef.current;
    if (!track) return;
    const maxScroll = Math.max(track.scrollWidth - track.clientWidth, 0);
    track.scrollTo({ left: (Number(event.target.value) / 100) * maxScroll, behavior: 'auto' });
  };

  if (loading || !products?.length) return null;

  return (
    <section className="rec-carousel">
      <div className="rec-carousel-header">
        <h2 className="rec-carousel-title">{title}</h2>
        <div className="rec-carousel-controls" aria-label="Carousel controls">
          <button type="button" onClick={() => scroll(-1)} disabled={!canScrollLeft} aria-label="Previous products">←</button>
          <button type="button" onClick={() => scroll(1)} disabled={!canScrollRight} aria-label="Next products">→</button>
        </div>
      </div>

      <div className="rec-carousel-viewport">
        <div className="rec-carousel-track" ref={trackRef} onScroll={updateControls}>
          {products.map((product) => (
            <div className="rec-carousel-item" key={product._id}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>

      <div className="rec-carousel-slider-wrap">
        <input
          className="rec-carousel-slider"
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={progress}
          onChange={handleSlider}
          aria-label="Scroll products"
          disabled={!canScrollLeft && !canScrollRight}
        />
      </div>
    </section>
  );
};

export default RecommendationCarousel;
