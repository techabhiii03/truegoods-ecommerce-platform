import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => (
  <footer className="footer">
    <div className="container footer-main">
      <div className="footer-brand-block">
        <Link to="/" className="footer-brand">True<span>Goods</span><i>.</i></Link>
        <p>Useful finds, honest prices and a calmer way to shop online.</p>
        <div className="footer-socials"><a href="#instagram" aria-label="Instagram">ig</a><a href="#linkedin" aria-label="LinkedIn">in</a><a href="#github" aria-label="GitHub">gh</a></div>
      </div>
      <div className="footer-column"><h4>Shop</h4><Link to="/products">All products</Link><Link to="/products?sort=rating">Trending</Link><Link to="/products?sort=price_asc">Best deals</Link><Link to="/cart">Your cart</Link></div>
      <div className="footer-column"><h4>Account</h4><Link to="/login">Sign in</Link><Link to="/register">Create account</Link><Link to="/account?tab=orders">My orders</Link><Link to="/checkout">Checkout</Link></div>
      <div className="footer-column"><h4>TrueGoods</h4><a href="#about">Our story</a><a href="#contact">Contact</a><a href="#privacy">Privacy</a><a href="#terms">Terms</a></div>
    </div>
    <div className="container footer-bottom"><span>© {new Date().getFullYear()} TrueGoods. Made with intention.</span><div><span>Secure payments</span><strong>Razorpay</strong></div></div>
  </footer>
);

export default Footer;
