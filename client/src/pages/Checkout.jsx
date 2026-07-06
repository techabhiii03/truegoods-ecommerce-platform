import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { createRazorpayOrder, verifyPayment } from '../api/checkoutApi';
import './Checkout.css';

const formatPrice = (n) => `₹${Number(n).toFixed(2)}`;

// Loads the Razorpay Checkout script once and reuses it on subsequent visits
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const Checkout = () => {
  const { user } = useAuth();
  const { cart, emptyCart } = useCart();
  const navigate = useNavigate();

  const [status, setStatus] = useState('idle'); // idle | processing | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  const items = cart.items || [];
  const subtotal = items.reduce((sum, item) => sum + (item.product?.price ?? 0) * item.quantity, 0);

  const handlePay = async () => {
    setStatus('processing');
    setErrorMsg('');

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setStatus('error');
      setErrorMsg('Could not load the payment widget. Check your connection and try again.');
      return;
    }

    try {
      const order = await createRazorpayOrder();

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'TrueGoods',
        description: 'Order payment',
        order_id: order.orderId,
        handler: async (response) => {
          try {
            const result = await verifyPayment(response);
            await emptyCart();
            navigate('/orders', { state: { justPlacedOrderId: result.order._id } });
          } catch {
            setStatus('error');
            setErrorMsg('Payment succeeded but verification failed. Contact support with your payment id.');
          }
        },
        modal: {
          ondismiss: () => setStatus('idle'),
        },
        theme: { color: '#14213D' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        setStatus('error');
        setErrorMsg('Payment failed or was cancelled. You can try again.');
      });
      rzp.open();
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.response?.data?.message || 'Could not start checkout. Your cart may be empty.');
    }
  };

  if (items.length === 0) {
    return (
      <div className="container empty-state">
        <h3>Nothing to check out</h3>
        <p>Your cart is empty — add a product first.</p>
      </div>
    );
  }

  return (
    <div className="container checkout-page">
      <h1>Checkout</h1>

      {errorMsg && <div className="error-banner">{errorMsg}</div>}

      <div className="checkout-layout">
        <div className="checkout-items">
          {items.map((item) => (
            <div key={item.product._id} className="checkout-item">
              <span>
                {item.product.name} × {item.quantity}
              </span>
              <span className="price-tag">{formatPrice(item.product.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="checkout-summary">
          <div className="checkout-summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <p className="cart-summary-note">Final tax and shipping are calculated by the server.</p>

          <button className="btn btn-primary checkout-pay-btn" onClick={handlePay} disabled={status === 'processing'}>
            {status === 'processing' ? 'Opening payment…' : 'Pay with Razorpay'}
          </button>

          <p className="checkout-test-note">
            Test mode — use card <code>5267 3181 8797 5449</code>, any future expiry, any CVV.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
