import ProductCard from '../product/ProductCard';
import './RecommendationCarousel.css';

// Generic horizontal carousel — used for "similar products," "frequently bought together,"
// and "recommended for you," just fed different data and a title from the parent.
const RecommendationCarousel = ({ title, products, loading }) => {
  if (loading) return null; // no skeleton — quietly appears once ready, doesn't shift layout
  if (!products || products.length === 0) return null;

  return (
    <section className="rec-carousel">
      <h2 className="rec-carousel-title">{title}</h2>
      <div className="rec-carousel-track">
        {products.map((p) => (
          <div className="rec-carousel-item" key={p._id}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecommendationCarousel;
