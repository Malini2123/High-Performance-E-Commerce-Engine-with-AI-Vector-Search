/* eslint-disable */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['#1a1a1a', '#6ee7b7', '#f59e0b', '#ef4444', '#8b5cf6'];

function Analytics() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [ordersByStatus, setOrdersByStatus] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [revenueOverTime, setRevenueOverTime] = useState([]);
  const [loading, setLoading] = useState(true);

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
    fetchAll();
  }, [navigate, fetchAll]);

  if (loading) return <div style={styles.loading}>Loading analytics...</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📊 Analytics Dashboard</h1>

      <div style={styles.cards}>
        {[
          { label: 'Total Revenue', value: `₹${summary?.totalRevenue?.toFixed(2) || 0}`, icon: '💰' },
          { label: 'Total Orders', value: summary?.totalOrders || 0, icon: '📦' },
          { label: 'Total Users', value: summary?.totalUsers || 0, icon: '👥' },
          { label: 'Total Products', value: summary?.totalProducts || 0, icon: '🛍️' },
        ].map((card, i) => (
          <div key={i} style={styles.card}>
            <div style={styles.cardIcon}>{card.icon}</div>
            <div style={styles.cardValue}>{card.value}</div>
            <div style={styles.cardLabel}>{card.label}</div>
          </div>
        ))}
      </div>

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
  );
}

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '32px 20px' },
  title: { fontSize: '28px', fontWeight: 700, marginBottom: '24px' },
  loading: { textAlign: 'center', padding: '100px 20px', color: '#888' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' },
  card: { background: '#fff', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '20px', textAlign: 'center' },
  cardIcon: { fontSize: '32px', marginBottom: '8px' },
  cardValue: { fontSize: '24px', fontWeight: 700, marginBottom: '4px' },
  cardLabel: { fontSize: '13px', color: '#888' },
  chartsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  chartBox: { background: '#fff', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '20px' },
  chartTitle: { fontSize: '16px', fontWeight: 600, margin: '0 0 16px' },
  noData: { textAlign: 'center', padding: '60px', color: '#888', fontSize: '14px' },
};

export default Analytics;