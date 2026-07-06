import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">
          TrueGoods<span className="navbar-brand-dot">.</span>
        </Link>

        <nav className="navbar-links">
          <Link to="/products">Shop</Link>
          {isAdmin && <Link to="/admin">Admin</Link>}
        </nav>

        <div className="navbar-actions">
          <Link to="/cart" className="cart-link">
            Cart
            {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
          </Link>

          {user ? (
            <div className="navbar-user">
              <Link to="/orders">Orders</Link>
              <button className="btn btn-secondary" onClick={handleLogout}>
                Log out
              </button>
            </div>
          ) : (
            <div className="navbar-user">
              <Link to="/login">Log in</Link>
              <Link to="/register" className="btn btn-primary">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
