import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

function Cart() {
  const navigate = useNavigate();

  // Lazy initializer avoids the setState-in-effect warning
  const [cartItems, setCartItems] = useState(() => {
    return JSON.parse(localStorage.getItem('cart') || '[]');
  });

  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    async function calculateTotal() {
      if (cartItems.length === 0) {
        setTotal(null);
        return;
      }
      setLoading(true);
      try {
        const items = cartItems.map(item => ({ productId: item._id, quantity: item.quantity }));
        const res = await apiClient.post('/cart/total', { items });
        if (!ignore) {
          if (res.data && typeof res.data.finalTotal !== 'undefined') {
            setTotal(res.data);
          } else {
            setTotal(null);
            setError('Could not calculate total');
          }
        }
      } catch {
        if (!ignore) {
          setError('Could not calculate total');
        }
      }
      if (!ignore) {
        setLoading(false);
      }
    }

    calculateTotal();

    return () => {
      ignore = true;
    };
  }, [cartItems]);

  const updateQuantity = (id, delta) => {
    const updated = cartItems
      .map(item => item._id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item)
      .filter(item => item.quantity > 0);
    setCartItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  const removeItem = (id) => {
    const updated = cartItems.filter(item => item._id !== id);
    setCartItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  const handleCheckout = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    navigate('/login');
    return;
  }
  setCheckingOut(true);
  setError('');
  try {
    // Step 1 — create Razorpay order
    const { data } = await apiClient.post('/payment/create-order', {
      amount: total?.finalTotal || 0,
    });

    // Step 2 — open Razorpay popup
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: data.amount,
      currency: data.currency,
      name: 'ShopAI',
      description: 'Order Payment',
      order_id: data.orderId,
      handler: async (response) => {
        try {
          // Step 3 — verify payment
          await apiClient.post('/payment/verify', response);

          // Step 4 — place order
          const items = cartItems.map(item => ({
            productId: item._id,
            quantity: item.quantity,
          }));
          await apiClient.post('/cart/checkout', { items });

          localStorage.removeItem('cart');
          setCartItems([]);
          navigate('/orders');
        } catch {
          setError('Payment verified but order failed. Contact support.');
        }
      },
      prefill: {
        name: JSON.parse(localStorage.getItem('user') || '{}').name || '',
        email: JSON.parse(localStorage.getItem('user') || '{}').email || '',
      },
      theme: { color: '#1a1a1a' },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', () => setError('Payment failed. Please try again.'));
    rzp.open();
  } catch (err) {
    setError(err.response?.data?.error || 'Checkout failed');
  }
  setCheckingOut(false);
};

  if (cartItems.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <div style={styles.emptyIcon}>🛒</div>
        <h2 style={styles.emptyTitle}>Your cart is empty</h2>
        <p style={styles.emptyText}>Add some products to get started</p>
        <Link to="/" style={styles.shopBtn}>Browse Products</Link>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Your Cart</h1>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.layout}>
        <div style={styles.itemsList}>
          {cartItems.map(item => (
            <div key={item._id} style={styles.cartItem}>
              <div style={styles.itemImage}>
                {item.category || 'Item'}
              </div>
              <div style={styles.itemInfo}>
                <h3 style={styles.itemName}>{item.name}</h3>
                <p style={styles.itemPrice}>₹{item.price}</p>
              </div>
              <div style={styles.qtyControls}>
                <button style={styles.qtyBtn} onClick={() => updateQuantity(item._id, -1)}>−</button>
                <span style={styles.qtyValue}>{item.quantity}</span>
                <button style={styles.qtyBtn} onClick={() => updateQuantity(item._id, 1)}>+</button>
              </div>
              <div style={styles.itemSubtotal}>₹{(item.price * item.quantity).toFixed(2)}</div>
              <button style={styles.removeBtn} onClick={() => removeItem(item._id)}>✕</button>
            </div>
          ))}
        </div>

        <div style={styles.summary}>
          <h3 style={styles.summaryTitle}>Order Summary</h3>
          {loading ? (
            <p style={{ color: '#888' }}>Calculating...</p>
          ) : total ? (
            <>
              <div style={styles.summaryRow}>
                <span>Subtotal</span>
                <span>₹{Number(total.subtotal || 0).toFixed(2)}</span>
              </div>
              {Number(total.discount || 0) > 0 && (
                <div style={styles.summaryRow}>
                  <span>Discount</span>
                  <span style={{ color: '#22c55e' }}>−₹{Number(total.discount || 0).toFixed(2)}</span>
                </div>
              )}
              <div style={styles.summaryDivider} />
              <div style={{ ...styles.summaryRow, fontWeight: 700, fontSize: '18px' }}>
                <span>Total</span>
                <span>₹{Number(total.finalTotal || 0).toFixed(2)}</span>
              </div>
            </>
          ) : null}

          <button
            style={styles.checkoutBtn}
            onClick={handleCheckout}
            disabled={checkingOut || loading}
          >
            {checkingOut ? 'Processing...' : 'Checkout'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '1100px', margin: '0 auto', padding: '32px 20px' },
  title: { fontSize: '28px', fontWeight: 700, marginBottom: '24px' },
  error: {
    background: '#fff0f0', border: '1px solid #ffcccc', color: '#cc0000',
    padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px',
  },
  layout: { display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' },
  itemsList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  cartItem: {
    display: 'flex', alignItems: 'center', gap: '16px', background: '#fff',
    border: '1px solid #e0e0e0', borderRadius: '12px', padding: '16px',
  },
  itemImage: {
    width: '60px', height: '60px', background: '#f0f0f0', borderRadius: '8px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '11px', color: '#999', textTransform: 'uppercase', flexShrink: 0,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: '15px', fontWeight: 600, margin: '0 0 4px' },
  itemPrice: { fontSize: '13px', color: '#888', margin: 0 },
  qtyControls: { display: 'flex', alignItems: 'center', gap: '10px' },
  qtyBtn: {
    width: '28px', height: '28px', border: '1px solid #ddd', background: '#fff',
    borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 600,
  },
  qtyValue: { fontSize: '15px', fontWeight: 600, minWidth: '20px', textAlign: 'center' },
  itemSubtotal: { fontSize: '15px', fontWeight: 700, minWidth: '80px', textAlign: 'right' },
  removeBtn: {
    border: 'none', background: 'none', color: '#999', fontSize: '18px',
    cursor: 'pointer', padding: '4px',
  },
  summary: {
    background: '#f8f9fa', borderRadius: '16px', padding: '24px',
    position: 'sticky', top: '80px',
  },
  summaryTitle: { fontSize: '18px', fontWeight: 700, marginBottom: '16px' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '10px', color: '#444' },
  summaryDivider: { borderTop: '1px solid #ddd', margin: '12px 0' },
  checkoutBtn: {
    width: '100%', padding: '14px', background: '#1a1a1a', color: '#fff',
    border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600,
    cursor: 'pointer', marginTop: '16px',
  },
  emptyContainer: { textAlign: 'center', padding: '100px 20px' },
  emptyIcon: { fontSize: '64px', marginBottom: '16px' },
  emptyTitle: { fontSize: '22px', fontWeight: 700, margin: '0 0 8px' },
  emptyText: { color: '#888', marginBottom: '24px' },
  shopBtn: {
    display: 'inline-block', padding: '12px 28px', background: '#1a1a1a',
    color: '#fff', textDecoration: 'none', borderRadius: '8px', fontWeight: 600,
  },
};

export default Cart;