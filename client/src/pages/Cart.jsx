import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { getImageUrl } from '../utils/images';
import useScrollRestore from '../hooks/useScrollRestore';
import AnimatedPage from '../components/AnimatedPage';
import { motion } from 'framer-motion';

function Cart() {
  const navigate = useNavigate();

  // Restore scroll position on page refresh
  useScrollRestore(false);

  // Lazy initializer avoids the setState-in-effect warning
  const [cartItems, setCartItems] = useState(() => {
    return JSON.parse(localStorage.getItem('cart') || '[]');
  });

  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');

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

  const updateQuantity = (id, size, delta) => {
    const updated = cartItems
      .map(item => (item._id === id && (item.selectedSize || '') === (size || '')) ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item)
      .filter(item => item.quantity > 0);
    setCartItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const removeItem = (id, size) => {
    const updated = cartItems.filter(item => !(item._id === id && (item.selectedSize || '') === (size || '')));
    setCartItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const handleCheckout = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    if (!address.trim()) {
      setError('Please provide a shipping address');
      return;
    }
    if (!total) {
      setError('Please wait for order total to load');
      return;
    }
    setCheckingOut(true);
    setError('');

    const items = cartItems.map(item => ({
      productId: item._id,
      quantity: item.quantity,
      size: item.selectedSize || '',
    }));

    try {
      if (paymentMethod === 'COD') {
        // Place COD Order directly
        await apiClient.post('/orders', {
          items,
          address,
          paymentMethod: 'COD'
        });
        localStorage.removeItem('cart');
        setCartItems([]);
        navigate('/orders');
      } else {
        // Place Prepaid Order via Razorpay
        const { data } = await apiClient.post('/payment/create-order', {
          amount: total?.finalTotal || 0,
        });

        const options = {
          key: data.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: data.amount,
          currency: data.currency,
          name: 'ShopAI',
          description: 'Order Payment',
          order_id: data.orderId,
          handler: async (response) => {
            try {
              await apiClient.post('/payment/verify', response);
              await apiClient.post('/orders', {
                items,
                address,
                paymentMethod: 'Razorpay'
              });
              localStorage.removeItem('cart');
              setCartItems([]);
              navigate('/orders');
            } catch {
              setError('Payment verified but order failed. Contact support.');
            } finally {
              setCheckingOut(false);
            }
          },
          prefill: {
            name: JSON.parse(localStorage.getItem('user') || '{}').name || '',
            email: JSON.parse(localStorage.getItem('user') || '{}').email || '',
          },
          theme: { color: '#1a1a1a' },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', () => {
          setError('Payment failed. Please try again.');
          setCheckingOut(false);
        });
        rzp.open();
        // Don't reset checkingOut here — it's reset inside handler/failed callbacks
        return;
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Checkout failed');
    }
    setCheckingOut(false);
  };

  if (cartItems.length === 0) {
    return (
      <AnimatedPage>
        <div style={styles.emptyContainer}>
          <div style={styles.emptyIcon}>🛒</div>
          <h2 style={styles.emptyTitle}>Your cart is empty</h2>
          <p style={styles.emptyText}>Add some products to get started</p>
          <Link to="/" style={styles.shopBtn}>Browse Products</Link>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div style={styles.container} className="cart-container">
        <h1 style={styles.title}>Your Cart</h1>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.layout} className="cart-layout">
          <div style={styles.itemsList}>
            {cartItems.map(item => (
              <div key={`${item._id}-${item.selectedSize || ''}`} style={styles.cartItem} className="cart-item-row">
                <img
                  src={getImageUrl(item)}
                  alt={item.name}
                  style={styles.itemImage}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const fallback = e.target.parentNode.querySelector('.cart-fallback');
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div className="cart-fallback" style={styles.itemImageFallback}>
                  {item.category?.substring(0, 3).toUpperCase() || 'ITM'}
                </div>
                <div style={styles.itemInfo}>
                  <h3 style={styles.itemName}>{item.name}</h3>
                  {item.selectedSize && (
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 6px' }}>
                      Size: <strong style={{ color: 'var(--text-primary)' }}>{item.selectedSize}</strong>
                    </p>
                  )}
                  <p style={styles.itemPrice}>₹{item.price}</p>
                </div>
                <div style={styles.qtyControls}>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} style={styles.qtyBtn} onClick={() => updateQuantity(item._id, item.selectedSize, -1)}>−</motion.button>
                  <span style={styles.qtyValue}>{item.quantity}</span>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} style={styles.qtyBtn} onClick={() => updateQuantity(item._id, item.selectedSize, 1)}>+</motion.button>
                </div>
                <div style={styles.itemSubtotal}>₹{(item.price * item.quantity).toFixed(2)}</div>
                <motion.button whileHover={{ scale: 1.1, color: '#ef4444' }} whileTap={{ scale: 0.9 }} style={styles.removeBtn} onClick={() => removeItem(item._id, item.selectedSize)}>✕</motion.button>
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
                <div style={{ ...styles.summaryRow, fontWeight: 700, fontSize: '18px', color: 'var(--text-primary)', marginBottom: '16px' }}>
                  <span>Total</span>
                  <span>₹{Number(total.finalTotal || 0).toFixed(2)}</span>
                </div>
                
                {/* Shipping Address */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={styles.sectionLabel}>Shipping Address</label>
                  <textarea
                    style={styles.textarea}
                    placeholder="Enter full delivery address..."
                    rows={2}
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                  />
                </div>

                {/* Payment Method Selector */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={styles.sectionLabel}>Payment Method</label>
                  <div style={styles.paymentOptions}>
                    <label style={{
                      ...styles.paymentOption,
                      borderColor: paymentMethod === 'COD' ? 'var(--primary)' : 'var(--border)',
                      background: paymentMethod === 'COD' ? 'rgba(99, 102, 241, 0.04)' : 'transparent',
                    }}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="COD"
                        checked={paymentMethod === 'COD'}
                        onChange={() => setPaymentMethod('COD')}
                        style={styles.radioInput}
                      />
                      <div style={styles.paymentInfo}>
                        <span style={styles.paymentName}>💵 Cash on Delivery</span>
                        <span style={styles.paymentDesc}>Pay with cash when package arrives</span>
                      </div>
                    </label>
                    <label style={{
                      ...styles.paymentOption,
                      borderColor: paymentMethod === 'Online' ? 'var(--primary)' : 'var(--border)',
                      background: paymentMethod === 'Online' ? 'rgba(99, 102, 241, 0.04)' : 'transparent',
                    }}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="Online"
                        checked={paymentMethod === 'Online'}
                        onChange={() => setPaymentMethod('Online')}
                        style={styles.radioInput}
                      />
                      <div style={styles.paymentInfo}>
                        <span style={styles.paymentName}>💳 Pay Online</span>
                        <span style={styles.paymentDesc}>Fast & secure via Card, UPI, NetBanking</span>
                      </div>
                    </label>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={styles.checkoutBtn}
                  onClick={handleCheckout}
                  disabled={checkingOut || loading}
                >
                  {checkingOut ? 'Processing...' : 'Order Now'}
                </motion.button>
              </>
            ) : !loading ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
                  Unable to calculate total. Please refresh the page.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={styles.checkoutBtn}
                  onClick={() => window.location.reload()}
                >
                  Refresh
                </motion.button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}

const styles = {
  container: { maxWidth: '1100px', margin: '0 auto', padding: '40px 20px', animation: 'fadeIn 0.5s ease-out' },
  title: { fontSize: '28px', fontWeight: 800, marginBottom: '24px', color: 'var(--text-primary)', letterSpacing: '-0.02em' },
  error: {
    background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444',
    padding: '14px 18px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px', fontWeight: 500,
  },
  layout: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px', alignItems: 'start' },
  itemsList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  cartItem: {
    display: 'flex', alignItems: 'center', gap: '20px', background: 'var(--card-bg)',
    border: '1px solid var(--border)', borderRadius: '14px', padding: '20px',
    boxShadow: 'var(--shadow-md)', transition: 'all 0.2s',
  },
  itemImage: {
    width: '70px', height: '70px', borderRadius: '10px',
    objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)',
  },
  itemImageFallback: {
    width: '70px', height: '70px', background: 'var(--bg-primary)', borderRadius: '10px',
    display: 'none', alignItems: 'center', justifyContent: 'center',
    fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', flexShrink: 0,
    border: '1px solid var(--border)',
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: '16px', fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)', lineHeight: 1.4 },
  itemPrice: { fontSize: '14px', color: 'var(--text-secondary)', margin: 0, fontWeight: 500 },
  qtyControls: { display: 'flex', alignItems: 'center', gap: '12px' },
  qtyBtn: {
    width: '32px', height: '32px', border: '1px solid var(--border)', background: 'var(--bg-primary)',
    color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 600,
    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
  },
  qtyValue: { fontSize: '15px', fontWeight: 700, minWidth: '24px', textAlign: 'center', color: 'var(--text-primary)' },
  itemSubtotal: { fontSize: '16px', fontWeight: 800, minWidth: '90px', textAlign: 'right', color: 'var(--text-primary)' },
  removeBtn: {
    border: 'none', background: 'none', color: 'var(--text-muted)', fontSize: '18px',
    cursor: 'pointer', padding: '6px', transition: 'color 0.2s',
  },
  summary: {
    background: 'var(--bg-secondary)', borderRadius: '16px', padding: '28px',
    border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)',
    position: 'sticky', top: '90px',
  },
  summaryTitle: { fontSize: '18px', fontWeight: 800, marginBottom: '20px', color: 'var(--text-primary)' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '12px', color: 'var(--text-secondary)', fontWeight: 500 },
  summaryDivider: { borderTop: '1px solid var(--border)', margin: '16px 0' },
  checkoutBtn: {
    width: '100%', padding: '14px',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
    color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 700,
    cursor: 'pointer', marginTop: '20px', boxShadow: 'var(--shadow-md)', transition: 'all 0.2s',
  },
  sectionLabel: {
    fontSize: '11px',
    fontWeight: 800,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    marginBottom: '8px',
    display: 'block',
  },
  textarea: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    fontSize: '13px',
    fontFamily: 'var(--sans)',
    outline: 'none',
    background: 'var(--card-bg)',
    color: 'var(--text-primary)',
    resize: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  paymentOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '6px',
  },
  paymentOption: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px 14px',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  radioInput: {
    marginTop: '4px',
    accentColor: 'var(--primary)',
    width: '16px',
    height: '16px',
    cursor: 'pointer',
    marginRight: 0,
    boxShadow: 'none',
    border: 'none',
    padding: 0,
  },
  paymentInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  paymentName: {
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  paymentDesc: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
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

export default Cart;