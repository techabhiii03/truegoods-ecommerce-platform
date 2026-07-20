import { Link } from 'react-router-dom';
import ProductCard from '../components/product/ProductCard';
import { useWishlist } from '../context/WishlistContext';
import './SmartFeatures.css';
export default function Wishlist() {
  const { products } = useWishlist();
  return <div className="container smart-page"><div className="smart-heading"><span>YOUR SAVED EDIT</span><h1>Wishlist</h1><p>Everything you loved, kept in one calm place.</p></div>{products.length ? <div className="smart-grid">{products.map((p) => <ProductCard product={p} key={p._id} />)}</div> : <div className="smart-empty"><b>♡</b><h2>Your wishlist is waiting</h2><p>Save products while you browse and they’ll appear here.</p><Link className="smart-primary" to="/products">Explore products</Link></div>}</div>;
}
