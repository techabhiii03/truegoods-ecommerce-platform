import { useCallback, useEffect, useState } from 'react';
import { getCategories } from '../../api/productApi';
import { createCategory, updateCategory, deleteCategory } from '../../api/adminApi';
import './AdminShared.css';

const EMPTY_FORM = {
  name: '',
  description: '',
  coverImage: '',
  featured: true,
  displayOrder: 0,
};

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setCategories((await getCategories()).categories || []);
    } catch {
      setError('Could not load categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const reset = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      if (editing) await updateCategory(editing, form);
      else await createCategory(form);
      reset();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save category.');
    }
  };

  const startEdit = (category) => {
    setEditing(category._id);
    setForm({
      name: category.name,
      description: category.description || '',
      coverImage: category.coverImage || '',
      featured: category.featured !== false,
      displayOrder: category.displayOrder || 0,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this empty category?')) return;
    try {
      await deleteCategory(id);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete category.');
    }
  };

  return (
    <div>
      <div className="admin-header-row">
        <div>
          <h1>Categories</h1>
          <p className="admin-subtitle">Control category covers, order and homepage visibility.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <form className="admin-inline-card admin-category-form" onSubmit={submit}>
        <input
          placeholder="Category name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          required
        />
        <input
          placeholder="Short description"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
        <input
          placeholder="Cover image URL or /products/... path"
          value={form.coverImage}
          onChange={(event) => setForm({ ...form, coverImage: event.target.value })}
        />
        <input
          type="number"
          min="0"
          placeholder="Display order"
          value={form.displayOrder}
          onChange={(event) => setForm({ ...form, displayOrder: Number(event.target.value) })}
        />
        <label className="admin-check-field">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(event) => setForm({ ...form, featured: event.target.checked })}
          />
          Show on homepage
        </label>
        <button className="btn btn-primary">{editing ? 'Save changes' : 'Add category'}</button>
        {editing && <button type="button" className="btn btn-secondary" onClick={reset}>Cancel</button>}
      </form>

      {loading ? (
        <div className="empty-state">Loading categories…</div>
      ) : (
        <div className="admin-card-grid">
          {categories.map((category) => (
            <article className="admin-entity-card admin-category-card" key={category._id}>
              <div className="admin-category-preview">
                {category.coverImage || category.sampleImage ? (
                  <img loading="lazy" decoding="async" src={category.coverImage || category.sampleImage} alt={category.name} />
                ) : (
                  <span className="entity-icon">◇</span>
                )}
              </div>
              <div>
                <div className="admin-category-meta">
                  <span>{category.featured !== false ? 'Homepage' : 'Hidden'}</span>
                  <span>Order {category.displayOrder || 0}</span>
                  <span>{category.productCount || 0} products</span>
                </div>
                <h3>{category.name}</h3>
                <p>{category.description || 'No description added.'}</p>
                <small>/{category.slug}</small>
              </div>
              <div className="admin-table-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => startEdit(category)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => remove(category._id)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
