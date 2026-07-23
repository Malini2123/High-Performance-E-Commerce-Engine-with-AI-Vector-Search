import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import useScrollRestore from '../hooks/useScrollRestore';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import AnimatedPage from '../components/AnimatedPage';
import { motion } from 'framer-motion';

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};

const COLORS = ['#1a1a1a', '#6ee7b7', '#f59e0b', '#ef4444', '#8b5cf6'];

function Analytics() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [ordersByStatus, setOrdersByStatus] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [revenueOverTime, setRevenueOverTime] = useState([]);
  const [loading, setLoading] = useState(true);

  // Restore scroll position after page refresh
  useScrollRestore(loading);

  const fetchAll = useCallback(async () => {
    setLoading(true);
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
    } catch {
      console.error('Failed to fetch analytics');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'admin') { navigate('/'); return; }
    fetchAll();
  }, [navigate, fetchAll]);

  if (loading) return <div style={styles.loading}>Loading analytics...</div>;

  return (
    <AnimatedPage>
      <div style={styles.container} className="analytics-container">
        <h1 style={styles.title}>📊 Analytics Dashboard</h1>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          style={styles.cards}
        >
          {[
            { label: 'Total Revenue', value: `₹${summary?.totalRevenue?.toFixed(2) || 0}`, icon: '💰' },
            { label: 'Total Orders', value: summary?.totalOrders || 0, icon: '📦' },
            { label: 'Total Users', value: summary?.totalUsers || 0, icon: '👥' },
            { label: 'Total Products', value: summary?.totalProducts || 0, icon: '🛍️' },
          ].map((card, i) => (
            <motion.div
              key={i}
              variants={cardVariants}
              whileHover={{ y: -4, boxShadow: 'var(--shadow-md)' }}
              style={styles.card}
            >
              <div style={styles.cardIcon}>{card.icon}</div>
              <div style={styles.cardValue}>{card.value}</div>
              <div style={styles.cardLabel}>{card.label}</div>
            </motion.div>
          ))}
        </motion.div>

      <div style={styles.chartsGrid}>
        <div style={styles.chartBox}>
          <h3 style={styles.chartTitle}>Revenue Over Time</h3>
          {revenueOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `₹${v}`} />
                <Line type="monotone" dataKey="revenue" stroke="#1a1a1a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div style={styles.noData}>No data yet</div>}
        </div>

        <div style={styles.chartBox}>
          <h3 style={styles.chartTitle}>Orders by Status</h3>
          {ordersByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={ordersByStatus} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {ordersByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <div style={styles.noData}>No orders yet</div>}
        </div>

        <div style={{ ...styles.chartBox, gridColumn: '1 / -1' }}>
          <h3 style={styles.chartTitle}>Top 5 Products by Units Sold</h3>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="sold" fill="#1a1a1a" name="Units Sold" />
                <Bar dataKey="revenue" fill="#6ee7b7" name="Revenue (₹)" />
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={styles.noData}>No sales data yet</div>}
        </div>
      </div>
      </div>
    </AnimatedPage>
  );
}

const styles = {
  container: { width: '92%', maxWidth: '1600px', margin: '0 auto', padding: '40px 20px' },
  title: { fontSize: '28px', fontWeight: 800, marginBottom: '24px', color: 'var(--text-primary)', letterSpacing: '-0.02em' },
  loading: { textAlign: 'center', padding: '100px 20px', color: 'var(--text-secondary)', fontSize: '15px' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' },
  card: { background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' },
  cardIcon: { fontSize: '32px', marginBottom: '8px' },
  cardValue: { fontSize: '26px', fontWeight: 800, marginBottom: '4px', color: 'var(--text-primary)' },
  cardLabel: { fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 },
  chartsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' },
  chartBox: { background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-md)' },
  chartTitle: { fontSize: '16px', fontWeight: 700, margin: '0 0 20px', color: 'var(--text-primary)' },
  noData: { textAlign: 'center', padding: '60px', color: 'var(--text-muted)', fontSize: '14px' },
};

export default Analytics;