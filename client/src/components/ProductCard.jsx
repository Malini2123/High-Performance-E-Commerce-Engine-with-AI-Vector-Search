import { useNavigate } from 'react-router-dom';

function ProductCard({ product }) {
  const navigate = useNavigate();

  const addToCart = (e) => {
    e.stopPropagation();
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
  };

  return (
    <div style={styles.card} onClick={() => navigate(`/product/${product._id}`)}>
      <div style={styles.imagePlaceholder}>
        <span style={styles.imageText}>{product.category}</span>
      </div>
      <div style={styles.info}>
        <h3 style={styles.name}>{product.name}</h3>
        <p style={styles.description}>{product.description}</p>
        <div style={styles.bottomRow}>
          <span style={styles.price}>₹{product.price}</span>
          <span style={styles.stock}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </span>
        </div>
        <button
          style={product.stock === 0 ? {...styles.button, ...styles.buttonDisabled} : styles.button}
          disabled={product.stock === 0}
          onClick={addToCart}
        >
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  card: {
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    overflow: 'hidden',
    background: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  imagePlaceholder: {
    height: '160px',
    background: 'linear-gradient(135deg, #f0f4f8, #d9e2ec)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageText: {
    color: '#627d98',
    fontSize: '13px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  info: { padding: '14px' },
  name: {
    fontSize: '15px',
    fontWeight: 600,
    margin: '0 0 6px',
    color: '#1a1a1a',
    lineHeight: 1.3,
  },
  description: {
    fontSize: '12px',
    color: '#666',
    margin: '0 0 10px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  bottomRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  price: { fontSize: '18px', fontWeight: 700, color: '#1a1a1a' },
  stock: { fontSize: '11px', color: '#888' },
  button: {
    width: '100%',
    padding: '10px',
    background: '#1a1a1a',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  buttonDisabled: {
    background: '#ccc',
    cursor: 'not-allowed',
  },
};

export default ProductCard;