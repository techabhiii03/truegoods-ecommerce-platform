import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProducts, getCategories } from '../api/productApi';
import ProductCard from '../components/product/ProductCard';
import './ProductListing.css';

const ProductListing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || '';

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(data.categories))
      .catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (q) params.q = q;
      if (category) params.category = category;
      if (sort) params.sort = sort;
      const data = await getProducts(params);
      setProducts(data.products);
    } catch {
      setError('Could not load products. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, [q, category, sort]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  return (
    <div className="container listing-page">
      <div className="listing-header">
        <h1>Shop everything</h1>
        <p className="listing-subtitle">Search, filter, and sort the full catalog.</p>
      </div>

      <div className="listing-controls">
        <input
          type="text"
          placeholder="Search products…"
          defaultValue={q}
          onKeyDown={(e) => {
            if (e.key === 'Enter') updateParam('q', e.target.value);
          }}
          onBlur={(e) => updateParam('q', e.target.value)}
        />

        <select value={category} onChange={(e) => updateParam('category', e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <select value={sort} onChange={(e) => updateParam('sort', e.target.value)}>
          <option value="">Newest first</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="rating">Top rated</option>
        </select>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="empty-state">
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          Loading products…
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <h3>No products match yet</h3>
          <p>Try clearing filters, or add products from the admin dashboard.</p>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductListing;
