import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getWishlist, toggleWishlist as toggleWishlistRequest } from '../api/wishlistApi';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const WishlistContext = createContext(null);
export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  useEffect(() => { if (!user) return setProducts([]); getWishlist().then((d) => setProducts(d.products || [])).catch(() => {}); }, [user]);
  const ids = useMemo(() => new Set(products.map((p) => p._id)), [products]);
  const toggle = useCallback(async (product) => {
    if (!user) return { requiresLogin: true };
    const { saved } = await toggleWishlistRequest(product._id);
    setProducts((current) => saved ? [product, ...current.filter((p) => p._id !== product._id)] : current.filter((p) => p._id !== product._id));
    showToast(saved ? `${product.name} saved to your wishlist.` : `${product.name} removed from wishlist.`, { title: saved ? 'Saved' : 'Removed' });
    return { saved };
  }, [user, showToast]);
  return <WishlistContext.Provider value={{ products, count: products.length, isSaved: (id) => ids.has(id), toggle }}>{children}</WishlistContext.Provider>;
}
export const useWishlist = () => { const value = useContext(WishlistContext); if (!value) throw new Error('useWishlist must be used within WishlistProvider'); return value; };
