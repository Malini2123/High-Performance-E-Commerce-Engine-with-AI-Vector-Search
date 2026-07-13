import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../utils/images';

export default function CartDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);

  const loadCart = () => {
    try {
      setCartItems(JSON.parse(localStorage.getItem('cart') || '[]'));
    } catch {
      setCartItems([]);
    }
  };

  useEffect(() => {
    loadCart();
    window.addEventListener('cart-updated', loadCart);
    window.addEventListener('storage', loadCart);
    return () => {
      window.removeEventListener('cart-updated', loadCart);
      window.removeEventListener('storage', loadCart);
    };
  }, []);

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

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckoutClick = () => {
    onClose();
    navigate('/cart');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={styles.backdrop}
          />

          {/* Drawer Content */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            style={styles.drawer}
          >
            {/* Header */}
            <div style={styles.header}>
              <h2 style={styles.title}>Shopping Cart</h2>
              <button onClick={onClose} style={styles.closeBtn}>✕</button>
            </div>

            {/* Content */}
            <div style={styles.content}>
              {cartItems.length === 0 ? (
                <div style={styles.empty}>
                  <span style={{ fontSize: 48, marginBottom: 12, display: 'block' }}>🛒</span>
                  <p>Your cart is empty</p>
                </div>
              ) : (
                <div style={styles.itemList}>
                  {cartItems.map(item => (
                    <div key={`${item._id}-${item.selectedSize || ''}`} style={styles.item}>
                      <img
                        src={getImageUrl(item)}
                        alt={item.name}
                        style={styles.itemImg}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fallback = e.target.parentNode.querySelector('.drawer-fallback');
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div className="drawer-fallback" style={styles.itemImgFallback}>
                        {item.category?.substring(0, 3).toUpperCase() || 'ITM'}
                      </div>
                      <div style={styles.itemDetails}>
                        <div style={styles.itemName}>{item.name}</div>
                        {item.selectedSize && (
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 4px' }}>
                            Size: <strong>{item.selectedSize}</strong>
                          </div>
                        )}
                        <div style={styles.itemPrice}>₹{item.price}</div>
                        <div style={styles.controls}>
                          <button onClick={() => updateQuantity(item._id, item.selectedSize, -1)} style={styles.qtyBtn}>−</button>
                          <span style={styles.qtyVal}>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item._id, item.selectedSize, 1)} style={styles.qtyBtn}>+</button>
                        </div>
                      </div>
                      <div style={styles.itemRight}>
                        <div style={styles.itemTotal}>₹{(item.price * item.quantity).toFixed(2)}</div>
                        <button onClick={() => removeItem(item._id, item.selectedSize)} style={styles.removeBtn}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div style={styles.footer}>
                <div style={styles.subtotalRow}>
                  <span>Subtotal</span>
                  <span style={styles.subtotalVal}>₹{subtotal.toFixed(2)}</span>
                </div>
                <button onClick={handleCheckoutClick} style={styles.checkoutBtn}>
                  Order Now →
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
  },
  drawer: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: '420px',
    maxWidth: '100%',
    background: 'var(--card-bg)',
    borderLeft: '1px solid var(--border)',
    boxShadow: 'var(--shadow-xl)',
    zIndex: 1001,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: '20px 24px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '20px',
    fontWeight: 800,
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
  },
  empty: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
    fontSize: '15px',
  },
  itemList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  item: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    paddingBottom: '16px',
    borderBottom: '1px solid var(--border)',
  },
  itemImg: {
    width: '60px',
    height: '60px',
    borderRadius: '8px',
    objectFit: 'cover',
    border: '1px solid var(--border)',
  },
  itemImgFallback: {
    width: '60px',
    height: '60px',
    background: 'var(--bg-primary)',
    borderRadius: '8px',
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    color: 'var(--text-muted)',
    fontWeight: 700,
    flexShrink: 0,
    border: '1px solid var(--border)',
  },
  itemDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  itemName: {
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    lineHeight: 1.3,
  },
  itemPrice: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '4px',
  },
  qtyBtn: {
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    border: '1px solid var(--border)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 600,
  },
  qtyVal: {
    fontSize: '13px',
    fontWeight: 700,
    minWidth: '16px',
    textAlign: 'center',
  },
  itemRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '60px',
  },
  itemTotal: {
    fontSize: '14px',
    fontWeight: 800,
    color: 'var(--text-primary)',
  },
  removeBtn: {
    border: 'none',
    background: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '14px',
  },
  footer: {
    padding: '24px',
    borderTop: '1px solid var(--border)',
    background: 'var(--bg-secondary)',
  },
  subtotalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '15px',
    fontWeight: 600,
    marginBottom: '16px',
    color: 'var(--text-secondary)',
  },
  subtotalVal: {
    fontSize: '18px',
    fontWeight: 800,
    color: 'var(--text-primary)',
  },
  checkoutBtn: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: 'var(--shadow-md)',
  },
};
