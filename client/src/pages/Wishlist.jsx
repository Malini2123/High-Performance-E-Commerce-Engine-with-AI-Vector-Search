import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import ProductCard from '../components/ProductCard';
import useScrollRestore from '../hooks/useScrollRestore';
import AnimatedPage from '../components/AnimatedPage';
import { motion } from 'framer-motion';

function Wishlist() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Restore scroll position on page refresh
  useScrollRestore(loading);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    let ignore = false;

    async function fetchWishlist() {
      setLoading(true);
      setError('');
      try {
        const res = await apiClient.get('/wishlist');
        if (!ignore) {
          const list = res.data.wishlist || res.data.items || (Array.isArray(res.data) ? res.data : []);
          setItems(list);
        }
      } catch {
        if (!ignore) {
          setError('Could not load wishlist');
        }
      }
      if (!ignore) {
        setLoading(false);
      }
    }

    fetchWishlist();

    return () => {
      ignore = true;
    };
  }, [navigate]);

  const removeFromWishlist = async (productId) => {
    try {
      await apiClient.delete(`/wishlist/${productId}`);
      setItems(prev => prev.filter(item => item._id !== productId));
    } catch {
      setError('Could not remove item');
    }
  };

  const addToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find(i => i._id === product._id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: { openDrawer: true } }));
  };

  if (loading) {
    return (
      <div style={styles.centerBox}>
        <p style={{ color: '#888' }}>Loading wishlist...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <AnimatedPage>
        <div style={styles.emptyContainer}>
          <div style={styles.emptyIcon}>❤️</div>
          <h2 style={styles.emptyTitle}>Your wishlist is empty</h2>
          <p style={styles.emptyText}>Save products you love for later</p>
          <Link to="/" style={styles.shopBtn}>Browse Products</Link>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div style={styles.container} className="wishlist-container">
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Your Wishlist</h1>
            <p style={styles.subtitle}>{items.length} item{items.length !== 1 ? 's' : ''} saved</p>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.grid}>
          {items.map(product => (
            <div key={product._id} style={styles.cardWrapper}>
              <ProductCard product={product} />
              <div style={styles.actions}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={styles.cartBtn} onClick={() => addToCart(product)}>
                  🛒 Add to Cart
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={styles.removeBtn} onClick={() => removeFromWishlist(product._id)}>
                  ✕ Remove
                </motion.button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AnimatedPage>
  );
}

const styles = {
  container: { width: '92%', maxWidth: '1600px', margin: '0 auto', padding: '40px 20px', animation: 'fadeIn 0.5s ease-out' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' },
  title: { fontSize: '28px', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)', letterSpacing: '-0.02em' },
  subtitle: { color: 'var(--text-secondary)', fontSize: '14px', margin: 0, fontWeight: 500 },
  error: {
    background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444',
    padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
    gap: '24px',
  },
  cardWrapper: { display: 'flex', flexDirection: 'column', gap: '10px' },
  actions: { display: 'flex', gap: '10px' },
  cartBtn: {
    flex: 1, padding: '12px',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
    color: '#fff',
    border: 'none', borderRadius: '10px', fontSize: '13px',
    fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s',
  },
  removeBtn: {
    padding: '12px 16px', background: 'var(--card-bg)', border: '1px solid var(--border)',
    borderRadius: '10px', fontSize: '13px', fontWeight: 600,
    color: '#ef4444', cursor: 'pointer', transition: 'all 0.2s',
  },
  centerBox: { textAlign: 'center', padding: '120px 20px', color: 'var(--text-secondary)' },
  emptyContainer: { textAlign: 'center', padding: '120px 20px', animation: 'fadeIn 0.5s ease-out' },
  emptyIcon: { fontSize: '72px', marginBottom: '20px' },
  emptyTitle: { fontSize: '24px', fontWeight: 800, margin: '0 0 10px', color: 'var(--text-primary)', letterSpacing: '-0.02em' },
  emptyText: { color: 'var(--text-muted)', marginBottom: '28px', fontSize: '15px' },
  shopBtn: {
    display: 'inline-flex', padding: '12px 32px',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
    color: '#fff', textDecoration: 'none', borderRadius: '10px', fontWeight: 700,
    boxShadow: 'var(--shadow-md)', transition: 'all 0.2s',
  },
};

export default Wishlist;