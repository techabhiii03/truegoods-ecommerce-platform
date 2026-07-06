import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getForYouRecommendations } from '../api/recommendationApi';
import RecommendationCarousel from '../components/recommendations/RecommendationCarousel';
import './Home.css';

const Home = () => {
  const { user } = useAuth();
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    getForYouRecommendations()
      .then((data) => setRecommended(data.products))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <>
      <div className="home-hero">
        <div className="container home-hero-inner">
          <span className="home-eyebrow">Everything, tagged and ready</span>
          <h1>
            Shop the catalog.
            <br />
            Prices are the receipt, not the pitch.
          </h1>
          <p className="home-lede">
            A small storefront built end-to-end: real auth, a real cart, and real checkout via
            Razorpay's sandbox.
          </p>
          <Link to="/products" className="btn btn-primary home-cta">
            Browse products →
          </Link>
        </div>
      </div>

      {user && (
        <div className="container" style={{ padding: '0 24px' }}>
          <RecommendationCarousel title="Recommended for you" products={recommended} loading={loading} />
        </div>
      )}
    </>
  );
};

export default Home;