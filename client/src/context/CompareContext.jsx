import { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from './ToastContext';
const CompareContext = createContext(null);
export function CompareProvider({ children }) {
  const { showToast } = useToast();
  const [products, setProducts] = useState(() => { try { return JSON.parse(localStorage.getItem('truegoods-compare')) || []; } catch { return []; } });
  useEffect(() => localStorage.setItem('truegoods-compare', JSON.stringify(products)), [products]);
  const toggle = (product) => setProducts((current) => {
    if (current.some((p) => p._id === product._id)) return current.filter((p) => p._id !== product._id);
    if (current.length >= 3) { showToast('You can compare up to three products.', { type: 'error' }); return current; }
    showToast(`${product.name} added to comparison.`, { title: 'Compare' }); return [...current, product];
  });
  return <CompareContext.Provider value={{ products, count: products.length, has: (id) => products.some((p) => p._id === id), toggle, clear: () => setProducts([]) }}>{children}</CompareContext.Provider>;
}
export const useCompare = () => useContext(CompareContext);
