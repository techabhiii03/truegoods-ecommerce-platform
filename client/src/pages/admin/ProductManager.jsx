import { useState, useEffect, useCallback } from 'react';
import { getProducts, getCategories } from '../../api/productApi';
import {
  createProduct,
  updateProduct,
  updateProductStock,
  deactivateProduct,
  createCategory,
} from '../../api/adminApi';
import './AdminShared.css';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  compareAtPrice: '',
  category: '',
  stock: '',
  sku: '',
  images: '',
};

const formatPrice = (n) => `₹${Number(n).toFixed(2)}`;

const ProductManager = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [categorySuccess, setCategorySuccess] = useState('');
  const [stockEdits, setStockEdits] = useState({}); // { productId: newStockValue }

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        getProducts({ limit: 100 }),
        getCategories(),
      ]);
      setProducts(productsRes.products);
      setCategories(categoriesRes.categories);
    } catch {
      setError('Could not load products. Confirm you are logged in as an admin.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setFormOpen(true);
  };

  const openEditForm = (product) => {
    setEditingId(product._id);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      compareAtPrice: product.compareAtPrice || '',
      category: product.category?._id || product.category || '',
      stock: product.stock,
      sku: product.sku || '',
      images: (product.images || []).join(', '),
    });
    setFormError('');
    setFormOpen(true);
  };

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.name || !form.description || !form.price || !form.category) {
      setFormError('Name, description, price, and category are required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
        category: form.category,
        stock: Number(form.stock) || 0,
        sku: form.sku || undefined,
        images: form.images
          ? form.images.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };

      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        await createProduct(payload);
      }

      setFormOpen(false);
      await loadData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not save product.');
    } finally {
      setSaving(false);
    }
  };

  const handleStockSave = async (productId) => {
    const newStock = stockEdits[productId];
    if (newStock === undefined || newStock === '') return;
    try {
      await updateProductStock(productId, Number(newStock));
      setStockEdits((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      await loadData();
    } catch {
      setError('Could not update stock.');
    }
  };

  const handleDeactivate = async (productId) => {
    if (!confirm('Deactivate this product? It will no longer appear in the storefront.')) return;
    try {
      await deactivateProduct(productId);
      await loadData();
    } catch {
      setError('Could not deactivate product.');
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await createCategory(newCategoryName.trim());
      setNewCategoryName('');
      const { categories: fresh } = await getCategories();
      setCategories(fresh);
      setCategorySuccess(`"${newCategoryName.trim()}" added`);
      setTimeout(() => setCategorySuccess(''), 2000);
    } catch {
      setError('Could not create category — it may already exist.');
    }
  };

  return (
    <div className="product-manager">
      <div className="admin-header-row">
        <h1>Products</h1>
        <button className="btn btn-primary" onClick={openCreateForm}>
          + New product
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

     <div className="quick-category-form">
        <input
          type="text"
          placeholder="New category name…"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
        />
        <button className="btn btn-secondary" onClick={handleCreateCategory}>
          Add category
        </button>
      </div>
      {categorySuccess && <div className="category-success">{categorySuccess}</div>}

      {formOpen && (
        <form className="product-form" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Edit product' : 'New product'}</h3>

          {formError && <div className="error-banner">{formError}</div>}

          <div className="product-form-grid">
            <div className="form-field">
              <label>Name</label>
              <input name="name" value={form.name} onChange={handleFormChange} required />
            </div>

            <div className="form-field">
              <label>Category</label>
              <select name="category" value={form.category} onChange={handleFormChange} required>
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Price (₹)</label>
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="form-field">
              <label>Compare-at price (optional)</label>
              <input
                name="compareAtPrice"
                type="number"
                step="0.01"
                min="0"
                value={form.compareAtPrice}
                onChange={handleFormChange}
              />
            </div>

            <div className="form-field">
              <label>Stock</label>
              <input
                name="stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={handleFormChange}
              />
            </div>

            <div className="form-field">
              <label>SKU (optional)</label>
              <input name="sku" value={form.sku} onChange={handleFormChange} />
            </div>

            <div className="form-field product-form-full">
              <label>Image URLs (comma-separated, optional)</label>
              <input name="images" value={form.images} onChange={handleFormChange} placeholder="https://…, https://…" />
            </div>

            <div className="form-field product-form-full">
              <label>Description</label>
              <textarea
                name="description"
                rows={3}
                value={form.description}
                onChange={handleFormChange}
                required
              />
            </div>
          </div>

          <div className="product-form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create product'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="empty-state">
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          Loading products…
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <h3>No products yet</h3>
          <p>Create your first product above.</p>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id}>
                <td>{p.name}</td>
                <td>{p.category?.name || '—'}</td>
                <td className="mono">{formatPrice(p.price)}</td>
                <td>
                  <div className="stock-edit">
                    <input
                      type="number"
                      min="0"
                      value={stockEdits[p._id] ?? p.stock}
                      onChange={(e) => setStockEdits((prev) => ({ ...prev, [p._id]: e.target.value }))}
                    />
                    {stockEdits[p._id] !== undefined && Number(stockEdits[p._id]) !== p.stock && (
                      <button className="btn btn-secondary btn-sm" onClick={() => handleStockSave(p._id)}>
                        Save
                      </button>
                    )}
                  </div>
                </td>
                <td>
                  <span className={`status-pill ${p.isActive ? 'status-active' : 'status-inactive'}`}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="admin-table-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => openEditForm(p)}>
                    Edit
                  </button>
                  {p.isActive && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(p._id)}>
                      Deactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ProductManager;
