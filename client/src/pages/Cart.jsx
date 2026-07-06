import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Cart.css';

const formatPrice = (n) => `₹${Number(n).toFixed(2)}`;

const Cart = () => {
  const { cart, loading, updateItem, removeItem } = useCart();
  const navigate = useNavigate();
  const items = cart.items || [];

  const subtotal = items.reduce((sum, item) => {
    const price = item.product?.price ?? item.priceAtAdd;
    return sum + price * item.quantity;
  }, 0);

  if (loading) {
    return (
      <div className="container empty-state">
        <div className="spinner" style={{ margin: '0 auto 12px' }} />
        Loading cart…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container empty-state">
        <h3>Your cart is empty</h3>
        <p>Add something from the catalog to see it here.</p>
        <Link to="/products" className="btn btn-primary" style={{ marginTop: 16 }}>
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="container cart-page">
      <h1>Your cart</h1>

      <div className="cart-layout">
        <div className="cart-items">
          {items.map((item) => {
            const product = item.product;
            if (!product) return null;
            return (
              <div key={product._id} className="cart-item">
                <div className="cart-item-image">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} />
                  ) : (
                    <span>No image</span>
                  )}
                </div>

                <div className="cart-item-info">
                  <Link to={`/products/${product.slug}`} className="cart-item-name">
                    {product.name}
                  </Link>
                  <div className="price-tag">{formatPrice(product.price)}</div>
                </div>

                <div className="quantity-stepper">
                  <button
                    onClick={() => updateItem(product._id, Math.max(1, item.quantity - 1))}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => updateItem(product._id, item.quantity + 1)}
                    disabled={item.quantity >= product.stock}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <div className="cart-item-line-total">{formatPrice(product.price * item.quantity)}</div>

                <button className="btn btn-danger" onClick={() => removeItem(product._id)}>
                  Remove
                </button>
              </div>
            );
          })}
        </div>

        <div className="cart-summary">
          <h3>Summary</h3>
          <div className="cart-summary-row">
            <span>Subtotal</span>
            <span className="price-tag">{formatPrice(subtotal)}</span>
          </div>
          <p className="cart-summary-note">Tax and shipping are calculated at checkout.</p>
          <button className="btn btn-primary cart-checkout-btn" onClick={() => navigate('/checkout')}>
            Proceed to checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
