import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProducts, getCategories } from '../api/productApi';
import { getForYouRecommendations } from '../api/recommendationApi';
import ProductCard from '../components/product/ProductCard';
import RecommendationCarousel from '../components/recommendations/RecommendationCarousel';
import './Home.css';

const FALLBACK_CATEGORIES = ['Electronics', 'Fashion', 'Home & living', 'Accessories'];

const Home = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newsletter, setNewsletter] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    Promise.allSettled([getProducts({ limit: 8, sort: 'rating' }), getCategories()]).then(([productResult, categoryResult]) => {
      if (productResult.status === 'fulfilled') setProducts(productResult.value.products || []);
      if (categoryResult.status === 'fulfilled') setCategories(categoryResult.value.categories || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    getForYouRecommendations().then((data) => setRecommended(data.products || [])).catch(() => {});
  }, [user]);

  const heroProduct = products[0];
  const categoryCards = useMemo(() => {
    const featured = categories.filter((category) => category.featured !== false);
    const source = featured.length
      ? featured.slice(0, 4)
      : FALLBACK_CATEGORIES.map((name, index) => ({ _id: index, name, productCount: 0 }));

    return source.map((category) => ({
      ...category,
      image: category.coverImage || category.sampleImage || '',
      count: category.productCount || 0,
    }));
  }, [categories]);

  const handleSubscribe = (event) => {
    event.preventDefault();
    if (!newsletter.trim()) return;
    setSubscribed(true);
    setNewsletter('');
  };

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="container home-hero-grid">
          <div className="hero-copy">
            <span className="eyebrow"><i /> Thoughtfully chosen. Honestly priced.</span>
            <h1>Better finds for your <em>everyday.</em></h1>
            <p>Discover useful, beautiful products without endless scrolling. TrueGoods brings quality picks, clear pricing and a shopping experience that simply feels better.</p>
            <div className="hero-actions">
              <Link to="/products" className="btn btn-dark">Explore collection <span>↗</span></Link>
              <Link to="/products?sort=rating" className="text-link">See what’s trending <span>→</span></Link>
            </div>
            <div className="hero-proof">
              <div className="proof-avatars"><span>A</span><span>N</span><span>R</span><span>+</span></div>
              <div><strong>4.8/5</strong><small>Loved by 2,000+ shoppers</small></div>
            </div>
          </div>

          <div className="hero-visual" aria-label="Featured TrueGoods product">
            <div className="hero-orbit hero-orbit-one" />
            <div className="hero-orbit hero-orbit-two" />
            <span className="hero-note note-top">New season<br/><strong>essentials</strong></span>
            <div className="hero-product-frame">
              {heroProduct?.images?.[0] ? <img loading="eager" decoding="async" fetchPriority="high" src={heroProduct.images[0]} alt={heroProduct.name} /> : <div className="hero-placeholder"><span>TRUE</span><strong>GOODS</strong></div>}
            </div>
            <div className="hero-floating-card">
              <span>Editor’s pick</span>
              <strong>{heroProduct?.name || 'Everyday essentials'}</strong>
              <small>{heroProduct ? `From ₹${Number(heroProduct.price).toLocaleString('en-IN')}` : 'Made for better days'}</small>
            </div>
            <span className="hero-stamp">GOOD<br/>CHOICE</span>
          </div>
        </div>
      </section>

      <section className="benefit-strip">
        <div className="container benefit-grid">
          <div><span>01</span><strong>Free shipping</strong><small>Above ₹999</small></div>
          <div><span>02</span><strong>Easy returns</strong><small>7-day window</small></div>
          <div><span>03</span><strong>Secure checkout</strong><small>Protected payments</small></div>
          <div><span>04</span><strong>Curated quality</strong><small>Products worth keeping</small></div>
        </div>
      </section>

      <section className="home-section category-section">
        <div className="container">
          <div className="section-heading split-heading">
            <div><span className="eyebrow">Shop your way</span><h2>Find your kind of good.</h2></div>
            <Link to="/products" className="text-link">View all categories <span>→</span></Link>
          </div>
          <div className="category-grid">
            {categoryCards.map((category, index) => (
              <Link className={`category-card category-${index + 1}`} key={category._id || category.name} to={`/products?category=${category._id || ''}`}>
                <div className="category-card-copy"><span>0{index + 1}</span><h3>{category.name}</h3><p>{category.count} {category.count === 1 ? 'product' : 'products'}</p><small>Explore collection ↗</small></div>
                {category.image ? <img loading="lazy" decoding="async" src={category.image} alt="" /> : <div className="category-shape" />}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section featured-section">
        <div className="container">
          <div className="section-heading split-heading">
            <div><span className="eyebrow">People are loving</span><h2>Trending right now.</h2></div>
            <Link to="/products?sort=rating" className="text-link">Shop all products <span>→</span></Link>
          </div>
          {loading ? (
            <div className="product-skeleton-grid">{Array.from({ length: 4 }).map((_, i) => <div className="product-skeleton" key={i} />)}</div>
          ) : products.length ? (
            <div className="home-product-grid">{products.slice(0, 4).map((product) => <ProductCard key={product._id} product={product} />)}</div>
          ) : (
            <div className="home-empty"><strong>Your collection is ready for products.</strong><span>Add items from the admin dashboard and they will appear here automatically.</span></div>
          )}
        </div>
      </section>

      <section className="story-banner">
        <div className="container story-grid">
          <div className="story-visual"><div className="story-circle">TRUE<br/>GOODS</div><span className="story-word">simply</span></div>
          <div className="story-copy"><span className="eyebrow light">Why TrueGoods</span><h2>Less clutter.<br/>More good choices.</h2><p>We believe online shopping should feel exciting, not exhausting. Every part of TrueGoods is designed around clarity—from discovering something useful to checking out securely.</p><Link to="/products" className="btn btn-light">Start discovering <span>↗</span></Link></div>
        </div>
      </section>

      {user && recommended.length > 0 && (
        <section className="home-section personal-section"><div className="container"><RecommendationCarousel title="Picked especially for you" products={recommended} loading={false} /></div></section>
      )}

      <section className="home-section review-section">
        <div className="container review-grid">
          <div className="review-intro"><span className="eyebrow">Real words, real people</span><h2>Good things are meant to be shared.</h2><div className="review-score"><strong>4.8</strong><div><span>★★★★★</span><small>Based on verified purchases</small></div></div></div>
          <blockquote><span className="quote-mark">“</span><p>TrueGoods feels different from the usual crowded shopping sites. I found what I needed quickly, the product details were clear, and checkout took less than a minute.</p><footer><strong>Riya Malhotra</strong><small>Verified customer · Delhi</small></footer></blockquote>
        </div>
      </section>

      <section className="newsletter-section">
        <div className="container newsletter-card">
          <div><span className="eyebrow light">A little goodness in your inbox</span><h2>New finds. Better deals.<br/>No unnecessary noise.</h2></div>
          <form onSubmit={handleSubscribe}>
            {subscribed ? <div className="subscribe-success">You’re on the list. Welcome to TrueGoods ✦</div> : <><div className="newsletter-input"><input type="email" required value={newsletter} onChange={(e) => setNewsletter(e.target.value)} placeholder="Enter your email address"/><button type="submit">Join us →</button></div><small>By subscribing, you agree to receive occasional TrueGoods updates.</small></>}
          </form>
        </div>
      </section>
    </div>
  );
};

export default Home;
