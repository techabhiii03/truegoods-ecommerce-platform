import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductBySlug } from '../api/productApi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './ProductDetail.css';
import { getSimilarProducts, getFrequentlyBoughtTogether } from '../api/recommendationApi';
import RecommendationCarousel from '../components/recommendations/RecommendationCarousel';

const formatPrice = (n) => `₹${Number(n).toFixed(2)}`;

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [addStatus, setAddStatus] = useState('idle'); // idle | adding | added | error
  const [similar, setSimilar] = useState([]);
const [frequentlyBought, setFrequentlyBought] = useState([]);
const [recLoading, setRecLoading] = useState(true);

  useEffect(() => {
    setStatus('loading');
    getProductBySlug(slug)
      .then((data) => {
        setProduct(data.product);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [slug]);
  useEffect(() => {
  if (!product) return;
  setRecLoading(true);
  Promise.all([getSimilarProducts(product._id), getFrequentlyBoughtTogether(product._id)])
    .then(([similarData, fbtData]) => {
      setSimilar(similarData.products);
      setFrequentlyBought(fbtData.products);
    })
    .finally(() => setRecLoading(false));
}, [product]);

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setAddStatus('adding');
    try {
      await addItem(product._id, quantity);
      setAddStatus('added');
      setTimeout(() => setAddStatus('idle'), 1800);
    } catch {
      setAddStatus('error');
    }
  };

  if (status === 'loading') {
    return (
      <div className="container empty-state">
        <div className="spinner" style={{ margin: '0 auto 12px' }} />
        Loading product…
      </div>
    );
  }

  if (status === 'error' || !product) {
    return (
      <div className="container empty-state">
        <h3>Product not found</h3>
        <p>It may have been removed or the link is incorrect.</p>
      </div>
    );
  }

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <div className="container detail-page">
      <div className="detail-image">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} />
        ) : (
          <div className="detail-image-placeholder">No image</div>
        )}
      </div>

      <div className="detail-info">
        {product.category?.name && <span className="detail-category">{product.category.name}</span>}
        <h1>{product.name}</h1>

        <div className="price-tag detail-price">
          {hasDiscount && <span className="strike">{formatPrice(product.compareAtPrice)}</span>}
          {formatPrice(product.price)}
        </div>

        <p className="detail-description">{product.description}</p>

        <div className="detail-stock">
          {product.stock > 0 ? (
            <span className="stock-in">{product.stock} in stock</span>
          ) : (
            <span className="stock-out">Out of stock</span>
          )}
        </div>

        <div className="detail-actions">
          <div className="quantity-stepper">
            <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
              −
            </button>
            <span>{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
              aria-label="Increase quantity"
              disabled={quantity >= product.stock}
            >
              +
            </button>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleAddToCart}
            disabled={product.stock === 0 || addStatus === 'adding'}
          >
            {addStatus === 'adding' && 'Adding…'}
            {addStatus === 'added' && 'Added ✓'}
            {addStatus === 'error' && 'Try again'}
            {addStatus === 'idle' && (product.stock === 0 ? 'Out of stock' : 'Add to cart')}
          </button>
       </div>
      </div>

      <RecommendationCarousel title="You may also like" products={similar} loading={recLoading} />
      <RecommendationCarousel
        title="Frequently bought together"
        products={frequentlyBought}
        loading={recLoading}
      />
    </div>
  );
};

export default ProductDetail;
