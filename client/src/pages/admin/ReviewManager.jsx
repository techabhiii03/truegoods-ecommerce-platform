import { useEffect, useState } from 'react';
import { deleteReview, getAdminReviews } from '../../api/reviewApi';
import { useToast } from '../../context/ToastContext';
import './AdminShared.css';

export default function ReviewManager() {
  const [reviews, setReviews] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const load = async () => { setLoading(true); try { const data = await getAdminReviews(q); setReviews(data.reviews || []); } catch { showToast?.('Could not load reviews', 'error'); } finally { setLoading(false); } };
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [q]);
  const remove = async (id) => { if (!window.confirm('Remove this review?')) return; try { await deleteReview(id); setReviews((items) => items.filter((r) => r._id !== id)); showToast?.('Review removed', 'success'); } catch { showToast?.('Could not remove review', 'error'); } };
  return <section><div className="admin-header-row"><div><h1>Reviews</h1><p className="admin-subtitle">Moderate customer feedback and verified purchase reviews.</p></div></div><div className="admin-toolbar"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reviews, customers or products" /></div>{loading ? <p>Loading reviews…</p> : <div className="admin-card-grid">{reviews.map((review) => <article className="admin-entity-card" key={review._id}><div><div className="entity-icon">★</div><h3>{review.title}</h3><p>{review.comment}</p><small>{review.user?.name} · {review.product?.name}</small><div style={{marginTop:10}}><span className="status-pill status-active">{review.rating}/5 {review.verifiedPurchase ? '· verified' : ''}</span></div></div><div className="admin-table-actions" style={{marginTop:18}}><button className="btn-sm btn-danger" onClick={() => remove(review._id)}>Delete</button></div></article>)}</div>}</section>;
}
