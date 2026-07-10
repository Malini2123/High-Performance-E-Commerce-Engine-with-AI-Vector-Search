import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

/* ─── tiny helpers ─── */
const CATEGORIES = ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Food'];

const EMPTY_FORM = {
  name: '', category: 'Electronics', price: '', stock: '',
  description: '', image: ''
};

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '24px 28px',
      boxShadow: '0 2px 12px rgba(11,47,29,0.06)', border: '1px solid #DCE8E0',
      display: 'flex', alignItems: 'center', gap: 18, flex: '1 1 180px', minWidth: 160
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: color + '18', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 22, flexShrink: 0
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 13, color: '#789687', fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#0F291E', lineHeight: 1.2 }}>{value}</div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div style={{
        width: 44, height: 44, border: '4px solid #DCE8E0',
        borderTopColor: '#16A34A', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
    </div>
  );
}

/* ─── Edit / Add Modal ─── */
function ProductModal({ product, onClose, onSaved }) {
  const isEdit = !!product?._id;
  const [form, setForm] = useState(product ? {
    name: product.name, category: product.category, price: product.price,
    stock: product.stock, description: product.description || '', image: product.image || ''
  } : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handle = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (!form.name.trim() || !form.price || !form.stock || !form.description.trim()) {
      setErr('Name, price, stock, and description are required.'); return;
    }
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), stock: Number(form.stock) };
      if (isEdit) {
        await apiClient.put(`/products/${product._id}`, payload);
      } else {
        await apiClient.post('/products', payload);
      }
      onSaved();
    } catch (e) {
      setErr(e.response?.data?.message || e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(11,47,29,0.45)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560,
        boxShadow: '0 24px 60px rgba(11,47,29,0.18)', padding: 32,
        maxHeight: '90vh', overflowY: 'auto'
      }} onClick={e => e.stopPropagation()}>

        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F291E' }}>
            {isEdit ? '✏️ Edit Product' : '➕ Add Product'}
          </h2>
          <button onClick={onClose} style={{
            background: '#F4F9F5', border: 'none', cursor: 'pointer',
            width: 36, height: 36, borderRadius: 10, fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#789687'
          }}>✕</button>
        </div>

        {err && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10,
            padding: '10px 14px', color: '#DC2626', fontSize: 13, marginBottom: 16
          }}>{err}</div>
        )}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Name */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#375244', marginBottom: 6 }}>
              Product Name *
            </label>
            <input value={form.name} onChange={handle('name')}
              placeholder="e.g. Sony WH-1000XM5 Headphones"
              style={{ width: '100%', borderRadius: 10, padding: '10px 14px', border: '1.5px solid #DCE8E0', fontSize: 14 }} />
          </div>

          {/* Category + Price row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#375244', marginBottom: 6 }}>Category *</label>
              <select value={form.category} onChange={handle('category')}
                style={{ width: '100%', borderRadius: 10, padding: '10px 14px', border: '1.5px solid #DCE8E0', fontSize: 14 }}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#375244', marginBottom: 6 }}>Price (₹) *</label>
              <input type="number" min="0" value={form.price} onChange={handle('price')}
                placeholder="e.g. 29999"
                style={{ width: '100%', borderRadius: 10, padding: '10px 14px', border: '1.5px solid #DCE8E0', fontSize: 14 }} />
            </div>
          </div>

          {/* Stock */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#375244', marginBottom: 6 }}>Stock *</label>
            <input type="number" min="0" value={form.stock} onChange={handle('stock')}
              placeholder="e.g. 50"
              style={{ width: '100%', borderRadius: 10, padding: '10px 14px', border: '1.5px solid #DCE8E0', fontSize: 14 }} />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#375244', marginBottom: 6 }}>Description *</label>
            <textarea value={form.description} onChange={handle('description')}
              placeholder="Describe the product..."
              rows={3}
              style={{ width: '100%', borderRadius: 10, padding: '10px 14px', border: '1.5px solid #DCE8E0', fontSize: 14, resize: 'vertical' }} />
          </div>

          {/* Image URL */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#375244', marginBottom: 6 }}>Image URL (optional)</label>
            <input value={form.image} onChange={handle('image')}
              placeholder="https://..."
              style={{ width: '100%', borderRadius: 10, padding: '10px 14px', border: '1.5px solid #DCE8E0', fontSize: 14 }} />
          </div>

          {/* actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{
              padding: '11px 22px', borderRadius: 10, border: '1.5px solid #DCE8E0',
              background: '#fff', color: '#375244', fontWeight: 600, cursor: 'pointer', fontSize: 14
            }}>Cancel</button>
            <button type="submit" disabled={saving} style={{
              padding: '11px 28px', borderRadius: 10, border: 'none',
              background: saving ? '#A7D9B5' : '#16A34A', color: '#fff',
              fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14,
              transition: 'all 0.2s'
            }}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Delete confirm ─── */
function DeleteConfirm({ product, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  async function doDelete() {
    setDeleting(true);
    try {
      await apiClient.delete(`/products/${product._id}`);
      onDeleted();
    } catch (e) {
      alert(e.response?.data?.message || e.message);
      setDeleting(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(11,47,29,0.45)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 440,
        boxShadow: '0 24px 60px rgba(11,47,29,0.18)', padding: 32
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>🗑️</div>
        <h3 style={{ textAlign: 'center', fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Delete Product?</h3>
        <p style={{ textAlign: 'center', color: '#789687', fontSize: 14, marginBottom: 24 }}>
          <strong style={{ color: '#0F291E' }}>{product.name}</strong> will be permanently deleted and
          the Redis cache will be automatically invalidated.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={onClose} style={{
            padding: '11px 24px', borderRadius: 10, border: '1.5px solid #DCE8E0',
            background: '#fff', color: '#375244', fontWeight: 600, cursor: 'pointer', fontSize: 14
          }}>Cancel</button>
          <button onClick={doDelete} disabled={deleting} style={{
            padding: '11px 28px', borderRadius: 10, border: 'none',
            background: deleting ? '#FCA5A5' : '#EF4444', color: '#fff',
            fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', fontSize: 14
          }}>
            {deleting ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Admin Page ─── */
export default function Admin() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // products state
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const LIMIT = 20;

  // filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // modals
  const [editProduct, setEditProduct] = useState(null); // null = closed, {} = add, obj = edit
  const [deleteProduct, setDeleteProduct] = useState(null);

  // toast
  const [toast, setToast] = useState('');

  /* ── Auth guard ── */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    apiClient.get('/auth/me')
      .then(res => {
        const u = res.data.user;
        if (u?.role !== 'admin') {
          navigate('/');
        } else {
          setUser(u);
        }
      })
      .catch(() => navigate('/login'))
      .finally(() => setAuthChecked(true));
  }, [navigate]);

  /* ── Fetch products ── */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);
      const res = await apiClient.get(`/products?${params}`);
      setProducts(res.data.data || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter]);

  useEffect(() => { if (authChecked && user) fetchProducts(); }, [fetchProducts, authChecked, user]);

  /* ── Toast helper ── */
  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function onSaved() {
    setEditProduct(null);
    fetchProducts();
    showToast('✅ Product saved — Redis cache invalidated automatically!');
  }

  function onDeleted() {
    setDeleteProduct(null);
    fetchProducts();
    showToast('🗑️ Product deleted — Redis cache invalidated automatically!');
  }

  /* ── Stats derived from current page ── */
  const avgPrice = products.length
    ? Math.round(products.reduce((s, p) => s + p.price, 0) / products.length)
    : 0;
  const lowStock = products.filter(p => p.stock < 10).length;

  /* ── Loading / auth states ── */
  if (!authChecked) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner />
    </div>
  );
  if (!user) return null;

  /* ── Render ── */
  return (
    <div style={{ minHeight: '100vh', background: '#F4F9F5', paddingTop: 80 }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 2000,
          background: '#0B2F1D', color: '#fff', borderRadius: 12,
          padding: '14px 22px', fontWeight: 600, fontSize: 14,
          boxShadow: '0 8px 30px rgba(11,47,29,0.25)',
          animation: 'fadeUp 0.3s ease'
        }}>{toast}</div>
      )}

      <div style={{ maxWidth: 1380, margin: '0 auto', padding: '32px 24px' }}>
        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#16A34A', marginBottom: 6 }}>
              <span style={{ width: 20, height: 3, background: '#16A34A', borderRadius: 2, display: 'inline-block' }} />
              Admin Panel
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 900, color: '#0F291E', letterSpacing: '-0.03em' }}>
              Product Catalog Manager
            </h1>
            <p style={{ color: '#789687', marginTop: 4, fontSize: 14 }}>
              Logged in as <strong style={{ color: '#375244' }}>{user.name}</strong> · All changes auto-invalidate Redis cache
            </p>
          </div>
          <button
            id="admin-add-product-btn"
            onClick={() => setEditProduct({})}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 26px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #16A34A, #22C55E)',
              color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(22,163,74,0.35)',
              transition: 'all 0.2s'
            }}
          >
            ＋ Add Product
          </button>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
          <StatCard icon="📦" label="Total Products" value={total.toLocaleString()} color="#16A34A" />
          <StatCard icon="💰" label="Avg Price (page)" value={`₹${avgPrice.toLocaleString()}`} color="#0EA5E9" />
          <StatCard icon="⚠️" label="Low Stock (<10)" value={lowStock} color="#F59E0B" />
          <StatCard icon="🗂️" label="Categories" value={CATEGORIES.length} color="#8B5CF6" />
        </div>

        {/* ── Filters ── */}
        <div style={{
          background: '#fff', borderRadius: 16, padding: '18px 24px',
          boxShadow: '0 2px 8px rgba(11,47,29,0.04)', border: '1px solid #DCE8E0',
          display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20
        }}>
          <input
            id="admin-search-input"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="🔍  Search products…"
            style={{
              flex: '1 1 240px', borderRadius: 10, border: '1.5px solid #DCE8E0',
              padding: '10px 14px', fontSize: 14, outline: 'none'
            }}
          />
          <select
            id="admin-category-filter"
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
            style={{
              flex: '0 0 160px', borderRadius: 10, border: '1.5px solid #DCE8E0',
              padding: '10px 14px', fontSize: 14, outline: 'none', background: '#fff'
            }}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <button
            onClick={() => { setSearch(''); setCategoryFilter(''); setPage(1); }}
            style={{
              padding: '10px 18px', borderRadius: 10, border: '1.5px solid #DCE8E0',
              background: '#F4F9F5', color: '#789687', fontWeight: 600, cursor: 'pointer', fontSize: 13
            }}
          >Clear</button>
          <span style={{ fontSize: 13, color: '#789687', marginLeft: 'auto' }}>
            Showing page <strong style={{ color: '#375244' }}>{page}</strong> of <strong style={{ color: '#375244' }}>{pages}</strong>
            &nbsp;·&nbsp;<strong style={{ color: '#375244' }}>{total}</strong> total
          </span>
        </div>

        {/* ── Table ── */}
        <div style={{
          background: '#fff', borderRadius: 18, border: '1px solid #DCE8E0',
          boxShadow: '0 2px 12px rgba(11,47,29,0.05)', overflow: 'hidden'
        }}>
          {loading ? <Spinner /> : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#789687' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <div style={{ fontWeight: 600 }}>No products found</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#F4F9F5', borderBottom: '1px solid #DCE8E0' }}>
                    {['Image', 'Name', 'Category', 'Price', 'Stock', 'Actions'].map(h => (
                      <th key={h} style={{
                        padding: '14px 18px', textAlign: 'left',
                        fontWeight: 700, color: '#375244', fontSize: 12,
                        letterSpacing: 0.5, textTransform: 'uppercase',
                        whiteSpace: 'nowrap'
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => (
                    <tr
                      key={p._id}
                      style={{
                        borderBottom: i < products.length - 1 ? '1px solid #F0F4F1' : 'none',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FAFCFA'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      {/* Image */}
                      <td style={{ padding: '12px 18px' }}>
                        {p.image ? (
                          <img src={p.image} alt={p.name}
                            style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8, border: '1px solid #DCE8E0' }} />
                        ) : (
                          <div style={{
                            width: 44, height: 44, borderRadius: 8,
                            background: 'linear-gradient(135deg, #EAF2EC, #D1FAE5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
                          }}>📦</div>
                        )}
                      </td>
                      {/* Name */}
                      <td style={{ padding: '12px 18px', maxWidth: 260 }}>
                        <div style={{ fontWeight: 600, color: '#0F291E', lineHeight: 1.3 }}
                          title={p.name}>
                          {p.name.length > 50 ? p.name.slice(0, 48) + '…' : p.name}
                        </div>
                        <div style={{ fontSize: 12, color: '#789687', marginTop: 2 }}>ID: {p._id.slice(-8)}</div>
                      </td>
                      {/* Category */}
                      <td style={{ padding: '12px 18px' }}>
                        <span style={{
                          display: 'inline-flex', padding: '3px 10px',
                          borderRadius: 20, fontSize: 12, fontWeight: 600,
                          background: '#EAF2EC', color: '#16A34A'
                        }}>{p.category}</span>
                      </td>
                      {/* Price */}
                      <td style={{ padding: '12px 18px', fontWeight: 700, color: '#0F291E' }}>
                        ₹{p.price.toLocaleString()}
                      </td>
                      {/* Stock */}
                      <td style={{ padding: '12px 18px' }}>
                        <span style={{
                          fontWeight: 700,
                          color: p.stock < 10 ? '#EF4444' : p.stock < 30 ? '#F59E0B' : '#16A34A'
                        }}>
                          {p.stock}
                          {p.stock < 10 && <span style={{ fontSize: 10, marginLeft: 4 }}>⚠️ Low</span>}
                        </span>
                      </td>
                      {/* Actions */}
                      <td style={{ padding: '12px 18px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            id={`edit-product-${p._id}`}
                            onClick={() => setEditProduct(p)}
                            style={{
                              padding: '7px 16px', borderRadius: 8, border: '1.5px solid #16A34A',
                              background: 'rgba(22,163,74,0.06)', color: '#16A34A',
                              fontWeight: 600, cursor: 'pointer', fontSize: 13, transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => { e.target.style.background = '#16A34A'; e.target.style.color = '#fff'; }}
                            onMouseLeave={e => { e.target.style.background = 'rgba(22,163,74,0.06)'; e.target.style.color = '#16A34A'; }}
                          >Edit</button>
                          <button
                            id={`delete-product-${p._id}`}
                            onClick={() => setDeleteProduct(p)}
                            style={{
                              padding: '7px 16px', borderRadius: 8, border: '1.5px solid #EF4444',
                              background: 'rgba(239,68,68,0.06)', color: '#EF4444',
                              fontWeight: 600, cursor: 'pointer', fontSize: 13, transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => { e.target.style.background = '#EF4444'; e.target.style.color = '#fff'; }}
                            onMouseLeave={e => { e.target.style.background = 'rgba(239,68,68,0.06)'; e.target.style.color = '#EF4444'; }}
                          >Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
            <button
              id="admin-prev-page"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '9px 18px', borderRadius: 10, border: '1.5px solid #DCE8E0',
                background: page === 1 ? '#F4F9F5' : '#fff', color: page === 1 ? '#CBD5E1' : '#375244',
                fontWeight: 600, cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 14
              }}
            >← Prev</button>

            {Array.from({ length: Math.min(7, pages) }, (_, i) => {
              let pg;
              if (pages <= 7) pg = i + 1;
              else if (page <= 4) pg = i + 1;
              else if (page >= pages - 3) pg = pages - 6 + i;
              else pg = page - 3 + i;
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  style={{
                    width: 40, height: 40, borderRadius: 10,
                    border: `1.5px solid ${pg === page ? '#16A34A' : '#DCE8E0'}`,
                    background: pg === page ? '#16A34A' : '#fff',
                    color: pg === page ? '#fff' : '#375244',
                    fontWeight: 700, cursor: 'pointer', fontSize: 14
                  }}
                >{pg}</button>
              );
            })}

            <button
              id="admin-next-page"
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={page === pages}
              style={{
                padding: '9px 18px', borderRadius: 10, border: '1.5px solid #DCE8E0',
                background: page === pages ? '#F4F9F5' : '#fff', color: page === pages ? '#CBD5E1' : '#375244',
                fontWeight: 600, cursor: page === pages ? 'not-allowed' : 'pointer', fontSize: 14
              }}
            >Next →</button>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {editProduct !== null && (
        <ProductModal
          product={editProduct?._id ? editProduct : null}
          onClose={() => setEditProduct(null)}
          onSaved={onSaved}
        />
      )}
      {deleteProduct && (
        <DeleteConfirm
          product={deleteProduct}
          onClose={() => setDeleteProduct(null)}
          onDeleted={onDeleted}
        />
      )}
    </div>
  );
}
