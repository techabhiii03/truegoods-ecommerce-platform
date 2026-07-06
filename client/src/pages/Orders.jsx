import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getMyOrders } from '../api/checkoutApi';
import './Orders.css';

const formatPrice = (n) => `₹${Number(n).toFixed(2)}`;
const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const statusColors = {
  processing: 'status-processing',
  shipped: 'status-shipped',
  delivered: 'status-delivered',
  cancelled: 'status-cancelled',
};

const Orders = () => {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    getMyOrders()
      .then((data) => {
        setOrders(data.orders);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'loading') {
    return (
      <div className="container empty-state">
        <div className="spinner" style={{ margin: '0 auto 12px' }} />
        Loading orders…
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container empty-state">
        <h3>No orders yet</h3>
        <p>Once you complete a checkout, it'll show up here.</p>
      </div>
    );
  }

  return (
    <div className="container orders-page">
      <h1>Your orders</h1>

      {location.state?.justPlacedOrderId && (
        <div className="order-success-banner">Order placed successfully — thank you!</div>
      )}

      <div className="orders-list">
        {orders.map((order) => (
          <div key={order._id} className="order-card">
            <div className="order-card-header">
              <div>
                <span className="order-id">#{order._id.slice(-8)}</span>
                <span className="order-date">{formatDate(order.createdAt)}</span>
              </div>
              <span className={`order-status ${statusColors[order.orderStatus] || ''}`}>
                {order.orderStatus}
              </span>
            </div>

            <div className="order-card-items">
              {order.items.map((item, i) => (
                <div key={i} className="order-item-row">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="order-card-footer">
              <span>Total</span>
              <span className="price-tag">{formatPrice(order.total)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
