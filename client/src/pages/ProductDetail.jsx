import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import ProductCard from '../components/ProductCard';
import { getImageUrl } from '../utils/images';
import useScrollRestore from '../hooks/useScrollRestore';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ userName: '', rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [added, setAdded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Restore scroll after refresh (waits for product data)
  useScrollRestore(loading);

  const token = localStorage.getItem('token');
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    if (product) {
      try {
        const saved = JSON.parse(localStorage.getItem('wishlistIds') || '[]');
        setIsWishlisted(saved.includes(product._id));
      } catch {
        setIsWishlisted(false);
      }
    }
  }, [product]);

  const toggleWishlist = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
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
    } catch (err) {
      console.error('Wishlist toggle error:', err);
    }
  };

  useEffect(() => {
    setImgError(false);
    const fetchData = async () => {
      try {
        const [prodRes, simRes, revRes] = await Promise.all([
          apiClient.get(`/products/${id}`),
          apiClient.get(`/products/${id}/similar`),
          apiClient.get(`/reviews/${id}`)
        ]);
        setProduct(prodRes.data.data);
        setSimilar(simRes.data.similar || []);
        setReviews(revRes.data.reviews || []);
        setAvgRating(revRes.data.averageRating || 0);
      } catch {
        // handle error silently
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find(item => item._id === product._id);

    let updated;
    if (existing) {
      updated = cart.map(item =>
        item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      updated = [...cart, { ...product, quantity: 1 }];
    }

    localStorage.setItem('cart', JSON.stringify(updated));
    setAdded(true);
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: { openDrawer: true } }));
    setTimeout(() => setAdded(false), 1500);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/reviews', { productId: id, ...reviewForm });
      const res = await apiClient.get(`/reviews/${id}`);
      setReviews(res.data.reviews || []);
      setAvgRating(res.data.averageRating || 0);
      setReviewForm({ userName: '', rating: 5, comment: '' });
    } catch {
      alert('Failed to submit review');
    }
    setSubmitting(false);
  };

  if (loading) return <div style={styles.center}>Loading...</div>;
  if (!product) return <div style={styles.center}>Product not found</div>;

  return (
    <AnimatedPage>
      <div style={styles.container} className="product-detail-container">
        <motion.button
          onClick={() => navigate(-1)}
          style={styles.back}
          whileHover={{ scale: 1.05, x: -3 }}
          whileTap={{ scale: 0.95 }}
        >
          ← Back
        </motion.button>

        <div style={styles.productRow} className="product-detail-row">
          <motion.div
            style={styles.imageBox}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {!imgError ? (
              <motion.img
                src={getImageUrl(product)}
                alt={product.name}
                style={styles.image}
                whileHover={{ scale: 1.04 }}
                transition={{ duration: 0.4 }}
                onError={() => setImgError(true)}
              />
            ) : (
              <div style={styles.fallbackBox}>
                <span style={{ fontSize: 72, marginBottom: 10 }}>
                  {product.category?.toLowerCase() === 'food' ? '🥗' :
                   product.category?.toLowerCase() === 'electronics' ? '📱' :
                   product.category?.toLowerCase() === 'clothing' ? '👕' :
                   product.category?.toLowerCase() === 'books' ? '📚' :
                   product.category?.toLowerCase() === 'sports' ? '⚽' :
                   product.category?.toLowerCase() === 'home' ? '🏠' :
                   product.category?.toLowerCase() === 'beauty' ? '💄' : '🛍️'}
                </span>
                <span style={styles.category}>{product.category}</span>
              </div>
            )}
          </motion.div>
        <div style={styles.details}>
          <div style={styles.categoryBadge}>{product.category}</div>
          <h1 style={styles.name}>{product.name}</h1>
          <div style={styles.ratingRow}>
            <span style={styles.stars}>
              {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
            </span>
            <span style={styles.ratingText}>{avgRating.toFixed(1)}/5.0 ({reviews.length} reviews)</span>
          </div>
          <p style={styles.description}>{product.description}</p>
          <div style={styles.priceRow}>
            <span style={styles.price}>₹{product.price}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span style={styles.originalPrice}>₹{product.originalPrice}</span>
            )}
            <span style={{
              ...styles.stock,
              color: product.stock > 10 ? '#10b981' : product.stock > 0 ? '#f59e0b' : '#ef4444',
              background: product.stock > 10 ? 'rgba(16, 185, 129, 0.1)' : product.stock > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            }}>
              {product.stock > 10 ? '✓ In Stock' : product.stock > 0 ? `Only ${product.stock} left` : 'Out of Stock'}
            </span>
          </div>
          
          {/* Policies Badge */}
          <div style={styles.policyCard} className="product-policy-card">
            <div style={styles.policyItem}>
              <span style={styles.policyIcon}>🚚</span>
              <div style={styles.policyDetails}>
                <span style={styles.policyTitle}>Free Delivery</span>
                <span style={styles.policyDesc}>On orders above ₹500</span>
              </div>
            </div>
            <div style={styles.policyItem}>
              <span style={styles.policyIcon}>🔄</span>
              <div style={styles.policyDetails}>
                <span style={styles.policyTitle}>7-Day Returns</span>
                <span style={styles.policyDesc}>7-day return policy applicable</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', width: '100%', marginTop: '8px' }}>
            <motion.button
              style={{
                ...(added ? { ...styles.addBtn, background: '#10b981', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' } :
                     product.stock === 0 ? { ...styles.addBtn, background: 'var(--border)', color: 'var(--text-muted)', cursor: 'not-allowed', boxShadow: 'none' } :
                     styles.addBtn),
                flex: 2,
                margin: 0,
              }}
              disabled={product.stock === 0}
              onClick={addToCart}
              whileHover={!added && product.stock > 0 ? { scale: 1.02 } : {}}
              whileTap={!added && product.stock > 0 ? { scale: 0.98 } : {}}
            >
              <AnimatePresence mode="wait">
                {added ? (
                  <motion.span
                    key="added"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
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
                  >
                    {product.stock === 0 ? 'Out of Stock' : '🛒 Add to Cart'}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
            <motion.button
              onClick={toggleWishlist}
              style={{
                ...(isWishlisted ? styles.wishlistActiveBtn : styles.wishlistBtn),
                flex: 1,
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <motion.span
                key={isWishlisted ? 'saved' : 'unsaved'}
                initial={{ scale: 0.7 }}
                animate={{ scale: [0.7, 1.3, 1] }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                {isWishlisted ? '❤️ Saved' : '🤍 Wishlist'}
              </motion.span>
            </motion.button>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Customer Reviews</h2>
        {reviews.length === 0 ? (
          <p style={styles.empty}>No reviews yet. Be the first!</p>
        ) : (
          reviews.map(r => (
            <div key={r._id} style={styles.reviewCard}>
              <div style={styles.reviewTop}>
                <strong>{r.userName}</strong>
                <span style={styles.reviewStars}>
                  {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                </span>
              </div>
              <p style={styles.reviewComment}>{r.comment}</p>
              <span style={styles.reviewDate}>
                {new Date(r.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))
        )}

        <h3 style={styles.subTitle}>Write a Review</h3>
        <form onSubmit={submitReview} style={styles.form}>
          <input
            style={styles.input}
            placeholder="Your name"
            value={reviewForm.userName}
            onChange={e => setReviewForm({...reviewForm, userName: e.target.value})}
            required
          />
          <select
            style={styles.input}
            value={reviewForm.rating}
            onChange={e => setReviewForm({...reviewForm, rating: Number(e.target.value)})}
          >
            {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Stars</option>)}
          </select>
          <textarea
            style={{...styles.input, height: '80px', resize: 'vertical'}}
            placeholder="Write your review..."
            value={reviewForm.comment}
            onChange={e => setReviewForm({...reviewForm, comment: e.target.value})}
            required
          />
          <button type="submit" style={styles.submitBtn} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>

      {similar.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Similar Products</h2>
          <div style={styles.grid}>
            {similar.slice(0, 4).map(p => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
    </AnimatedPage>
  );
}

const styles = {
  container: { width: '92%', maxWidth: '1600px', margin: '0 auto', padding: '40px 20px', animation: 'fadeIn 0.5s ease-out' },
  center: { textAlign: 'center', padding: '100px 20px', color: 'var(--text-secondary)', fontSize: '16px' },
  back: {
    background: 'var(--card-bg)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '10px 20px',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    marginBottom: '32px',
    fontSize: '14px',
    fontWeight: 600,
    boxShadow: 'var(--shadow-sm)',
    transition: 'all 0.2s',
  },
  productRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '48px',
    marginBottom: '56px',
    alignItems: 'start',
  },
  imageBox: {
    background: 'var(--bg-secondary)',
    borderRadius: '20px',
    height: '450px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-lg)',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  fallbackBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  category: {
    color: 'var(--text-muted)',
    fontSize: '14px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
  },
  categoryBadge: {
    background: 'rgba(99, 102, 241, 0.1)',
    color: 'var(--primary)',
    borderRadius: '20px',
    padding: '6px 14px',
    fontSize: '11px',
    fontWeight: 800,
    textTransform: 'uppercase',
    width: 'fit-content',
    letterSpacing: '0.8px',
  },
  details: { display: 'flex', flexDirection: 'column', gap: '16px' },
  name: { fontSize: '32px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' },
  ratingRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  stars: { color: 'var(--accent)', fontSize: '18px' },
  ratingText: { color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 },
  description: { color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '15px' },
  priceRow: { display: 'flex', alignItems: 'center', gap: '16px', margin: '8px 0 16px' },
  price: { fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)' },
  originalPrice: { fontSize: '20px', color: 'var(--text-muted)', textDecoration: 'line-through', fontWeight: 500 },
  stock: { padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 },
  policyCard: {
    display: 'flex',
    gap: '20px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '14px 18px',
    margin: '16px 0',
  },
  policyItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1,
  },
  policyIcon: {
    fontSize: '20px',
  },
  policyDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  policyTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  policyDesc: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  addBtn: {
    padding: '16px 36px',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: 'var(--shadow-md)',
    transition: 'all 0.2s',
  },
  wishlistBtn: {
    padding: '16px 20px',
    background: 'var(--card-bg)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: 'var(--shadow-sm)',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
  wishlistActiveBtn: {
    padding: '16px 20px',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: 'var(--shadow-sm)',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
  section: { marginBottom: '56px' },
  sectionTitle: {
    fontSize: '22px',
    fontWeight: 800,
    marginBottom: '24px',
    borderBottom: '2px solid var(--border)',
    paddingBottom: '12px',
    color: 'var(--text-primary)',
  },
  subTitle: { fontSize: '18px', fontWeight: 700, margin: '32px 0 16px', color: 'var(--text-primary)' },
  empty: { color: 'var(--text-muted)', fontStyle: 'italic' },
  reviewCard: {
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
    background: 'var(--card-bg)',
    boxShadow: 'var(--shadow-sm)',
  },
  reviewTop: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  reviewStars: { color: 'var(--accent)' },
  reviewComment: { color: 'var(--text-primary)', margin: '0 0 8px', fontSize: '14px' },
  reviewDate: { color: 'var(--text-muted)', fontSize: '12px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '550px' },
  input: {
    padding: '12px 16px',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    fontSize: '14px',
    background: 'var(--card-bg)',
    color: 'var(--text-primary)',
  },
  submitBtn: {
    padding: '14px',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: 'var(--shadow-md)',
    transition: 'all 0.2s',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '24px',
  },
};

export default ProductDetail;