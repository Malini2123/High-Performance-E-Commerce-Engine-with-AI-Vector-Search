import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import ProductCard from '../components/ProductCard';

function Wishlist() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
          setItems(res.data.items || res.data || []);
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
    alert(`${product.name} added to cart!`);
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
      <div style={styles.emptyContainer}>
        <div style={styles.emptyIcon}>❤️</div>
        <h2 style={styles.emptyTitle}>Your wishlist is empty</h2>
        <p style={styles.emptyText}>Save products you love for later</p>
        <Link to="/" style={styles.shopBtn}>Browse Products</Link>
      </div>
    );
  }

  return (
    <div style={styles.container}>
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
              <button style={styles.cartBtn} onClick={() => addToCart(product)}>
                🛒 Add to Cart
              </button>
              <button style={styles.removeBtn} onClick={() => removeFromWishlist(product._id)}>
                ✕ Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '32px 20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  title: { fontSize: '28px', fontWeight: 700, margin: '0 0 4px' },
  subtitle: { color: '#888', fontSize: '14px', margin: 0 },
  error: {
    background: '#fff0f0', border: '1px solid #ffcccc', color: '#cc0000',
    padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '20px',
  },
  cardWrapper: { display: 'flex', flexDirection: 'column', gap: '8px' },
  actions: { display: 'flex', gap: '8px' },
  cartBtn: {
    flex: 1, padding: '10px', background: '#1a1a1a', color: '#fff',
    border: 'none', borderRadius: '8px', fontSize: '13px',
    fontWeight: 600, cursor: 'pointer',
  },
  removeBtn: {
    padding: '10px 14px', background: '#fff', border: '1px solid #ddd',
    borderRadius: '8px', fontSize: '13px', fontWeight: 500,
    color: '#cc0000', cursor: 'pointer',
  },
  centerBox: { textAlign: 'center', padding: '100px 20px' },
  emptyContainer: { textAlign: 'center', padding: '100px 20px' },
  emptyIcon: { fontSize: '64px', marginBottom: '16px' },
  emptyTitle: { fontSize: '22px', fontWeight: 700, margin: '0 0 8px' },
  emptyText: { color: '#888', marginBottom: '24px' },
  shopBtn: {
    display: 'inline-block', padding: '12px 28px', background: '#1a1a1a',
    color: '#fff', textDecoration: 'none', borderRadius: '8px', fontWeight: 600,
  },
};

export default Wishlist;