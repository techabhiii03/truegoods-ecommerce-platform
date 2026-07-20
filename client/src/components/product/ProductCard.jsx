import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCompare } from '../../context/CompareContext';
import './ProductCard.css';

const formatPrice = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const ProductCard = ({ product }) => {
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isSaved, toggle: toggleWishlist } = useWishlist();
  const compare = useCompare();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discount = hasDiscount ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;
  const rating = Number(product.rating || product.averageRating || 4.6);
  const categoryName = product.category?.name || product.categoryName || 'Everyday essential';

  const handleWishlist = async () => {
    const result = await toggleWishlist(product);
    if (result?.requiresLogin) navigate('/login', { state: { from: `/products/${product.slug}` } });
  };

  const handleAdd = async () => {
    if (product.stock === 0 || adding) return;
    if (!user) {
      navigate('/login', { state: { from: `/products/${product.slug}` } });
      return;
    }
    try {
      setAdding(true);
      await addItem(product._id, 1);
      setAdded(true);
      showToast(`${product.name} was added to your bag.`, { title: 'Added to bag' });
      window.setTimeout(() => setAdded(false), 1600);
    } catch (error) {
      showToast(error?.response?.data?.message || 'Could not add this item right now.', { type: 'error' });
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className="product-card">
      <div className="product-card-image">
        <Link to={`/products/${product.slug}`} aria-label={`View ${product.name}`}>
          {product.images?.[0] ? <img decoding="async" src={product.images[0]} alt={product.name} loading="lazy" /> : <div className="product-card-placeholder">TrueGoods</div>}
        </Link>
        <div className="product-card-badges">
          {discount > 0 && <span className="product-card-sale">-{discount}%</span>}
          {product.stock === 0 && <span className="product-card-oos">Sold out</span>}
        </div>
        <button className={`product-wishlist ${isSaved(product._id) ? 'is-saved' : ''}`} type="button" aria-label="Toggle wishlist" onClick={handleWishlist}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.4 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg>
        </button>
        <button className={`product-compare ${compare.has(product._id) ? 'is-active' : ''}`} type="button" onClick={() => compare.toggle(product)} aria-label="Compare product">⇄</button>
        <button className={`product-quick-add ${added ? 'is-added' : ''}`} type="button" onClick={handleAdd} disabled={product.stock === 0 || adding}>
          {product.stock === 0 ? 'Unavailable' : adding ? 'Adding…' : added ? 'Added ✓' : 'Quick add'}
        </button>
      </div>

      <div className="product-card-body">
        <span className="product-card-category">{categoryName}</span>
        <Link to={`/products/${product.slug}`} className="product-card-name">{product.name}</Link>
        <div className="product-card-meta">
          <div className="product-price-row">
            <strong>{formatPrice(product.price)}</strong>
            {hasDiscount && <span>{formatPrice(product.compareAtPrice)}</span>}
          </div>
          <div className="product-rating" aria-label={`${rating} out of 5 stars`}>
            <span>★</span>{rating.toFixed(1)}
          </div>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
