import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as cartApi from '../api/cartApi';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!user) {
      setCart({ items: [] });
      return;
    }
    setLoading(true);
    try {
      const { cart: freshCart } = await cartApi.getCart();
      setCart(freshCart);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addItem = useCallback(async (productId, quantity = 1) => {
    const { cart: updated } = await cartApi.addCartItem(productId, quantity);
    setCart(updated);
  }, []);

  const updateItem = useCallback(async (productId, quantity) => {
    const { cart: updated } = await cartApi.updateCartItem(productId, quantity);
    setCart(updated);
  }, []);

  const removeItem = useCallback(async (productId) => {
    const { cart: updated } = await cartApi.removeCartItem(productId);
    setCart(updated);
  }, []);

  const emptyCart = useCallback(async () => {
    await cartApi.clearCart();
    setCart({ items: [] });
  }, []);

  const itemCount = (cart.items || []).reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cart, loading, itemCount, refreshCart, addItem, updateItem, removeItem, emptyCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};
