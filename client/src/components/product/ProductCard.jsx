import { Link } from 'react-router-dom';
import './ProductCard.css';

const formatPrice = (n) => `₹${Number(n).toFixed(2)}`;

const ProductCard = ({ product }) => {
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <Link to={`/products/${product.slug}`} className="product-card">
      <div className="product-card-image">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} loading="lazy" />
        ) : (
          <div className="product-card-placeholder">No image</div>
        )}
        {product.stock === 0 && <span className="product-card-oos">Out of stock</span>}
      </div>

      <div className="product-card-body">
        <h3 className="product-card-name">{product.name}</h3>
        <div className="price-tag">
          {hasDiscount && <span className="strike">{formatPrice(product.compareAtPrice)}</span>}
          {formatPrice(product.price)}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
