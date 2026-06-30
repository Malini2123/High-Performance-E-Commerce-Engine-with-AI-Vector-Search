import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import ProductCard from '../components/ProductCard';

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

  useEffect(() => {
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
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.back}>← Back</button>

      <div style={styles.productRow}>
        <div style={styles.imageBox}>
          <span style={styles.category}>{product.category}</span>
        </div>
        <div style={styles.details}>
          <h1 style={styles.name}>{product.name}</h1>
          <div style={styles.ratingRow}>
            <span style={styles.stars}>
              {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
            </span>
            <span style={styles.ratingText}>{avgRating}/5 ({reviews.length} reviews)</span>
          </div>
          <p style={styles.description}>{product.description}</p>
          <div style={styles.priceRow}>
            <span style={styles.price}>₹{product.price}</span>
            <span style={styles.stock}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </span>
          </div>
          <button style={styles.addBtn} disabled={product.stock === 0} onClick={addToCart}>
            {product.stock === 0 ? 'Out of Stock' : added ? '✓ Added' : '🛒 Add to Cart'}
          </button>
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
  );
}

const styles = {
  container: { maxWidth: '1000px', margin: '0 auto', padding: '32px 20px' },
  center: { textAlign: 'center', padding: '60px', color: '#888' },
  back: {
    background: 'none',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '8px 16px',
    cursor: 'pointer',
    marginBottom: '24px',
    fontSize: '14px'
  },
  productRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '40px',
    marginBottom: '48px'
  },
  imageBox: {
    background: 'linear-gradient(135deg, #f0f4f8, #d9e2ec)',
    borderRadius: '12px',
    height: '320px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  category: {
    color: '#627d98',
    fontSize: '14px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  details: { display: 'flex', flexDirection: 'column', gap: '12px' },
  name: { fontSize: '28px', fontWeight: 700, margin: 0 },
  ratingRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  stars: { color: '#f59e0b', fontSize: '18px' },
  ratingText: { color: '#666', fontSize: '14px' },
  description: { color: '#444', lineHeight: 1.6, fontSize: '15px' },
  priceRow: { display: 'flex', alignItems: 'center', gap: '16px' },
  price: { fontSize: '32px', fontWeight: 700 },
  stock: { color: '#666', fontSize: '14px' },
  addBtn: {
    padding: '14px 28px',
    background: '#1a1a1a',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  section: { marginBottom: '48px' },
  sectionTitle: {
    fontSize: '22px',
    fontWeight: 700,
    marginBottom: '20px',
    borderBottom: '2px solid #f0f0f0',
    paddingBottom: '10px'
  },
  subTitle: { fontSize: '18px', fontWeight: 600, margin: '24px 0 12px' },
  empty: { color: '#888', fontStyle: 'italic' },
  reviewCard: {
    border: '1px solid #eee',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '12px'
  },
  reviewTop: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  reviewStars: { color: '#f59e0b' },
  reviewComment: { color: '#444', margin: '0 0 8px' },
  reviewDate: { color: '#aaa', fontSize: '12px' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '500px' },
  input: {
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px'
  },
  submitBtn: {
    padding: '12px',
    background: '#1a1a1a',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px'
  },
};

export default ProductDetail;