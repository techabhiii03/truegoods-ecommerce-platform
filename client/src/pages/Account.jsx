import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { getMyOrders } from '../api/checkoutApi';
import './Account.css';

const formatPrice = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDate = (value) => value
  ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  : 'Not available';

const STATUS_CLASS = {
  processing: 'account-status-processing',
  shipped: 'account-status-shipped',
  delivered: 'account-status-delivered',
  cancelled: 'account-status-cancelled',
};

const tabs = [
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'orders', label: 'My orders', icon: '📦' },
  { id: 'wishlist', label: 'Wishlist', icon: '♡' },
];

const Account = () => {
  const { user, logout } = useAuth();
  const { products: wishlistProducts, count: wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';
  const [orders, setOrders] = useState([]);
  const [ordersStatus, setOrdersStatus] = useState('loading');
  const [logoutOpen, setLogoutOpen] = useState(false);

  useEffect(() => {
    getMyOrders()
      .then((data) => {
        setOrders(data.orders || []);
        setOrdersStatus('ready');
      })
      .catch(() => setOrdersStatus('error'));
  }, []);

  const totalSpent = useMemo(
    () => orders.filter((order) => order.paymentStatus === 'paid').reduce((sum, order) => sum + Number(order.total || 0), 0),
    [orders]
  );

  const initials = (user?.name || 'TG')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const selectTab = (tab) => {
    setSearchParams(tab === 'profile' ? {} : { tab });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="account-page">
      <div className="container account-shell">
        <section className="account-hero">
          <div className="account-avatar" aria-hidden="true">{initials}</div>
          <div>
            <span className="account-eyebrow">My account</span>
            <h1>{user?.name}</h1>
            <p>{user?.email}</p>
          </div>
        </section>

        {location.state?.justPlacedOrderId && (
          <div className="account-success">Order placed successfully. You can follow its progress in My orders.</div>
        )}

        <div className="account-layout">
          <aside className="account-sidebar" aria-label="Account navigation">
            <div className="account-user-mini">
              <div className="account-avatar account-avatar-small">{initials}</div>
              <div>
                <strong>{user?.name}</strong>
                <span>{user?.role === 'admin' ? 'Administrator' : 'Customer'}</span>
              </div>
            </div>

            <nav>
              {tabs.map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  className={activeTab === tab.id ? 'active' : ''}
                  onClick={() => selectTab(tab.id)}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>

            <button type="button" className="account-logout" onClick={() => setLogoutOpen(true)}>
              <span>↗</span> Log out
            </button>
          </aside>

          <main className="account-content">
            {activeTab === 'profile' && (
              <section className="account-panel">
                <div className="account-panel-heading">
                  <div>
                    <span className="account-eyebrow">Personal details</span>
                    <h2>Your profile</h2>
                  </div>
                  <span className="account-role-badge">{user?.role || 'customer'}</span>
                </div>

                <div className="account-stats">
                  <button type="button" onClick={() => selectTab('orders')}>
                    <strong>{orders.length}</strong><span>Orders</span>
                  </button>
                  <button type="button" onClick={() => selectTab('wishlist')}>
                    <strong>{wishlistCount}</strong><span>Wishlist</span>
                  </button>
                  <div><strong>{formatPrice(totalSpent)}</strong><span>Total spent</span></div>
                </div>

                <div className="profile-details-grid">
                  <div><span>Full name</span><strong>{user?.name}</strong></div>
                  <div><span>Email address</span><strong>{user?.email}</strong></div>
                  <div><span>Account type</span><strong>{user?.role === 'admin' ? 'Administrator' : 'Customer'}</strong></div>
                  <div><span>Member since</span><strong>{formatDate(user?.createdAt)}</strong></div>
                </div>

                <div className="account-note">
                  <strong>Account information</strong>
                  <p>Your order history, wishlist and profile details are now available from one place.</p>
                </div>
              </section>
            )}

            {activeTab === 'orders' && (
              <section className="account-panel">
                <div className="account-panel-heading">
                  <div>
                    <span className="account-eyebrow">Purchase history</span>
                    <h2>My orders</h2>
                  </div>
                  <span>{orders.length} total</span>
                </div>

                {ordersStatus === 'loading' && <div className="account-message">Loading your orders…</div>}
                {ordersStatus === 'error' && <div className="account-message account-error">Could not load your orders. Please refresh and try again.</div>}
                {ordersStatus === 'ready' && orders.length === 0 && (
                  <div className="account-empty">
                    <h3>No orders yet</h3>
                    <p>Your completed purchases will appear here.</p>
                    <Link to="/products">Start shopping</Link>
                  </div>
                )}

                <div className="account-orders-list">
                  {orders.map((order) => (
                    <article className="account-order-card" key={order._id}>
                      <header>
                        <div>
                          <strong>Order #{order._id.slice(-8).toUpperCase()}</strong>
                          <span>{formatDate(order.createdAt)}</span>
                        </div>
                        <span className={`account-order-status ${STATUS_CLASS[order.orderStatus] || ''}`}>
                          {order.orderStatus}
                        </span>
                      </header>
                      <div className="account-order-items">
                        {order.items.slice(0, 3).map((item, index) => (
                          <div key={`${order._id}-${index}`}>
                            <span>{item.name} × {item.quantity}</span>
                            <strong>{formatPrice(item.price * item.quantity)}</strong>
                          </div>
                        ))}
                        {order.items.length > 3 && <small>+{order.items.length - 3} more items</small>}
                      </div>
                      <footer>
                        <span>Order total</span>
                        <strong>{formatPrice(order.total)}</strong>
                      </footer>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'wishlist' && (
              <section className="account-panel">
                <div className="account-panel-heading">
                  <div>
                    <span className="account-eyebrow">Saved for later</span>
                    <h2>Your wishlist</h2>
                  </div>
                  <span>{wishlistCount} items</span>
                </div>

                {wishlistProducts.length === 0 ? (
                  <div className="account-empty">
                    <h3>Your wishlist is empty</h3>
                    <p>Save products you would like to revisit later.</p>
                    <Link to="/products">Explore products</Link>
                  </div>
                ) : (
                  <div className="account-wishlist-grid">
                    {wishlistProducts.slice(0, 6).map((product) => (
                      <Link to={`/products/${product.slug}`} key={product._id} className="account-wishlist-card">
                        <img decoding="async" src={product.images?.[0]} alt={product.name} loading="lazy" />
                        <div>
                          <span>{product.category?.name || product.brand || 'TrueGoods'}</span>
                          <strong>{product.name}</strong>
                          <b>{formatPrice(product.price)}</b>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                {wishlistProducts.length > 6 && <Link className="account-view-all" to="/wishlist">View complete wishlist</Link>}
              </section>
            )}
          </main>
        </div>
      </div>

      {logoutOpen && (
        <div className="account-modal-backdrop" role="presentation" onMouseDown={() => setLogoutOpen(false)}>
          <div className="account-modal" role="dialog" aria-modal="true" aria-labelledby="logout-title" onMouseDown={(event) => event.stopPropagation()}>
            <span className="account-modal-icon">↗</span>
            <h2 id="logout-title">Log out of TrueGoods?</h2>
            <p>You will need to sign in again to access your orders and wishlist.</p>
            <div>
              <button type="button" onClick={() => setLogoutOpen(false)}>Cancel</button>
              <button type="button" className="danger" onClick={handleLogout}>Log out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;
