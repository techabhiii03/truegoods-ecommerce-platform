import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminDashboard } from '../../api/adminApi';
import './AdminDashboard.css';

const currency = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
const compact = (value) => new Intl.NumberFormat('en-IN', { notation: 'compact' }).format(value || 0);
const date = (value) => new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

const iconFor = { revenue: '₹', orders: '↗', customers: '♙', products: '◇' };

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAdminDashboard()
      .then(setData)
      .catch((err) => setError(err.response?.data?.message || 'Could not load dashboard analytics.'))
      .finally(() => setLoading(false));
  }, []);

  const maxRevenue = useMemo(
    () => Math.max(...(data?.monthlyPerformance || []).map((item) => item.revenue), 1),
    [data]
  );

  if (loading) return <div className="admin-dashboard-state"><div className="spinner" />Building your dashboard…</div>;
  if (error) return <div className="error-banner">{error}</div>;

  const { summary, monthlyPerformance, statusBreakdown, topProducts, lowStockProducts, recentOrders } = data;
  const cards = [
    { key: 'revenue', label: 'Total revenue', value: currency(summary.revenue), change: summary.revenueChange, note: 'vs last month' },
    { key: 'orders', label: 'Total orders', value: compact(summary.orders), change: summary.orderChange, note: 'vs last month' },
    { key: 'customers', label: 'Customers', value: compact(summary.customers), note: 'registered shoppers' },
    { key: 'products', label: 'Active products', value: compact(summary.products), note: `${summary.lowStockCount} need attention` },
  ];
  const statusTotal = Object.values(statusBreakdown).reduce((sum, value) => sum + value, 0) || 1;

  return (
    <section className="admin-dashboard">
      <header className="dashboard-heading">
        <div>
          <p className="dashboard-eyebrow">Store overview</p>
          <h1>Good morning, Admin.</h1>
          <p>Here is what is happening across TrueGoods today.</p>
        </div>
        <div className="dashboard-heading-actions">
          <Link className="dashboard-secondary-action" to="/">View storefront</Link>
          <Link className="dashboard-primary-action" to="/admin/products">+ Add product</Link>
        </div>
      </header>

      <div className="metric-grid">
        {cards.map((card) => (
          <article className="metric-card" key={card.key}>
            <div className={`metric-icon metric-${card.key}`}>{iconFor[card.key]}</div>
            <p>{card.label}</p>
            <strong>{card.value}</strong>
            <span className={card.change < 0 ? 'metric-change negative' : 'metric-change'}>
              {card.change !== undefined && `${card.change >= 0 ? '↑' : '↓'} ${Math.abs(card.change)}% `}{card.note}
            </span>
          </article>
        ))}
      </div>

      <div className="dashboard-main-grid">
        <article className="dashboard-panel revenue-panel">
          <div className="panel-heading">
            <div><p>Performance</p><h2>Revenue overview</h2></div>
            <span>Last 6 months</span>
          </div>
          <div className="revenue-summary"><strong>{currency(summary.revenue)}</strong><span>Avg. order {currency(summary.averageOrderValue)}</span></div>
          <div className="bar-chart" aria-label="Six month revenue chart">
            {monthlyPerformance.map((item) => (
              <div className="bar-column" key={item.label}>
                <div className="bar-value">{item.revenue ? compact(item.revenue) : '—'}</div>
                <div className="bar-track"><div className="bar-fill" style={{ height: `${Math.max((item.revenue / maxRevenue) * 100, item.revenue ? 8 : 2)}%` }} /></div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-panel status-panel">
          <div className="panel-heading"><div><p>Fulfilment</p><h2>Order status</h2></div></div>
          <div className="donut-wrap">
            <div className="status-donut" style={{ '--delivered': `${(statusBreakdown.delivered / statusTotal) * 100}%`, '--shipped': `${((statusBreakdown.delivered + statusBreakdown.shipped) / statusTotal) * 100}%`, '--processing': `${((statusBreakdown.delivered + statusBreakdown.shipped + statusBreakdown.processing) / statusTotal) * 100}%` }}>
              <div><strong>{summary.orders}</strong><span>orders</span></div>
            </div>
          </div>
          <div className="status-legend">
            {Object.entries(statusBreakdown).map(([key, value]) => <div key={key}><i className={`dot ${key}`} /><span>{key}</span><strong>{value}</strong></div>)}
          </div>
        </article>
      </div>

      <div className="dashboard-bottom-grid">
        <article className="dashboard-panel">
          <div className="panel-heading"><div><p>Sales</p><h2>Top products</h2></div><Link to="/admin/products">Manage</Link></div>
          <div className="top-products-list">
            {topProducts.length ? topProducts.map((product, index) => (
              <div className="top-product-row" key={`${product._id}-${product.name}`}>
                <span className="product-rank">{String(index + 1).padStart(2, '0')}</span>
                <div><strong>{product.name}</strong><small>{product.units} units sold</small></div>
                <b>{currency(product.revenue)}</b>
              </div>
            )) : <p className="dashboard-empty">Sales will appear after your first order.</p>}
          </div>
        </article>

        <article className="dashboard-panel">
          <div className="panel-heading"><div><p>Inventory</p><h2>Low stock</h2></div><Link to="/admin/products">View all</Link></div>
          <div className="stock-list">
            {lowStockProducts.length ? lowStockProducts.map((product) => (
              <div className="stock-row" key={product._id}>
                <img loading="lazy" decoding="async" src={product.images?.[0] || 'https://placehold.co/96x96/f4f0e8/222?text=TG'} alt="" />
                <div><strong>{product.name}</strong><small>{currency(product.price)}</small></div>
                <span className={product.stock <= 3 ? 'stock-critical' : ''}>{product.stock} left</span>
              </div>
            )) : <p className="dashboard-empty">Inventory levels look healthy.</p>}
          </div>
        </article>
      </div>

      <article className="dashboard-panel recent-orders-panel">
        <div className="panel-heading"><div><p>Latest activity</p><h2>Recent orders</h2></div><Link to="/admin/orders">View all orders</Link></div>
        <div className="dashboard-table-wrap">
          <table className="dashboard-orders-table">
            <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
            <tbody>{recentOrders.map((order) => <tr key={order._id}>
              <td className="order-code">#{order._id.slice(-7).toUpperCase()}</td>
              <td><strong>{order.user?.name || 'Guest'}</strong><small>{order.user?.email}</small></td>
              <td>{date(order.createdAt)}</td><td>{currency(order.total)}</td>
              <td><span className={`dashboard-pill payment-${order.paymentStatus}`}>{order.paymentStatus}</span></td>
              <td><span className={`dashboard-pill order-${order.orderStatus}`}>{order.orderStatus}</span></td>
            </tr>)}</tbody>
          </table>
        </div>
      </article>
    </section>
  );
};

export default AdminDashboard;
