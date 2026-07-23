import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import AnimatedPage from '../components/AnimatedPage';
import { motion } from 'framer-motion';

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.post('/auth/login', form);
      const user = res.data.user;



      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(user));
      try {
        const wishRes = await apiClient.get('/wishlist');
        const list = wishRes.data.wishlist || wishRes.data || [];
        localStorage.setItem('wishlistIds', JSON.stringify(list.map(item => item._id)));
      } catch (err) {
        console.error('Error fetching wishlist on login:', err);
      }

      if (user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <AnimatedPage>
      <div style={styles.container}>
        <div style={styles.wrapper}>
          {/* Left Column - Visual Banner */}
          <div style={styles.visualCol}>
            <div style={styles.visualOverlay} />
            <motion.img 
              src="/login_illustration.png" 
              alt="ShopAI Illustration" 
              style={styles.visualImg} 
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.25 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
            <div style={styles.visualContent}>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <div style={styles.logoPill}>
                  <img 
                    src="/zapcart_logo.png" 
                    alt="ZapCart" 
                    style={{ height: '18px', width: '18px', borderRadius: '4px', objectFit: 'cover' }} 
                  />
                  <span>ZapCart</span>
                </div>
                <h2 style={styles.visualTitle}>Experience the Future of Smart Commerce</h2>
                <p style={styles.visualDesc}>
                  Discover intelligent recommendations, lightning-fast semantic search, and secure checkouts tailored for you.
                </p>
              </motion.div>

              {/* Animated Floating Badges */}
              <div style={styles.floatingBadges}>
                {[
                  { label: 'AI Personalization', icon: '✨', delay: 0.4, y: [0, -10, 0] },
                  { label: 'Safe Checkout', icon: '🔒', delay: 0.6, y: [0, -8, 0] },
                  { label: 'Direct Shipping', icon: '🚚', delay: 0.8, y: [0, -12, 0] },
                ].map((badge, idx) => (
                  <motion.div
                    key={idx}
                    style={styles.badgeCard}
                    animate={{ y: badge.y }}
                    transition={{
                      repeat: Infinity,
                      duration: 3 + idx,
                      ease: 'easeInOut',
                      delay: badge.delay
                    }}
                  >
                    <span>{badge.icon}</span> {badge.label}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div style={styles.formCol}>
            <div style={styles.card}>
              <h1 style={styles.title}>Welcome back</h1>
              <p style={styles.subtitle}>Enter your credentials to access your account</p>



              {error && <div style={styles.error}>{error}</div>}

              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.field}>
                  <label style={styles.label}>Email</label>
                  <input
                    style={styles.input}
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                    required
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      style={{ ...styles.input, width: '100%', paddingRight: '40px', boxSizing: 'border-box' }}
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => setForm({...form, password: e.target.value})}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        color: 'var(--text-muted)'
                      }}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div style={{ textAlign: 'right', marginTop: '4px' }}>
                    <Link to="/forgot-password" style={{ fontSize: '13px', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Forgot Password?</Link>
                  </div>
                </div>
                <motion.button
                  type="submit"
                  style={styles.btn}
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </motion.button>
              </form>

              <p style={styles.switchText}>
                Don't have an account?{' '}
                <Link to="/register" style={styles.link}>Register here</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}

const styles = {
  container: {
    minHeight: '85vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    background: '#f1f5f9',
  },
  wrapper: {
    display: 'flex',
    width: '100%',
    maxWidth: '1000px',
    background: 'var(--card-bg)',
    borderRadius: '24px',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-xl)',
    border: '1px solid var(--border)',
    flexWrap: 'wrap',
  },
  visualCol: {
    flex: '1 1 500px',
    position: 'relative',
    minHeight: '450px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '48px',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
  },
  visualOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at top right, rgba(255,255,255,0.06), transparent 70%)',
    zIndex: 1,
  },
  visualImg: {
    position: 'absolute',
    right: '-50px',
    bottom: '-50px',
    width: '380px',
    height: '380px',
    objectFit: 'contain',
    pointerEvents: 'none',
    zIndex: 0,
  },
  visualContent: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'space-between',
    color: '#fff',
  },
  logoPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 700,
    marginBottom: '24px',
    color: '#6ee7b7',
    width: 'fit-content',
  },
  visualTitle: {
    fontSize: '32px',
    fontWeight: 800,
    lineHeight: '1.25',
    margin: '0 0 16px',
    letterSpacing: '-0.02em',
    color: '#fff',
  },
  visualDesc: {
    fontSize: '15px',
    color: '#a7f3d0',
    lineHeight: '1.6',
    margin: 0,
    maxWidth: '400px',
  },
  floatingBadges: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '40px',
  },
  badgeCard: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.05)',
    backdropFilter: 'blur(10px)',
    padding: '10px 16px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#fff',
    width: 'fit-content',
  },
  formCol: {
    flex: '1 1 400px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    background: 'var(--card-bg)',
  },
  card: {
    width: '100%',
    maxWidth: '380px',
  },
  title: { fontSize: '28px', fontWeight: 800, margin: '0 0 8px', color: 'var(--text-primary)', letterSpacing: '-0.02em' },
  subtitle: { color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '14px', fontWeight: 500 },
  error: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: 500,
  },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' },
  input: {
    padding: '12px 16px',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    fontSize: '14px',
    background: 'var(--card-bg)',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'all 0.2s',
  },
  btn: {
    padding: '14px',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '8px',
    boxShadow: 'var(--shadow-md)',
    transition: 'all 0.2s',
  },
  switchText: { textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 },
  link: { color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' },
};

export default Login;