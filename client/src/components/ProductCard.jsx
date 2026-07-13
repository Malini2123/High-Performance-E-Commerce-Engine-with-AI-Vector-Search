/* eslint-disable */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl, getFallbackImage } from '../utils/images';
import apiClient from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  hover: {
    y: -8,
    boxShadow: 'var(--shadow-card-hover)',
    borderColor: 'var(--secondary)',
  }
};

const CATEGORY_ICONS = {
  food: '🍎',
  electronics: '💻',
  clothing: '👕',
  books: '📚',
  sports: '⚽',
  home: '🏠',
  beauty: '✨',
  default: '🛍️',
};

// Deterministic discount based on product id
function getDiscount(product) {
  if (product.originalPrice && product.originalPrice > product.price) {
    const pct = Math.round((1 - product.price / product.originalPrice) * 100);
    return { pct, saved: product.originalPrice - product.price, original: product.originalPrice };
  }
  const seed = product._id ? product._id.charCodeAt(product._id.length - 1) : 0;
  const pct = [10, 15, 20, 25, 30][seed % 5];
  const original = Math.round(product.price / (1 - pct / 100) / 10) * 10;
  return { pct, saved: original - product.price, original };
}

function ProductCard({ product }) {
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const checkCart = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      return cart.some(item => item._id === product._id);
    } catch {
      return false;
    }
  };

  const [isInCart, setIsInCart] = useState(checkCart);

  useEffect(() => {
    const handleCartUpdate = () => {
      setIsInCart(checkCart());
    };
    window.addEventListener('cart-updated', handleCartUpdate);
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
    };
  }, [product._id]);

  const token = localStorage.getItem('token');
  const [isWishlisted, setIsWishlisted] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('wishlistIds') || '[]');
      return saved.includes(product._id);
    } catch {
      return false;
    }
  });

  const toggleWishlist = async (e) => {
    e.stopPropagation();
    if (!token) { navigate('/login'); return; }
    try {
      let saved = JSON.parse(localStorage.getItem('wishlistIds') || '[]');
      if (isWishlisted) {
        await apiClient.delete(`/wishlist/${product._id}`);
        saved = saved.filter(id => id !== product._id);
        setIsWishlisted(false);
      } else {
        await apiClient.post(`/wishlist/${product._id}`);
        saved = [...saved, product._id];
        setIsWishlisted(true);
      }
      localStorage.setItem('wishlistIds', JSON.stringify(saved));
      window.dispatchEvent(new CustomEvent('wishlist-updated'));
    } catch (err) {
      console.error('Wishlist toggle error:', err);
    }
  };

  const categoryKey = product.category?.toLowerCase() || 'default';
  const icon = CATEGORY_ICONS[categoryKey] || CATEGORY_ICONS.default;
  const { pct, saved, original } = getDiscount(product);

  const addToCart = (e) => {
    e.stopPropagation();
    if (product.stock === 0) return;
    if (isInCart) {
      navigate('/cart');
      return;
    }
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find(item => item._id === product._id);
    const updated = existing
      ? cart.map(item => item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item)
      : [...cart, { ...product, quantity: 1 }];
    localStorage.setItem('cart', JSON.stringify(updated));
    setAdded(true);
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: { openDrawer: true } }));
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      onClick={() => navigate(`/product/${product._id}`)}
      style={styles.card}
    >
      {/* ── Image Area ── */}
      <div style={styles.imageWrapper}>
        {!imgError ? (
          <motion.img
            src={getImageUrl(product)}
            alt={product.name}
            style={styles.image}
            variants={{ hover: { scale: 1.07 } }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            onError={() => setImgError(true)}
          />
        ) : (
          <img
            src={getFallbackImage(product.name, product.category)}
            alt={product.name}
            style={styles.image}
          />
        )}

        {/* Out of stock overlay */}
        {product.stock === 0 && (
          <div style={styles.outOfStockOverlay}>Out of Stock</div>
        )}

        {/* Category tag — top left */}
        <span style={styles.categoryTag}>
          <span style={{ marginRight: 4 }}>{icon}</span>
          <span>{product.category}</span>
        </span>

        {/* Discount badge — top right */}
        <span style={styles.discountBadge}>-{pct}% OFF</span>

        {/* Name gradient overlay — bottom */}
        <div style={styles.nameOverlay}>
          {product.name}
        </div>

        {/* Wishlist button — bottom right */}
        <motion.button
          onClick={toggleWishlist}
          style={styles.wishlistBtn}
          whileHover={{ scale: 1.15, background: '#fff' }}
          whileTap={{ scale: 0.9 }}
        >
          <motion.span
            key={isWishlisted ? 'liked' : 'unliked'}
            initial={{ scale: 0.6 }}
            animate={{ scale: [0.6, 1.4, 1] }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            style={{ display: 'inline-block' }}
          >
            {isWishlisted ? '❤️' : '🤍'}
          </motion.span>
        </motion.button>
      </div>

      {/* ── Info Area ── */}
      <div style={styles.info}>
        {/* Category label */}
        <div style={styles.categoryLabel}>{product.category}</div>

        {/* Price row */}
        <div style={styles.priceRow}>
          <div style={styles.priceGroup}>
            <span style={styles.price}>₹{product.price}</span>
            <span style={styles.originalPrice}>₹{original}</span>
          </div>
          <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 700 }}>
            Save ₹{saved}
          </span>
        </div>

        {/* Stock */}
        <div style={{ marginBottom: 12 }}>
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: product.stock > 10 ? '#10b981' : product.stock > 0 ? '#f59e0b' : '#ef4444'
          }}>
            {product.stock > 10 ? '✓ In stock' : product.stock > 0 ? `⚠ Only ${product.stock} left` : '✗ Out of stock'}
          </span>
        </div>

        {/* Add to cart */}
        <motion.button
          style={
            added
              ? { ...styles.btn, background: '#10b981', boxShadow: '0 4px 12px rgba(16,185,129,0.25)' }
              : product.stock === 0
              ? { ...styles.btn, background: '#e2e8f0', color: '#94a3b8', cursor: 'not-allowed', boxShadow: 'none' }
              : styles.btn
          }
          disabled={product.stock === 0}
          onClick={addToCart}
          whileHover={!added && product.stock > 0 ? { scale: 1.02, boxShadow: '0 6px 18px rgba(42,78,53,0.4)' } : {}}
          whileTap={!added && product.stock > 0 ? { scale: 0.97 } : {}}
        >
          <AnimatePresence mode="wait">
            {added ? (
              <motion.span
                key="added"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, justifyContent: 'center', width: '100%' }}
              >
                ✓ Added to Cart!
              </motion.span>
            ) : (
              <motion.span
                key="add"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, justifyContent: 'center', width: '100%' }}
              >
                {product.stock === 0 ? 'Out of Stock' : isInCart ? '🛍️ Buy Now' : '🛒 Add to Cart'}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  );
}

const styles = {
  card: {
    border: '1px solid var(--border)',
    borderRadius: 18,
    overflow: 'hidden',
    background: '#fff',
    boxShadow: 'var(--shadow-card)',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  imageWrapper: {
    position: 'relative',
    height: 200,
    overflow: 'hidden',
    background: 'var(--bg-secondary)',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  imageFallback: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, var(--bg-secondary), #d0dfd5)',
  },
  categoryTag: {
    position: 'absolute', top: 10, left: 10,
    background: 'var(--secondary)',
    color: '#fff',
    borderRadius: 20, padding: '4px 10px',
    fontSize: 10, fontWeight: 700,
    display: 'inline-flex', alignItems: 'center', zIndex: 2,
    boxShadow: '0 2px 8px rgba(11,47,29,0.15)',
    letterSpacing: '0.3px',
  },
  discountBadge: {
    position: 'absolute', top: 10, right: 10,
    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    color: '#fff',
    fontSize: 10, fontWeight: 800,
    padding: '4px 9px',
    borderRadius: 20, zIndex: 2,
    boxShadow: '0 2px 6px rgba(239,68,68,0.35)',
    letterSpacing: '0.3px',
  },
  outOfStockOverlay: {
    position: 'absolute', inset: 0,
    background: 'rgba(11,47,29,0.75)',
    backdropFilter: 'blur(3px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: 13, fontWeight: 700,
    zIndex: 3,
  },
  nameOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    background: 'linear-gradient(to top, rgba(11,47,29,0.85) 0%, rgba(0,0,0,0) 100%)',
    color: '#fff', padding: '28px 12px 10px',
    fontSize: 12, fontWeight: 700,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    zIndex: 1,
    letterSpacing: '0.1px',
  },
  wishlistBtn: {
    position: 'absolute',
    bottom: 10, right: 10,
    background: 'rgba(255,255,255,0.82)',
    backdropFilter: 'blur(6px)',
    border: '1px solid rgba(255,255,255,0.5)',
    width: 34, height: 34,
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', zIndex: 3,
    fontSize: 15,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'all 0.2s',
  },
  info: {
    padding: '14px 14px 16px',
    display: 'flex', flexDirection: 'column', flex: 1,
  },
  categoryLabel: {
    fontSize: 10, fontWeight: 700,
    color: 'var(--text-muted)', textTransform: 'uppercase',
    letterSpacing: '0.6px', marginBottom: 6,
  },
  priceRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  priceGroup: { display: 'flex', alignItems: 'baseline', gap: 6 },
  price: { fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' },
  originalPrice: { fontSize: 12, color: 'var(--text-muted)', textDecoration: 'line-through' },
  btn: {
    width: '100%', padding: '11px',
    background: 'linear-gradient(135deg, var(--secondary) 0%, var(--secondary-hover) 100%)',
    color: '#fff',
    border: 'none', borderRadius: 12,
    fontSize: 13, fontWeight: 700, cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 3px 10px rgba(22,163,74,0.18)',
    marginTop: 'auto',
  },
};

export default ProductCard;