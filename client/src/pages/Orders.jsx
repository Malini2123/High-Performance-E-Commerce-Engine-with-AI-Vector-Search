import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';
import useScrollRestore from '../hooks/useScrollRestore';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';

function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  // Restore scroll position on page refresh
  useScrollRestore(loading);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    let ignore = false;

    async function fetchOrders() {
      setLoading(true);
      setError('');
      try {
        const res = await apiClient.get('/orders');
        if (!ignore) {
          setOrders(res.data.orders || []);
        }
      } catch {
        if (!ignore) setError('Could not load orders');
      }
      if (!ignore) setLoading(false);
    }

    fetchOrders();
    return () => { ignore = true; };
  }, [navigate]);

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(orderId);
    try {
      await apiClient.patch(`/orders/${orderId}/cancel`);
      setOrders(prev =>
        prev.map(o => o._id === orderId ? { ...o, status: 'cancelled' } : o)
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Could not cancel order');
    }
    setCancelling(null);
  };

  const statusStyle = (status) => {
    const map = {
      pending:    { background: '#fff8e1', color: '#f59e0b' },
      processing: { background: '#e0f2fe', color: '#0284c7' },
      shipped:    { background: '#f0fdf4', color: '#16a34a' },
      delivered:  { background: '#dcfce7', color: '#15803d' },
      cancelled:  { background: '#fff0f0', color: '#cc0000' },
    };
    return map[status] || { background: '#f0f0f0', color: '#888' };
  };

  if (loading) {
    return <div style={styles.center}>Loading orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <AnimatedPage>
        <div style={styles.emptyContainer}>
          <div style={styles.emptyIcon}>📦</div>
          <h2 style={styles.emptyTitle}>No orders yet</h2>
          <p style={styles.emptyText}>Start shopping to see your orders here</p>
          <Link to="/" style={styles.shopBtn}>Browse Products</Link>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div style={styles.container}>
        <h1 style={styles.title}>Your Orders</h1>
        <p style={styles.subtitle}>{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.list}>
          {orders.map(order => {
            const isExpanded = expandedId === order._id;
            const s = statusStyle(order.status);

            return (
              <div key={order._id} style={styles.card}>
                {/* Order Header */}
                <div style={styles.cardHeader} onClick={() => setExpandedId(isExpanded ? null : order._id)}>
                  <div style={styles.orderMeta}>
                    <span style={styles.orderId}>#{order._id.slice(-8).toUpperCase()}</span>
                    <span style={{ ...styles.badge, ...s }}>{order.status}</span>
                  </div>
                  <div style={styles.orderSummary}>
                    <span style={styles.orderDate}>
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </span>
                    <span style={styles.orderTotal}>₹{Number(order.finalTotal).toFixed(2)}</span>
                    <span style={styles.chevron}>{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded Detail */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={styles.cardBody}>
                        {/* Items */}
                        <div style={styles.section}>
                          <h4 style={styles.sectionTitle}>Items</h4>
                          {order.items.map((item, idx) => (
                            <div key={idx} style={styles.itemRow}>
                              <span style={styles.itemName}>{item.name}</span>
                              <span style={styles.itemQty}>x{item.quantity}</span>
                              <span style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Totals */}
                        <div style={styles.section}>
                          <h4 style={styles.sectionTitle}>Price Breakdown</h4>
                          <div style={styles.totalRow}>
                            <span>Subtotal</span>
                            <span>₹{Number(order.total).toFixed(2)}</span>
                          </div>
                          {order.discount > 0 && (
                            <div style={styles.totalRow}>
                              <span>Discount</span>
                              <span style={{ color: '#16a34a' }}>−₹{Number(order.discount).toFixed(2)}</span>
                            </div>
                          )}
                          <div style={{ ...styles.totalRow, fontWeight: 700, fontSize: '16px', borderTop: '1px solid #eee', paddingTop: '8px', marginTop: '4px' }}>
                            <span>Total Paid</span>
                            <span>₹{Number(order.finalTotal).toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Info */}
                        <div style={styles.section}>
                          <h4 style={styles.sectionTitle}>Order Info</h4>
                          <div style={styles.infoGrid}>
                            <div style={styles.infoItem}>
                              <span style={styles.infoLabel}>Payment</span>
                              <span style={styles.infoValue}>{order.paymentMethod || 'COD'}</span>
                            </div>
                            {order.address && (
                              <div style={styles.infoItem}>
                                <span style={styles.infoLabel}>Delivery Address</span>
                                <span style={styles.infoValue}>{order.address}</span>
                              </div>
                            )}
                            <div style={styles.infoItem}>
                              <span style={styles.infoLabel}>Placed On</span>
                              <span style={styles.infoValue}>
                                {new Date(order.createdAt).toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div style={styles.infoItem}>
                              <span style={styles.infoLabel}>Return Window</span>
                              <span style={{
                                ...styles.infoValue,
                                color: order.status === 'cancelled' ? 'var(--text-muted)' : 'var(--primary)',
                                fontWeight: 700
                              }}>
                                {order.status === 'cancelled'
                                  ? 'Not applicable (Cancelled)'
                                  : order.status === 'delivered'
                                    ? (Math.ceil((new Date() - new Date(order.createdAt)) / (1000 * 60 * 60 * 24)) <= 7
                                      ? `🔄 Active (${8 - Math.ceil((new Date() - new Date(order.createdAt)) / (1000 * 60 * 60 * 24))} days left)`
                                      : '🔄 Expired (7-day window passed)')
                                    : '🔄 Eligible for 7 days after delivery'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Cancel Button */}
                        {order.status === 'pending' && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            style={styles.cancelBtn}
                            onClick={() => cancelOrder(order._id)}
                            disabled={cancelling === order._id}
                          >
                            {cancelling === order._id ? 'Cancelling...' : 'Cancel Order'}
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </AnimatedPage>
  );
}

const styles = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '40px 20px' },
  title: { fontSize: '28px', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)', letterSpacing: '-0.02em' },
  subtitle: { color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '32px', fontWeight: 500 },
  center: { textAlign: 'center', padding: '100px 20px', color: 'var(--text-secondary)', fontSize: '15px' },
  error: {
    background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444',
    padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px',
  },
  emptyContainer: { textAlign: 'center', padding: '120px 20px' },
  emptyIcon: { fontSize: '72px', marginBottom: '20px' },
  emptyTitle: { fontSize: '24px', fontWeight: 800, margin: '0 0 10px', color: 'var(--text-primary)', letterSpacing: '-0.02em' },
  emptyText: { color: 'var(--text-muted)', marginBottom: '28px', fontSize: '15px' },
  shopBtn: {
    display: 'inline-flex', padding: '12px 32px',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
    color: '#fff', textDecoration: 'none', borderRadius: '10px', fontWeight: 700,
    boxShadow: 'var(--shadow-md)', transition: 'all 0.2s',
  },
  list: { display: 'flex', flexDirection: 'column', gap: '16px' },
  card: {
    border: '1px solid var(--border)', borderRadius: '14px',
    overflow: 'hidden', background: 'var(--card-bg)', boxShadow: 'var(--shadow-md)',
  },
  cardHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px 24px', cursor: 'pointer', userSelect: 'none',
    background: 'var(--bg-secondary)',
  },
  orderMeta: { display: 'flex', alignItems: 'center', gap: '12px' },
  orderId: { fontWeight: 700, fontSize: '14px', fontFamily: 'var(--mono)', color: 'var(--text-primary)' },
  badge: {
    padding: '4px 12px', borderRadius: '20px',
    fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  orderSummary: { display: 'flex', alignItems: 'center', gap: '18px' },
  orderDate: { color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 },
  orderTotal: { fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)' },
  chevron: { color: 'var(--text-muted)', fontSize: '12px' },
  cardBody: { padding: '24px', borderTop: '1px solid var(--border)', background: 'var(--card-bg)' },
  section: { marginBottom: '24px' },
  sectionTitle: { fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 12px' },
  itemRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: '14px',
  },
  itemName: { flex: 1, color: 'var(--text-primary)', fontWeight: 500 },
  itemQty: { color: 'var(--text-secondary)', margin: '0 16px', fontWeight: 600 },
  itemPrice: { fontWeight: 700, color: 'var(--text-primary)' },
  totalRow: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px',
    fontWeight: 500,
  },
  infoGrid: { display: 'flex', flexDirection: 'column', gap: '10px' },
  infoItem: { display: 'flex', gap: '16px', fontSize: '14px' },
  infoLabel: { color: 'var(--text-muted)', minWidth: '140px', fontWeight: 500 },
  infoValue: { color: 'var(--text-primary)', fontWeight: 600 },
  cancelBtn: {
    padding: '10px 20px', background: 'var(--card-bg)', border: '1px solid #ef4444',
    color: '#ef4444', borderRadius: '8px', fontSize: '13px',
    fontWeight: 700, cursor: 'pointer', marginTop: '8px', transition: 'all 0.2s',
  },
};

export default Orders;