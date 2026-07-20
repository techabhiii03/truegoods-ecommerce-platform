import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCompare } from '../../context/CompareContext';
import { useTheme } from '../../context/ThemeContext';
import './Navbar.css';

const Icon = ({ name, size = 20 }) => {
  const paths = {
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    heart: <path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.4 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>,
    compare: <><path d="M7 7h13M17 4l3 3-3 3M17 17H4M7 14l-3 3 3 3"/></>,
    bag: <><path d="M6 8h12l1 13H5L6 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    arrow: <path d="m9 18 6-6-6-6"/>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></>,
    moon: <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
};

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { count: compareCount } = useCompare();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    navigate('/');
  };

  const handleSearch = (event) => {
    event.preventDefault();
    if (!query.trim()) return;
    navigate(`/products?q=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <div className="announcement-bar">
        <div className="container announcement-inner">
          <span>Free delivery on orders above ₹999</span>
          <span className="announcement-code">Use code <strong>TRUE10</strong> for 10% off</span>
        </div>
      </div>

      <header className="navbar">
        <div className="container navbar-inner">
          <button className="navbar-icon mobile-menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            <Icon name={menuOpen ? 'close' : 'menu'} />
          </button>

          <Link to="/" className="navbar-brand" onClick={closeMenu}>
            True<span>Goods</span><i>.</i>
          </Link>

          <nav className={`navbar-links ${menuOpen ? 'is-open' : ''}`}>
            <Link to="/" onClick={closeMenu}>Home</Link>
            <Link to="/products" onClick={closeMenu}>Shop</Link>
            <Link to="/products?sort=rating" onClick={closeMenu}>Trending</Link>
            <Link to="/products?sort=price_asc" onClick={closeMenu}>Best deals</Link>
            {isAdmin && <Link to="/admin" onClick={closeMenu}>Admin</Link>}

            <div className="mobile-account-links">
              {user ? (
                <>
                  <Link to="/account?tab=orders" onClick={closeMenu}>My orders <Icon name="arrow" size={17} /></Link>
                  <button onClick={handleLogout}>Log out</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={closeMenu}>Log in</Link>
                  <Link to="/register" className="mobile-signup" onClick={closeMenu}>Create account</Link>
                </>
              )}
            </div>
          </nav>

          <div className="navbar-actions">
            <button className="navbar-icon search-toggle" onClick={() => setSearchOpen(!searchOpen)} aria-label="Search products">
              <Icon name="search" />
            </button>
            <button className="navbar-icon theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`} title={`Switch to ${isDark ? 'light' : 'dark'} theme`}>
              <Icon name={isDark ? 'sun' : 'moon'} />
            </button>

            {user ? (
              <Link to="/account" className="navbar-icon account-link" aria-label="Your account" title={user.name || 'Your account'}>
                <Icon name="user" />
              </Link>
            ) : (
              <Link to="/login" className="navbar-icon account-link" aria-label="Log in">
                <Icon name="user" />
              </Link>
            )}

            <Link to="/compare" className="navbar-icon cart-link" aria-label="Compare products"><Icon name="compare" />{compareCount > 0 && <span className="cart-badge">{compareCount}</span>}</Link>
            {user && <Link to="/wishlist" className="navbar-icon cart-link" aria-label="Wishlist"><Icon name="heart" />{wishlistCount > 0 && <span className="cart-badge">{wishlistCount > 9 ? '9+' : wishlistCount}</span>}</Link>}
            <Link to="/cart" className="navbar-icon cart-link" aria-label={`Cart with ${itemCount} items`}>
              <Icon name="bag" />
              {itemCount > 0 && <span className="cart-badge">{itemCount > 9 ? '9+' : itemCount}</span>}
            </Link>
          </div>
        </div>

        <form className={`navbar-search ${searchOpen ? 'is-open' : ''}`} onSubmit={handleSearch}>
          <div className="container navbar-search-inner">
            <Icon name="search" />
            <input autoFocus={searchOpen} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="What are you looking for?" aria-label="Search products" />
            <button type="submit">Search</button>
          </div>
        </form>
      </header>
    </>
  );
};

export default Navbar;
