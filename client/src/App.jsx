import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { WishlistProvider } from './context/WishlistContext';
import { CompareProvider } from './context/CompareContext';
import { ThemeProvider } from './context/ThemeContext';
import ExperienceLayer from './components/experience/ExperienceLayer';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';
import PageLoader from './components/ui/PageLoader';

const Home = lazy(() => import('./pages/Home'));
const ProductListing = lazy(() => import('./pages/ProductListing'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Account = lazy(() => import('./pages/Account'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Compare = lazy(() => import('./pages/Compare'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ProductManager = lazy(() => import('./pages/admin/ProductManager'));
const OrderManager = lazy(() => import('./pages/admin/OrderManager'));
const CategoryManager = lazy(() => import('./pages/admin/CategoryManager'));
const UserManager = lazy(() => import('./pages/admin/UserManager'));
const ReviewManager = lazy(() => import('./pages/admin/ReviewManager'));

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <WishlistProvider>
              <CompareProvider>
                <CartProvider>
                  <ExperienceLayer />
                  <Navbar />
                  <main style={{ flex: 1 }}>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/products" element={<ProductListing />} />
                        <Route path="/products/:slug" element={<ProductDetail />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/compare" element={<Compare />} />
                        <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                        <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                        <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
                        <Route path="/orders" element={<Navigate to="/account?tab=orders" replace />} />
                        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                          <Route index element={<AdminDashboard />} />
                          <Route path="products" element={<ProductManager />} />
                          <Route path="orders" element={<OrderManager />} />
                          <Route path="categories" element={<CategoryManager />} />
                          <Route path="users" element={<UserManager />} />
                          <Route path="reviews" element={<ReviewManager />} />
                        </Route>
                      </Routes>
                    </Suspense>
                  </main>
                  <Footer />
                </CartProvider>
              </CompareProvider>
            </WishlistProvider>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
