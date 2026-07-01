import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';

function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [cancelling, setCancelling] = useState(null);

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
      <div style={styles.emptyContainer}>
        <div style={styles.emptyIcon}>📦</div>
        <h2 style={styles.emptyTitle}>No orders yet</h2>
        <p style={styles.emptyText}>Start shopping to see your orders here</p>
        <Link to="/" style={styles.shopBtn}>Browse Products</Link>
      </div>
    );
  }

  return (
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
              {isExpanded && (
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
                    </div>
                  </div>

                  {/* Cancel Button */}
                  {order.status === 'pending' && (
                    <button
                      style={styles.cancelBtn}
                      onClick={() => cancelOrder(order._id)}
                      disabled={cancelling === order._id}
                    >
                      {cancelling === order._id ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '32px 20px' },
  title: { fontSize: '28px', fontWeight: 700, margin: '0 0 4px' },
  subtitle: { color: '#888', fontSize: '14px', marginBottom: '24px' },
  center: { textAlign: 'center', padding: '80px 20px', color: '#888' },
  error: {
    background: '#fff0f0', border: '1px solid #ffcccc', color: '#cc0000',
    padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px',
  },
  emptyContainer: { textAlign: 'center', padding: '100px 20px' },
  emptyIcon: { fontSize: '64px', marginBottom: '16px' },
  emptyTitle: { fontSize: '22px', fontWeight: 700, margin: '0 0 8px' },
  emptyText: { color: '#888', marginBottom: '24px' },
  shopBtn: {
    display: 'inline-block', padding: '12px 28px', background: '#1a1a1a',
    color: '#fff', textDecoration: 'none', borderRadius: '8px', fontWeight: 600,
  },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  card: {
    border: '1px solid #e0e0e0', borderRadius: '12px',
    overflow: 'hidden', background: '#fff',
  },
  cardHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', cursor: 'pointer', userSelect: 'none',
    background: '#fafafa',
  },
  orderMeta: { display: 'flex', alignItems: 'center', gap: '10px' },
  orderId: { fontWeight: 700, fontSize: '14px', fontFamily: 'monospace' },
  badge: {
    padding: '3px 10px', borderRadius: '20px',
    fontSize: '12px', fontWeight: 600, textTransform: 'capitalize',
  },
  orderSummary: { display: 'flex', alignItems: 'center', gap: '16px' },
  orderDate: { color: '#888', fontSize: '13px' },
  orderTotal: { fontWeight: 700, fontSize: '15px' },
  chevron: { color: '#888', fontSize: '12px' },
  cardBody: { padding: '20px', borderTop: '1px solid #eee' },
  section: { marginBottom: '20px' },
  sectionTitle: { fontSize: '13px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' },
  itemRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '8px 0', borderBottom: '1px solid #f5f5f5', fontSize: '14px',
  },
  itemName: { flex: 1, color: '#1a1a1a' },
  itemQty: { color: '#888', margin: '0 16px' },
  itemPrice: { fontWeight: 600 },
  totalRow: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: '14px', color: '#444', marginBottom: '6px',
  },
  infoGrid: { display: 'flex', flexDirection: 'column', gap: '8px' },
  infoItem: { display: 'flex', gap: '12px', fontSize: '14px' },
  infoLabel: { color: '#888', minWidth: '130px' },
  infoValue: { color: '#1a1a1a', fontWeight: 500 },
  cancelBtn: {
    padding: '10px 20px', background: '#fff', border: '1px solid #cc0000',
    color: '#cc0000', borderRadius: '8px', fontSize: '14px',
    fontWeight: 600, cursor: 'pointer', marginTop: '4px',
  },
};

export default Orders;