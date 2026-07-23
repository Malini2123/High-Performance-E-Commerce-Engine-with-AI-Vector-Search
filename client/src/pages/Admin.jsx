import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

/* ─── Tiny Helpers ─── */
const CATEGORIES = ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Food'];
const CHART_COLORS = ['#16A34A', '#0EA5E9', '#8B5CF6', '#F59E0B', '#EF4444'];

const EMPTY_FORM = {
  name: '', category: 'Electronics', price: '', stock: '',
  description: '', image: ''
};

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '24px 28px',
      boxShadow: '0 2px 12px rgba(11,47,29,0.06)', border: '1px solid #DCE8E0',
      display: 'flex', alignItems: 'center', gap: 18, flex: '1 1 200px', minWidth: 180
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

/* ─── Main Admin Dashboard Page ─── */
export default function Admin() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Tabs state: 'overview' | 'orders' | 'products'
  const [activeTab, setActiveTab] = useState('overview');

  // toast state
  const [toast, setToast] = useState(null); // { message, type }

  /* ───── Tab 1: Overview Analytics State ───── */
  const [summary, setSummary] = useState(null);
  const [ordersByStatus, setOrdersByStatus] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [revenueOverTime, setRevenueOverTime] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  /* ───── Tab 2: Orders State ───── */
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersSearch, setOrdersSearch] = useState('');
  const [ordersStatusFilter, setOrdersStatusFilter] = useState('');
  const [actionInProgress, setActionInProgress] = useState(null); // stores order ID currently transitioning

  /* ───── Tab 3: Products State ───── */
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [productsLoading, setProductsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const LIMIT = 10;
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editProduct, setEditProduct] = useState(null); // null = closed, {} = add, obj = edit
  const [deleteProduct, setDeleteProduct] = useState(null);

  /* ── Auth guard ── */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login?role=admin'); return; }
    apiClient.get('/auth/me')
      .then(res => {
        const u = res.data.user;
        if (u?.role !== 'admin') {
          navigate('/');
        } else {
          setUser(u);
        }
      })
      .catch(() => navigate('/login?role=admin'))
      .finally(() => setAuthChecked(true));
  }, [navigate]);

  /* ───── Analytics API Fetching ───── */
  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const [s, o, t, r] = await Promise.all([
        apiClient.get('/analytics/summary'),
        apiClient.get('/analytics/orders-by-status'),
        apiClient.get('/analytics/top-products'),
        apiClient.get('/analytics/revenue-over-time'),
      ]);
      setSummary(s.data);
      setOrdersByStatus(o.data.map(d => ({ name: d._id, value: d.count })));
      setTopProducts(t.data.map(d => ({ name: d._id, sold: d.totalSold, revenue: d.revenue })));
      setRevenueOverTime(r.data.map(d => ({ date: d._id.slice(5), revenue: d.revenue, orders: d.orders })));
    } catch (e) {
      console.error('Failed to fetch analytics:', e);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  /* ───── Orders API Fetching ───── */
  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await apiClient.get('/orders/admin/all');
      setOrders(res.data.orders || []);
    } catch (e) {
      console.error('Failed to fetch orders:', e);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  /* ───── Products API Fetching ───── */
  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
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
      setProductsLoading(false);
    }
  }, [page, search, categoryFilter]);

  // Load data based on active tab
  useEffect(() => {
    if (authChecked && user) {
      if (activeTab === 'overview') fetchAnalytics();
      if (activeTab === 'orders') fetchOrders();
      if (activeTab === 'products') fetchProducts();
    }
  }, [authChecked, user, activeTab, fetchAnalytics, fetchOrders, fetchProducts]);

  /* ── Toast helper ── */
  function showToast(msg, type = 'success') {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 5000);
  }

  /* ───── Order Status Management ───── */
  async function updateOrderStatus(orderId, nextStatus) {
    setActionInProgress(orderId);
    try {
      await apiClient.patch(`/orders/admin/${orderId}/status`, { status: nextStatus });
      showToast(`Order status updated to: ${nextStatus.toUpperCase()}`);
      // Refresh order list and dashboard stats
      fetchOrders();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update order status', 'error');
    } finally {
      setActionInProgress(null);
    }
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

  /* ── Filtered Orders ── */
  const filteredOrders = orders.filter(o => {
    // Status filter
    if (ordersStatusFilter && o.status !== ordersStatusFilter) return false;
    // Search filter (customer name, email, or order ID)
    if (ordersSearch.trim()) {
      const q = ordersSearch.toLowerCase().trim();
      const customerName = o.user?.name?.toLowerCase() || '';
      const customerEmail = o.user?.email?.toLowerCase() || '';
      const orderId = o._id?.toLowerCase() || '';
      return customerName.includes(q) || customerEmail.includes(q) || orderId.includes(q);
    }
    return true;
  });

  /* ── Loading / auth states ── */
  if (!authChecked) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner />
    </div>
  );
  if (!user) return null;

  /* ── Status Badge Styler ── */
  const getStatusStyle = (status) => {
    const base = {
      display: 'inline-flex', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, textTransform: 'capitalize'
    };
    switch (status) {
      case 'pending': return { ...base, background: '#FEF3C7', color: '#D97706' };
      case 'confirmed': return { ...base, background: '#DBEAFE', color: '#2563EB' };
      case 'shipped': return { ...base, background: '#F3E8FF', color: '#7C3AED' };
      case 'delivered': return { ...base, background: '#D1FAE5', color: '#059669' };
      case 'cancelled': return { ...base, background: '#FEE2E2', color: '#DC2626' };
      default: return base;
    }
  };

  /* ── Render ── */
  return (
    <div style={{ minHeight: '100vh', background: '#F4F9F5', paddingTop: 80 }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 2000,
          background: toast.type === 'error' ? '#DC2626' : '#0B2F1D',
          color: '#fff', borderRadius: 12,
          padding: '14px 22px', fontWeight: 600, fontSize: 14,
          boxShadow: '0 8px 30px rgba(11,47,29,0.25)',
          animation: 'fadeUp 0.3s ease'
        }}>{toast.message}</div>
      )}

      <div style={{ maxWidth: 1380, margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#16A34A', marginBottom: 6 }}>
              <span style={{ width: 20, height: 3, background: '#16A34A', borderRadius: 2, display: 'inline-block' }} />
              System Terminal
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0F291E', letterSpacing: '-0.03em', margin: 0 }}>
              ZapCart Control Dashboard
            </h1>
            <p style={{ color: '#789687', marginTop: 4, fontSize: 14, margin: '4px 0 0 0' }}>
              Welcome back, <strong style={{ color: '#375244' }}>{user.name}</strong> · Administrative privileges enabled
            </p>
          </div>
          {activeTab === 'products' && (
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
          )}
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #DCE8E0', marginBottom: 28, overflowX: 'auto' }}>
          {[
            { id: 'overview', label: '📊 Business Overview' },
            { id: 'orders', label: '📦 Order Management' },
            { id: 'products', label: '🛍️ Product Catalog' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 24px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid #16A34A' : '3px solid transparent',
                color: activeTab === tab.id ? '#0F291E' : '#789687',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW & ANALYTICS */}
        {activeTab === 'overview' && (
          <div>
            {analyticsLoading ? <Spinner /> : (
              <div>
                {/* Stats Cards */}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
                  <StatCard icon="💰" label="Total Revenue" value={`₹${summary?.totalRevenue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`} color="#16A34A" />
                  <StatCard icon="📦" label="Total Orders" value={summary?.totalOrders || 0} color="#0EA5E9" />
                  <StatCard icon="👥" label="Total Customers" value={summary?.totalUsers || 0} color="#8B5CF6" />
                  <StatCard icon="🛍️" label="Product Catalog" value={summary?.totalProducts || 0} color="#F59E0B" />
                </div>

                {/* Charts Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 24 }}>
                  {/* Chart 1: Revenue Over Time */}
                  <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #DCE8E0', boxShadow: '0 2px 8px rgba(11,47,29,0.04)' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F291E', marginBottom: 20, marginTop: 0 }}>Revenue Trend (Past 30 Days)</h3>
                    {revenueOverTime.length > 0 ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={revenueOverTime}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F0F4F1" />
                          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#789687' }} />
                          <YAxis tick={{ fontSize: 11, fill: '#789687' }} />
                          <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, 'Revenue']} />
                          <Line type="monotone" dataKey="revenue" stroke="#16A34A" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : <div style={{ textAlign: 'center', padding: 60, color: '#789687' }}>No trend data available</div>}
                  </div>

                  {/* Chart 2: Orders by Status */}
                  <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #DCE8E0', boxShadow: '0 2px 8px rgba(11,47,29,0.04)' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F291E', marginBottom: 20, marginTop: 0 }}>Orders Distribution</h3>
                    {ordersByStatus.length > 0 ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie
                            data={ordersByStatus}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {ordersByStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <div style={{ textAlign: 'center', padding: 60, color: '#789687' }}>No order metrics yet</div>}
                  </div>

                  {/* Chart 3: Top Products */}
                  <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #DCE8E0', boxShadow: '0 2px 8px rgba(11,47,29,0.04)', gridColumn: '1 / -1' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F291E', marginBottom: 20, marginTop: 0 }}>Top 5 Popular Products</h3>
                    {topProducts.length > 0 ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={topProducts}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F0F4F1" />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#789687' }} />
                          <YAxis tick={{ fontSize: 11, fill: '#789687' }} />
                          <Tooltip formatter={(v, name) => [name === 'revenue' ? `₹${v.toLocaleString()}` : v, name === 'revenue' ? 'Revenue' : 'Units Sold']} />
                          <Legend />
                          <Bar dataKey="sold" fill="#16A34A" name="Units Sold" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="revenue" fill="#0EA5E9" name="Revenue Generated (₹)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <div style={{ textAlign: 'center', padding: 60, color: '#789687' }}>No Sales Data Logged</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ORDER MANAGEMENT */}
        {activeTab === 'orders' && (
          <div>
            {/* Orders Filter Panel */}
            <div style={{
              background: '#fff', borderRadius: 16, padding: '18px 24px',
              boxShadow: '0 2px 8px rgba(11,47,29,0.04)', border: '1px solid #DCE8E0',
              display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20
            }}>
              <input
                value={ordersSearch}
                onChange={e => setOrdersSearch(e.target.value)}
                placeholder="🔍  Search client orders by ID, name or email…"
                style={{
                  flex: '1 1 280px', borderRadius: 10, border: '1.5px solid #DCE8E0',
                  padding: '10px 14px', fontSize: 14, outline: 'none'
                }}
              />
              <select
                value={ordersStatusFilter}
                onChange={e => setOrdersStatusFilter(e.target.value)}
                style={{
                  flex: '0 0 180px', borderRadius: 10, border: '1.5px solid #DCE8E0',
                  padding: '10px 14px', fontSize: 14, outline: 'none', background: '#fff'
                }}
              >
                <option value="">All Statuses</option>
                <option value="pending">⏳ Pending Confirmation</option>
                <option value="confirmed">✅ Confirmed</option>
                <option value="shipped">🚚 Shipped</option>
                <option value="delivered">📦 Delivered</option>
                <option value="cancelled">❌ Cancelled</option>
              </select>
              <button
                onClick={() => { setOrdersSearch(''); setOrdersStatusFilter(''); }}
                style={{
                  padding: '10px 18px', borderRadius: 10, border: '1.5px solid #DCE8E0',
                  background: '#F4F9F5', color: '#789687', fontWeight: 600, cursor: 'pointer', fontSize: 13
                }}
              >Clear Filters</button>
              <span style={{ fontSize: 13, color: '#789687', marginLeft: 'auto' }}>
                Showing <strong style={{ color: '#375244' }}>{filteredOrders.length}</strong> orders
              </span>
            </div>

            {/* Orders Table */}
            <div style={{
              background: '#fff', borderRadius: 18, border: '1px solid #DCE8E0',
              boxShadow: '0 2px 12px rgba(11,47,29,0.05)', overflow: 'hidden'
            }}>
              {ordersLoading ? <Spinner /> : filteredOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#789687' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
                  <div style={{ fontWeight: 600 }}>No client orders found</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                      <tr style={{ background: '#F4F9F5', borderBottom: '1px solid #DCE8E0' }}>
                        {['Order Info', 'Client Profile', 'Purchased Items', 'Shipment Details', 'Net Total', 'Status', 'Actions'].map(h => (
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
                      {filteredOrders.map((o, idx) => (
                        <tr
                          key={o._id}
                          style={{
                            borderBottom: idx < filteredOrders.length - 1 ? '1px solid #F0F4F1' : 'none',
                            transition: 'background 0.15s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#FAFCFA'}
                          onMouseLeave={e => e.currentTarget.style.background = ''}
                        >
                          {/* Order Info */}
                          <td style={{ padding: '16px 18px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 700, color: '#0F291E' }}>#{o._id.slice(-8).toUpperCase()}</div>
                            <div style={{ fontSize: 11, color: '#789687', marginTop: 4 }}>
                              {new Date(o.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                            </div>
                          </td>

                          {/* Client Profile (Who Ordered) */}
                          <td style={{ padding: '16px 18px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 600, color: '#0F291E' }}>{o.user?.name || 'Unknown User'}</div>
                            <div style={{ fontSize: 12, color: '#789687', marginTop: 2 }}>{o.user?.email || 'N/A'}</div>
                          </td>

                          {/* Purchased Items */}
                          <td style={{ padding: '16px 18px', verticalAlign: 'top', maxWidth: 280 }}>
                            {o.items.map((item, index) => (
                              <div key={index} style={{ fontSize: 13, marginBottom: 4, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                <span style={{ color: '#375244', fontWeight: 500 }}>
                                  {item.name} <strong style={{ color: '#789687' }}>x{item.quantity}</strong>
                                </span>
                                <span style={{ color: '#0F291E', fontWeight: 600 }}>₹{(item.price * item.quantity).toLocaleString()}</span>
                              </div>
                            ))}
                          </td>

                          {/* Shipment Address & Method */}
                          <td style={{ padding: '16px 18px', verticalAlign: 'top', maxWidth: 240 }}>
                            <div style={{ fontSize: 13, color: '#375244', lineHeight: 1.3 }}>{o.address || 'No shipping address provided.'}</div>
                            <div style={{ fontSize: 11, color: '#789687', marginTop: 6, display: 'inline-block', background: '#F0F4F1', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                              💳 {o.paymentMethod || 'COD'}
                            </div>
                          </td>

                          {/* Net Total */}
                          <td style={{ padding: '16px 18px', verticalAlign: 'top', fontWeight: 800, color: '#0F291E', fontSize: 15 }}>
                            ₹{o.finalTotal.toLocaleString()}
                          </td>

                          {/* Status */}
                          <td style={{ padding: '16px 18px', verticalAlign: 'top' }}>
                            <span style={getStatusStyle(o.status)}>
                              {o.status}
                            </span>
                          </td>

                          {/* Actions (Confirm order / update state) */}
                          <td style={{ padding: '16px 18px', verticalAlign: 'top' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {o.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => updateOrderStatus(o._id, 'confirmed')}
                                    disabled={actionInProgress === o._id}
                                    style={{
                                      padding: '6px 12px', borderRadius: 8, border: 'none',
                                      background: '#16A34A', color: '#fff', fontWeight: 700,
                                      cursor: 'pointer', fontSize: 12, transition: 'all 0.2s',
                                      boxShadow: '0 2px 4px rgba(22,163,74,0.2)'
                                    }}
                                  >
                                    ✓ Confirm Order
                                  </button>
                                  <button
                                    onClick={() => updateOrderStatus(o._id, 'cancelled')}
                                    disabled={actionInProgress === o._id}
                                    style={{
                                      padding: '6px 12px', borderRadius: 8, border: '1.5px solid #EF4444',
                                      background: 'rgba(239,68,68,0.05)', color: '#EF4444', fontWeight: 600,
                                      cursor: 'pointer', fontSize: 12, transition: 'all 0.2s'
                                    }}
                                  >
                                    ✕ Cancel
                                  </button>
                                </>
                              )}

                              {o.status === 'confirmed' && (
                                <>
                                  <button
                                    onClick={() => updateOrderStatus(o._id, 'shipped')}
                                    disabled={actionInProgress === o._id}
                                    style={{
                                      padding: '6px 12px', borderRadius: 8, border: 'none',
                                      background: '#7C3AED', color: '#fff', fontWeight: 700,
                                      cursor: 'pointer', fontSize: 12, transition: 'all 0.2s',
                                      boxShadow: '0 2px 4px rgba(124,58,237,0.2)'
                                    }}
                                  >
                                    🚚 Mark Shipped
                                  </button>
                                  <button
                                    onClick={() => updateOrderStatus(o._id, 'cancelled')}
                                    disabled={actionInProgress === o._id}
                                    style={{
                                      padding: '6px 12px', borderRadius: 8, border: '1.5px solid #EF4444',
                                      background: 'rgba(239,68,68,0.05)', color: '#EF4444', fontWeight: 600,
                                      cursor: 'pointer', fontSize: 12, transition: 'all 0.2s'
                                    }}
                                  >
                                    Cancel Order
                                  </button>
                                </>
                              )}

                              {o.status === 'shipped' && (
                                <button
                                  onClick={() => updateOrderStatus(o._id, 'delivered')}
                                  disabled={actionInProgress === o._id}
                                  style={{
                                    padding: '6px 12px', borderRadius: 8, border: 'none',
                                    background: '#059669', color: '#fff', fontWeight: 700,
                                    cursor: 'pointer', fontSize: 12, transition: 'all 0.2s',
                                    boxShadow: '0 2px 4px rgba(5,150,105,0.2)'
                                  }}
                                >
                                  📦 Mark Delivered
                                </button>
                              )}

                              {['delivered', 'cancelled'].includes(o.status) && (
                                <span style={{ fontSize: 11, color: '#789687', fontStyle: 'italic' }}>Terminal State</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PRODUCT CATALOG */}
        {activeTab === 'products' && (
          <div>
            {/* Catalog Filter Panel */}
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

            {/* Catalog Table */}
            <div style={{
              background: '#fff', borderRadius: 18, border: '1px solid #DCE8E0',
              boxShadow: '0 2px 12px rgba(11,47,29,0.05)', overflow: 'hidden'
            }}>
              {productsLoading ? <Spinner /> : products.length === 0 ? (
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
                            <div style={{ fontWeight: 600, color: '#0F291E', lineHeight: 1.3 }} title={p.name}>
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

            {/* Catalog Pagination */}
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
