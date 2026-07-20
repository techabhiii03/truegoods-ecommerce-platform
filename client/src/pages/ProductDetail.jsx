import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProductBySlug } from '../api/productApi';
import { getFrequentlyBoughtTogether, getSimilarProducts } from '../api/recommendationApi';
import { createReview, deleteReview, getProductReviews, updateReview } from '../api/reviewApi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import RecommendationCarousel from '../components/recommendations/RecommendationCarousel';
import './ProductDetail.css';

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;


function Stars({ value = 5 }) {
  return <span className="pd-stars" aria-label={`${value} out of 5 stars`}>{'★★★★★'.slice(0, Math.round(value))}{'☆☆☆☆☆'.slice(Math.round(value))}</span>;
}

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { isSaved, toggle: toggleWishlist } = useWishlist();
  const { showToast } = useToast();
  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState('loading');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [addStatus, setAddStatus] = useState('idle');
  const [openPanel, setOpenPanel] = useState('details');
  const [similar, setSimilar] = useState([]);
  const [frequentlyBought, setFrequentlyBought] = useState([]);
  const [recLoading, setRecLoading] = useState(true);
  const [pincode, setPincode] = useState('');
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [reviews, setReviews] = useState([]);
  const [reviewMeta, setReviewMeta] = useState({ total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [reviewBusy, setReviewBusy] = useState(false);

  useEffect(() => {
    setStatus('loading');
    getProductBySlug(slug)
      .then(({ product: value }) => {
        setProduct(value);
        setActiveImage(0);
        setQuantity(1);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [slug]);

  useEffect(() => {
    if (!product?._id) return;
    getProductReviews(product._id)
      .then((data) => { setReviews(data.reviews || []); setReviewMeta({ total: data.total || 0, distribution: data.distribution || {} }); })
      .catch(() => {});
  }, [product?._id]);

  useEffect(() => {
    if (!product) return;
    setRecLoading(true);
    Promise.allSettled([getSimilarProducts(product._id), getFrequentlyBoughtTogether(product._id)]).then(([a, b]) => {
      try {
        const current = JSON.parse(localStorage.getItem('truegoods-recent') || '[]');
        localStorage.setItem('truegoods-recent', JSON.stringify([product, ...current.filter((p) => p._id !== product._id)].slice(0, 8)));
      } catch {}
      if (a.status === 'fulfilled') setSimilar(a.value.products || []);
      if (b.status === 'fulfilled') setFrequentlyBought(b.value.products || []);
      setRecLoading(false);
    });
  }, [product]);

  const images = useMemo(() => product?.images?.filter(Boolean) || [], [product]);
  const attributes = useMemo(() => {
    if (!product?.attributes) return [];
    if (product.attributes instanceof Map) return [...product.attributes.entries()];
    return Object.entries(product.attributes);
  }, [product]);
  const hasDiscount = product?.compareAtPrice > product?.price;
  const discount = hasDiscount ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;
  const rating = Number(product?.ratingAvg || product?.rating || product?.averageRating || 4.6);
  const ratingCount = Number(product?.ratingCount || reviewMeta.total || 0);

  const addToCart = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/products/${slug}` } });
      return false;
    }
    setAddStatus('adding');
    try {
      await addItem(product._id, quantity);
      setAddStatus('added');
      showToast?.(`${product.name} added to your bag`, 'success');
      setTimeout(() => setAddStatus('idle'), 1600);
      return true;
    } catch {
      setAddStatus('error');
      showToast?.('Could not add this item. Please try again.', 'error');
      return false;
    }
  };

  const buyNow = async () => {
    const added = await addToCart();
    if (added) navigate('/checkout');
  };

  const submitReview = async (event) => {
    event.preventDefault();
    if (!user) { navigate('/login', { state: { from: `/products/${slug}` } }); return; }
    setReviewBusy(true);
    try {
      if (editingReviewId) await updateReview(editingReviewId, reviewForm);
      else await createReview(product._id, reviewForm);
      const data = await getProductReviews(product._id);
      setReviews(data.reviews || []);
      setReviewMeta({ total: data.total || 0, distribution: data.distribution || {} });
      setReviewForm({ rating: 5, title: '', comment: '' });
      setEditingReviewId(null);
      showToast?.(editingReviewId ? 'Review updated' : 'Review published', 'success');
    } catch (error) {
      showToast?.(error.response?.data?.message || 'Could not save review', 'error');
    } finally { setReviewBusy(false); }
  };

  const startEditingReview = (review) => {
    setEditingReviewId(review._id);
    setReviewForm({ rating: review.rating, title: review.title, comment: review.comment });
    document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const removeReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await deleteReview(reviewId);
      const data = await getProductReviews(product._id);
      setReviews(data.reviews || []);
      setReviewMeta({ total: data.total || 0, distribution: data.distribution || {} });
      showToast?.('Review deleted', 'success');
    } catch (error) { showToast?.(error.response?.data?.message || 'Could not delete review', 'error'); }
  };

  const checkDelivery = () => {
    if (!/^\d{6}$/.test(pincode)) {
      setDeliveryMessage('Enter a valid 6-digit PIN code.');
      return;
    }
    setDeliveryMessage('Delivery available in 2–4 business days.');
  };

  if (status === 'loading') {
    return <div className="pd-loading"><div/><div/></div>;
  }

  if (status === 'error' || !product) {
    return <div className="container empty-state"><h3>Product not found</h3><p>This item may no longer be available.</p></div>;
  }

  return (
    <main className="pd-page">
      <div className="container pd-breadcrumb">Home <span>/</span> Products <span>/</span> {product.name}</div>

      <section className="container pd-hero">
        <div className="pd-gallery">
          <div className="pd-thumbs" aria-label="Product images">
            {(images.length ? images : [null]).map((image, index) => (
              <button key={image || index} className={activeImage === index ? 'active' : ''} onClick={() => setActiveImage(index)}>
                {image ? <img loading="lazy" decoding="async" src={image} alt={`${product.name} view ${index + 1}`} /> : <span>TG</span>}
              </button>
            ))}
          </div>

          <div className="pd-stage">
            {discount > 0 && <span className="pd-discount">−{discount}%</span>}
            <button
              className={`pd-heart ${isSaved(product._id) ? 'is-saved' : ''}`}
              aria-label="Save product"
              onClick={async () => {
                const result = await toggleWishlist(product);
                if (result?.requiresLogin) navigate('/login', { state: { from: `/products/${slug}` } });
              }}
            >♡</button>
            {images[activeImage]
              ? <img loading="eager" decoding="async" fetchPriority="high" src={images[activeImage]} alt={product.name} />
              : <div className="pd-no-image">TrueGoods</div>}
            <span className="pd-zoom">Move over image to zoom</span>
          </div>
        </div>

        <aside className="pd-panel">
          <span className="pd-kicker">{product.category?.name || 'TrueGoods collection'}</span>
          <h1>{product.name}</h1>

          <div className="pd-rating-row">
            <Stars value={rating} />
            <strong>{rating.toFixed(1)}</strong>
            <a href="#reviews">{ratingCount} reviews</a>
          </div>

          <div className="pd-price-row">
            <strong>{money(product.price)}</strong>
            {hasDiscount && <del>{money(product.compareAtPrice)}</del>}
            {discount > 0 && <span>You save {money(product.compareAtPrice - product.price)}</span>}
          </div>
          <p className="pd-tax">Inclusive of all taxes</p>
          <p className="pd-description">{product.description || 'A thoughtfully selected everyday product, chosen for its quality, usefulness and clean design.'}</p>

          <div className="pd-stock-line">
            <span className={product.stock > 0 ? 'in-stock' : 'out-stock'}>{product.stock > 0 ? '● In stock' : '● Sold out'}</span>
            {product.stock > 0 && product.stock < 10 && <small>Only {product.stock} left</small>}
          </div>

          <div className="pd-buy-row">
            <div className="pd-qty">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
              <span>{quantity}</span>
              <button disabled={quantity >= product.stock} onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}>+</button>
            </div>
            <button className="pd-add" disabled={!product.stock || addStatus === 'adding'} onClick={addToCart}>
              {addStatus === 'adding' ? 'Adding…' : addStatus === 'added' ? 'Added ✓' : addStatus === 'error' ? 'Try again' : product.stock ? 'Add to bag' : 'Sold out'}
            </button>
          </div>
          <button className="pd-buy-now" onClick={buyNow} disabled={!product.stock}>Buy now</button>

          <div className="pd-delivery-box">
            <div><strong>Check delivery</strong><span>Enter your PIN code for an estimated arrival date.</span></div>
            <div className="pd-pincode-row">
              <input value={pincode} maxLength={6} inputMode="numeric" placeholder="6-digit PIN code" onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))} />
              <button onClick={checkDelivery}>Check</button>
            </div>
            {deliveryMessage && <p>{deliveryMessage}</p>}
          </div>

          <div className="pd-benefits">
            <div><b>↗</b><span><strong>Free delivery</strong><small>Above ₹999</small></span></div>
            <div><b>↺</b><span><strong>Easy returns</strong><small>7-day window</small></span></div>
            <div><b>✓</b><span><strong>Secure payment</strong><small>Razorpay protected</small></span></div>
          </div>

          <div className="pd-accordions">
            {[
              ['details', 'Product details', product.description || 'Designed for everyday use with dependable materials and thoughtful finishing.'],
              ['shipping', 'Shipping & returns', 'Orders usually dispatch within 1–2 business days. Returns are accepted within 7 days of delivery.'],
              ['care', 'Care guide', 'Use a soft, dry cloth for regular cleaning. Store in a cool and dry place when not in use.'],
            ].map(([id, title, copy]) => (
              <div className="pd-accordion" key={id}>
                <button onClick={() => setOpenPanel(openPanel === id ? '' : id)}><span>{title}</span><b>{openPanel === id ? '−' : '+'}</b></button>
                {openPanel === id && <p>{copy}</p>}
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="container pd-spec-section">
        <div>
          <span className="pd-section-label">Product information</span>
          <h2>Everything worth knowing.</h2>
          <p>Clear details, useful specifications and no unnecessary shopping noise.</p>
        </div>
        <div className="pd-spec-table">
          <div><span>Brand</span><strong>{product.attributes?.Brand || product.attributes?.brand || 'TrueGoods Select'}</strong></div>
          <div><span>Category</span><strong>{product.category?.name || 'General'}</strong></div>
          <div><span>SKU</span><strong>{product.sku || product.slug?.toUpperCase()}</strong></div>
          <div><span>Availability</span><strong>{product.stock > 0 ? `${product.stock} units` : 'Out of stock'}</strong></div>
          {attributes.filter(([key]) => !['Brand', 'brand'].includes(key)).slice(0, 8).map(([key, value]) => (
            <div key={key}><span>{key}</span><strong>{value}</strong></div>
          ))}
        </div>
      </section>

      <section className="container pd-reviews" id="reviews">
        <div className="pd-review-summary">
          <span className="pd-section-label">Customer reviews</span>
          <h2>Real feedback from shoppers.</h2>
          <div className="pd-score"><strong>{rating.toFixed(1)}</strong><div><Stars value={rating} /><span>Based on {reviewMeta.total || ratingCount} reviews</span></div></div>
          {[5,4,3,2,1].map((value) => {
            const count = reviewMeta.distribution?.[value] || 0;
            const percent = reviewMeta.total ? Math.round((count / reviewMeta.total) * 100) : 0;
            return <div className="pd-rating-bar" key={value}><span>{value}</span><div><i style={{ width: `${percent}%` }} /></div><small>{percent}%</small></div>;
          })}
          <form className="pd-review-form" id="review-form" onSubmit={submitReview}>
            <h3>{editingReviewId ? 'Edit your review' : 'Write a review'}</h3>
            <label>Rating<select value={reviewForm.rating} onChange={(e) => setReviewForm((f) => ({ ...f, rating: Number(e.target.value) }))}>{[5,4,3,2,1].map((n) => <option key={n} value={n}>{n} stars</option>)}</select></label>
            <label>Title<input required maxLength="100" value={reviewForm.title} onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))} placeholder="Sum up your experience" /></label>
            <label>Comment<textarea required maxLength="1500" rows="5" value={reviewForm.comment} onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))} placeholder="What did you like or dislike?" /></label>
            <div className="pd-review-form-actions"><button disabled={reviewBusy}>{reviewBusy ? 'Saving…' : editingReviewId ? 'Update review' : 'Publish review'}</button>{editingReviewId && <button type="button" className="secondary" onClick={() => { setEditingReviewId(null); setReviewForm({ rating: 5, title: '', comment: '' }); }}>Cancel</button>}</div>
          </form>
        </div>
        <div className="pd-review-list">
          {reviews.length ? reviews.map((review) => (
            <article key={review._id}>
              <div><strong>{review.user?.name || 'TrueGoods shopper'}</strong>{review.verifiedPurchase && <span>Verified purchase</span>}</div>
              <Stars value={review.rating} />
              <h3>{review.title}</h3>
              <p>{review.comment}</p>
              <small>{new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</small>
              {(user?._id === review.user?._id || user?.id === review.user?._id) && <div className="pd-review-actions"><button onClick={() => startEditingReview(review)}>Edit</button><button onClick={() => removeReview(review._id)}>Delete</button></div>}
            </article>
          )) : <div className="pd-no-reviews"><h3>No reviews yet</h3><p>Be the first shopper to share an honest experience.</p></div>}
        </div>
      </section>

      <section className="container pd-editorial">
        <div><span>WHY YOU’LL LOVE IT</span><h2>Useful by design.<br/>Good by nature.</h2></div>
        <div className="pd-editorial-grid">
          <article><b>01</b><h3>Thoughtfully selected</h3><p>Chosen for everyday usefulness, not just shelf appeal.</p></article>
          <article><b>02</b><h3>Made to last</h3><p>Quality-focused products that deserve a place in your routine.</p></article>
          <article><b>03</b><h3>Honest value</h3><p>Clear pricing and no unnecessary shopping noise.</p></article>
        </div>
      </section>

      <div className="container pd-recommendations">
        <RecommendationCarousel title="You may also like" products={similar} loading={recLoading} />
        <RecommendationCarousel title="Frequently bought together" products={frequentlyBought} loading={recLoading} />
      </div>
    </main>
  );
}
