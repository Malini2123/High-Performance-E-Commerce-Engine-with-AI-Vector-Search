import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import ProductCard from '../components/ProductCard';

const CATEGORIES = ['All', 'Food', 'Electronics', 'Clothing', 'Books', 'Home', 'Beauty'];

function Home() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    apiClient.get('/products')
      .then((res) => {
        const data = res.data.data || [];
        setProducts(data);
        setFiltered(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const filterCategory = (cat) => {
    setActiveCategory(cat);
    if (cat === 'All') {
      setFiltered(products);
    } else {
      setFiltered(products.filter(p =>
        p.category?.toLowerCase() === cat.toLowerCase()
      ));
    }
  };

  return (
    <div style={styles.page}>
      {/* Hero Banner */}
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          <p style={styles.heroEyebrow}>Free delivery on orders over ₹499</p>
          <h1 style={styles.heroTitle}>Fresh picks, delivered fast</h1>
          <p style={styles.heroSub}>Browse 10,000+ products from top brands</p>
          <button style={styles.heroBtn} onClick={() => navigate('/search')}>
            🔍 Search products
          </button>
        </div>
        <div style={styles.heroVisual}>
          <div style={styles.heroBadge}>🛍️</div>
        </div>
      </div>

      {/* Promo Strip */}
      <div style={styles.promoStrip}>
        {['🚚 Free Delivery above ₹499', '↩️ Easy 7-day Returns', '🔒 Secure Payments', '⭐ 10K+ Happy Customers'].map((item, i) => (
          <span key={i} style={styles.promoItem}>{item}</span>
        ))}
      </div>

      <div style={styles.main}>
        {/* Category Filter */}
        <div style={styles.categoryRow}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              style={activeCategory === cat ? { ...styles.catBtn, ...styles.catBtnActive } : styles.catBtn}
              onClick={() => filterCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results Header */}
        <div style={styles.resultsHeader}>
          <span style={styles.resultsCount}>
            {loading ? 'Loading...' : `${filtered.length} products`}
          </span>
          <span style={styles.resultsSort}>Best Match</span>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div style={styles.loadingGrid}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={styles.skeleton} />
            ))}
          </div>
        ) : error ? (
          <div style={styles.errorBox}>⚠️ {error}</div>
        ) : filtered.length === 0 ? (
          <div style={styles.emptyBox}>
            <p style={{ fontSize: '40px' }}>🔍</p>
            <p>No products in this category yet</p>
            <button style={styles.clearBtn} onClick={() => filterCategory('All')}>View all products</button>
          </div>
        ) : (
          <div style={styles.grid}>
            {filtered.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f5f5f5',
  },

  // Hero
  hero: {
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
    color: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '48px 40px',
    gap: '24px',
  },
  heroContent: { maxWidth: '520px' },
  heroEyebrow: {
    fontSize: '13px',
    color: '#f59e0b',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '12px',
  },
  heroTitle: {
    fontSize: '42px',
    fontWeight: 800,
    lineHeight: 1.15,
    margin: '0 0 12px',
  },
  heroSub: {
    fontSize: '16px',
    color: '#aaa',
    marginBottom: '24px',
  },
  heroBtn: {
    padding: '13px 28px',
    background: '#f59e0b',
    color: '#1a1a1a',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  heroVisual: {
    width: '180px',
    height: '180px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heroBadge: { fontSize: '80px' },

  // Promo Strip
  promoStrip: {
    background: '#fff',
    borderBottom: '1px solid #e8e8e8',
    display: 'flex',
    justifyContent: 'center',
    gap: '40px',
    padding: '12px 24px',
    flexWrap: 'wrap',
  },
  promoItem: {
    fontSize: '13px',
    color: '#444',
    fontWeight: 500,
  },

  // Main
  main: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '24px 20px 48px',
  },

  // Categories
  categoryRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  catBtn: {
    padding: '8px 18px',
    border: '1px solid #ddd',
    borderRadius: '20px',
    background: '#fff',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    color: '#444',
    transition: 'all 0.15s',
  },
  catBtnActive: {
    background: '#1a1a1a',
    color: '#fff',
    border: '1px solid #1a1a1a',
  },

  // Results
  resultsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  resultsCount: { fontSize: '14px', color: '#666', fontWeight: 500 },
  resultsSort: { fontSize: '13px', color: '#888' },

  // Grid
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
  },

  // Skeleton loading
  loadingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
  },
  skeleton: {
    height: '280px',
    background: 'linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%)',
    backgroundSize: '200% 100%',
    borderRadius: '12px',
    animation: 'shimmer 1.5s infinite',
  },

  // States
  errorBox: {
    textAlign: 'center', padding: '60px', color: '#cc0000',
    background: '#fff0f0', borderRadius: '12px', fontSize: '15px',
  },
  emptyBox: {
    textAlign: 'center', padding: '60px', color: '#888',
    background: '#fff', borderRadius: '12px',
  },
  clearBtn: {
    marginTop: '12px', padding: '10px 20px',
    background: '#1a1a1a', color: '#fff',
    border: 'none', borderRadius: '8px',
    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
  },
};

export default Home;