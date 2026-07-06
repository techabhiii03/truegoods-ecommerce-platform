import { useState, useEffect, useCallback } from 'react';
import { getAllOrdersAdmin, updateOrderStatusAdmin } from '../../api/adminApi';
import './AdminShared.css';

const formatPrice = (n) => `₹${Number(n).toFixed(2)}`;
const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const STATUS_OPTIONS = ['processing', 'shipped', 'delivered', 'cancelled'];

const OrderManager = () => {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const { orders: fresh } = await getAllOrdersAdmin(params);
      setOrders(fresh);
    } catch {
      setError('Could not load orders. Confirm you are logged in as an admin.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatusAdmin(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, orderStatus: newStatus } : o))
      );
    } catch {
      setError('Could not update order status.');
    }
  };

  return (
    <div className="order-manager">
      <div className="admin-header-row">
        <h1>Orders</h1>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="empty-state">
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          Loading orders…
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <h3>No orders match</h3>
          <p>Try a different status filter.</p>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id}>
                <td className="mono">#{o._id.slice(-8)}</td>
                <td>
                  {o.user?.name}
                  <div className="order-manager-email">{o.user?.email}</div>
                </td>
                <td>{formatDate(o.createdAt)}</td>
                <td>{o.items.reduce((sum, i) => sum + i.quantity, 0)}</td>
                <td className="mono">{formatPrice(o.total)}</td>
                <td>
                  <span className={`status-pill ${o.paymentStatus === 'paid' ? 'status-active' : 'status-inactive'}`}>
                    {o.paymentStatus}
                  </span>
                </td>
                <td>
                  <select value={o.orderStatus} onChange={(e) => handleStatusChange(o._id, e.target.value)}>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s[0].toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default OrderManager;
