import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import AuthModal from './components/AuthModal';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import confetti from 'canvas-confetti';
import { apiFetch, getStoredUser, clearSession, saveSession } from './utils/api';

export default function App() {
  // ── Auth state ───────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState(getStoredUser);  // restored from localStorage
  const [showAuthModal, setShowAuthModal]  = useState(false);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab]       = useState('products');
  const [products, setProducts]         = useState([]);
  const [cart, setCart]                 = useState({ items: [], total: 0 });
  const [wishlist, setWishlist]         = useState({ products: [] });
  const [orders, setOrders]             = useState([]);

  // Loading states
  const [loadingProducts, setLoadingProducts]   = useState(false);
  const [loadingCart, setLoadingCart]           = useState(false);
  const [loadingWishlist, setLoadingWishlist]   = useState(false);
  const [loadingOrders, setLoadingOrders]       = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  // Checkout Address Form
  const [address, setAddress] = useState({
    street: '123 Tech Park Ave',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560001'
  });

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // ── Auth callbacks ────────────────────────────────────────────────────────────

  const handleAuth = (user) => {
    setCurrentUser(user);
    setShowAuthModal(false);
    showToast(`Welcome, ${user.name}! 👋`);
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setCart({ items: [], total: 0 });
    setWishlist({ products: [] });
    setOrders([]);
    setActiveTab('products');
    showToast('Logged out successfully', 'info');
  };

  // Called by Profile page after a successful name/password update
  const handleUserUpdated = (updatedUser) => {
    setCurrentUser(updatedUser);
  };

  // ── Data fetching ─────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchCart();
      fetchWishlist();
      fetchOrders();
    } else {
      setCart({ items: [], total: 0 });
      setWishlist({ products: [] });
      setOrders([]);
    }
  }, [currentUser]);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res  = await apiFetch('/api/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.data || []);
      } else {
        showToast(data.message || 'Failed to fetch products', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to backend server', 'error');
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchCart = async () => {
    setLoadingCart(true);
    try {
      const res  = await apiFetch('/api/cart');
      const data = await res.json();
      setCart(data || { items: [], total: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCart(false);
    }
  };

  const fetchWishlist = async () => {
    setLoadingWishlist(true);
    try {
      const res  = await apiFetch('/api/wishlist');
      const data = await res.json();
      setWishlist(data || { products: [] });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWishlist(false);
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      // Use /api/orders/history/<userId> — the JWT on server verifies ownership
      const res  = await apiFetch(`/api/orders/history/${currentUser._id || currentUser.id}`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // ── Cart actions ──────────────────────────────────────────────────────────────

  const requireAuth = (action) => {
    if (!currentUser) {
      setShowAuthModal(true);
      showToast('Please sign in to continue', 'info');
      return false;
    }
    return true;
  };

  const handleAddToCart = async (productId, quantity = 1) => {
    if (!requireAuth()) return;
    setProcessingAction(true);
    try {
      const res  = await apiFetch('/api/cart/add', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Added to Cart successfully!');
        fetchCart();
      } else {
        showToast(data.error || 'Failed to add item to cart', 'error');
      }
    } catch (err) {
      showToast('API Connection Error', 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleUpdateCartQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveFromCart(productId);
      return;
    }
    if (!requireAuth()) return;
    setProcessingAction(true);
    try {
      const res  = await apiFetch('/api/cart/update', {
        method: 'PUT',
        body: JSON.stringify({ productId, quantity: newQuantity }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Cart quantity updated');
        fetchCart();
      } else {
        showToast(data.error || 'Failed to update quantity', 'error');
      }
    } catch (err) {
      showToast('API Connection Error', 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRemoveFromCart = async (productId) => {
    if (!requireAuth()) return;
    setProcessingAction(true);
    try {
      const res  = await apiFetch('/api/cart/remove', {
        method: 'DELETE',
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Removed from Cart', 'info');
        fetchCart();
      } else {
        showToast(data.error || 'Failed to remove item', 'error');
      }
    } catch (err) {
      showToast('API Connection Error', 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  // ── Wishlist actions ──────────────────────────────────────────────────────────

  const handleToggleWishlist = async (productId) => {
    if (!requireAuth()) return;
    setProcessingAction(true);
    const isWishlisted = wishlist.products?.some(p => p._id === productId || p === productId);
    const endpoint = isWishlisted ? '/api/wishlist/remove' : '/api/wishlist/add';
    const method   = isWishlisted ? 'DELETE' : 'POST';

    try {
      const res  = await apiFetch(endpoint, {
        method,
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(isWishlisted ? 'Removed from Wishlist' : 'Added to Wishlist!');
        fetchWishlist();
      } else {
        showToast(data.error || 'Wishlist operation failed', 'error');
      }
    } catch (err) {
      showToast('API Connection Error', 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleMoveToCart = async (productId) => {
    if (!requireAuth()) return;
    setProcessingAction(true);
    try {
      const cartRes = await apiFetch('/api/cart/add', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      const cartData = await cartRes.json();
      if (!cartRes.ok) {
        showToast(cartData.error || 'Failed to add item to cart', 'error');
        setProcessingAction(false);
        return;
      }

      const wishRes = await apiFetch('/api/wishlist/remove', {
        method: 'DELETE',
        body: JSON.stringify({ productId }),
      });

      if (wishRes.ok) {
        showToast('Moved item to Cart!');
        fetchCart();
        fetchWishlist();
      } else {
        showToast('Added to Cart, but failed to remove from Wishlist', 'warning');
        fetchCart();
      }
    } catch (err) {
      showToast('API Connection Error', 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  // ── Order actions ─────────────────────────────────────────────────────────────

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!requireAuth()) return;
    if (cart.items.length === 0) {
      showToast('Cart is empty', 'error');
      return;
    }
    setProcessingAction(true);
    try {
      const res  = await apiFetch('/api/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({ shippingAddress: address }),
      });
      const data = await res.json();
      if (res.ok) {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        showToast('Order Placed Successfully! 🚀', 'success');
        fetchCart();
        fetchOrders();
        fetchProducts();
        setActiveTab('orders');
      } else {
        showToast(data.error || 'Failed to place order', 'error');
      }
    } catch (err) {
      showToast('API Connection Error', 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!requireAuth()) return;
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setProcessingAction(true);
    try {
      const res  = await apiFetch(`/api/orders/${orderId}/cancel`, { method: 'PUT' });
      const data = await res.json();
      if (res.ok) {
        showToast('Order cancelled and stock restored', 'info');
        fetchOrders();
        fetchProducts();
      } else {
        showToast(data.error || 'Failed to cancel order', 'error');
      }
    } catch (err) {
      showToast('API Connection Error', 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  // ── Admin: seed database ──────────────────────────────────────────────────────

  const handleSeedDatabase = async () => {
    setProcessingAction(true);
    try {
      const mockItems = [
        { name: 'Nebula Pro VR Headset',          price: 599.99, category: 'Electronics',   description: 'Immersive spatial computing headset with 8K micro-OLED displays.',              stock: 15  },
        { name: 'Quantum Core Mechanical Keyboard', price: 189.50, category: 'Electronics', description: 'Hot-swappable optical switches with programmable RGB and smart dial.',           stock: 35  },
        { name: 'Chrono-Shift Smart Watch',         price: 299.00, category: 'Electronics', description: 'Titanium chassis smart watch with health telemetry and solar charging.',         stock: 24  },
        { name: 'Cyberpunk Leather Bomber Jacket',  price: 145.00, category: 'Clothing',    description: 'Waterproof techwear bomber jacket with fiber optic accents.',                    stock: 50  },
        { name: 'Aerolite Ergonomic Backpack',      price: 95.00,  category: 'Clothing',    description: 'Anti-theft modular backpack with integrated powerbank connector.',               stock: 80  },
        { name: 'Designing E-Commerce Engines',     price: 45.00,  category: 'Books',       description: 'A complete handbook on database architectures, caching, and APIs.',              stock: 120 },
        { name: 'Vector Search for AI Developers',  price: 38.99,  category: 'Books',       description: 'Learn how to implement high-speed semantic queries using Pinecone and Mongo.',   stock: 95  },
        { name: 'Vortex Floating Bonsai Tree',      price: 110.00, category: 'Home & Garden', description: 'Magnetic levitating plant pot that slowly spins in mid-air.',                 stock: 12  },
        { name: 'Smart Hydroponic Grow Kit',        price: 175.00, category: 'Home & Garden', description: 'App-controlled indoor garden with full spectrum LED grow lights.',             stock: 18  },
        { name: 'Hyper-Velocity Carbon Tennis Racket', price: 220.00, category: 'Sports',   description: 'Aerodynamic racket engineered with graphene micro-matrix layers.',              stock: 30  },
      ];

      for (const item of mockItems) {
        await apiFetch('/api/products', {
          method: 'POST',
          body: JSON.stringify(item),
        });
      }

      showToast('Database seeded with premium items!');
      fetchProducts();
    } catch (err) {
      showToast('Error seeding database', 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  // ── Derived counts ────────────────────────────────────────────────────────────

  const cartItemCount      = cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const wishlistCount      = wishlist.products?.length || 0;
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-body)' }}>
      {/* Toast Notification Container */}
      <Toast toasts={toasts} />

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onAuth={handleAuth}
        />
      )}

      {/* Main Header / Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartItemCount={cartItemCount}
        wishlistCount={wishlistCount}
        pendingOrdersCount={pendingOrdersCount}
        currentUser={currentUser}
        onLogin={() => setShowAuthModal(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Body */}
      <main className="page-container" style={{ flex: 1 }}>
        {activeTab === 'products' && (
          <Products
            products={products}
            loadingProducts={loadingProducts}
            wishlist={wishlist}
            cart={cart}
            processingAction={processingAction}
            handleSeedDatabase={handleSeedDatabase}
            handleAddToCart={handleAddToCart}
            handleToggleWishlist={handleToggleWishlist}
          />
        )}

        {activeTab === 'cart' && (
          <Cart
            cart={cart}
            loadingCart={loadingCart}
            processingAction={processingAction}
            cartItemCount={cartItemCount}
            handleUpdateCartQuantity={handleUpdateCartQuantity}
            handleRemoveFromCart={handleRemoveFromCart}
            onProceedToCheckout={() => setActiveTab('checkout')}
            onContinueShopping={() => setActiveTab('products')}
          />
        )}

        {activeTab === 'wishlist' && (
          <Wishlist
            wishlist={wishlist}
            loadingWishlist={loadingWishlist}
            processingAction={processingAction}
            handleToggleWishlist={handleToggleWishlist}
            handleMoveToCart={handleMoveToCart}
            onBrowseProducts={() => setActiveTab('products')}
          />
        )}

        {activeTab === 'checkout' && (
          <Checkout
            cart={cart}
            processingAction={processingAction}
            handlePlaceOrder={handlePlaceOrder}
            address={address}
            setAddress={setAddress}
            onBackToCart={() => setActiveTab('cart')}
            onGoToProducts={() => setActiveTab('products')}
          />
        )}

        {activeTab === 'orders' && (
          <Orders
            orders={orders}
            loadingOrders={loadingOrders}
            processingAction={processingAction}
            handleCancelOrder={handleCancelOrder}
            onStartShopping={() => setActiveTab('products')}
          />
        )}

        {activeTab === 'profile' && currentUser && (
          <Profile
            currentUser={currentUser}
            orders={orders}
            onUserUpdated={handleUserUpdated}
            showToast={showToast}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        background: 'var(--bg-navbar)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '20px 24px',
        marginTop: 'auto',
      }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.4)',
        }}>
          <p>© 2026 ShopAI Engine. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <span>Server: <span style={{ color: '#10b981', fontWeight: 600 }}>Active (Port 5000)</span></span>
            <span>Redis: <span style={{ color: '#10b981', fontWeight: 600 }}>Connected</span></span>
            <span>Auth: <span style={{ color: currentUser ? '#10b981' : '#f59e0b', fontWeight: 600 }}>{currentUser ? `JWT ✓ (${currentUser.role})` : 'Guest'}</span></span>
            <span>Dev: <span style={{ color: '#0ea5e9', fontWeight: 600 }}>@Sanker R Nath</span></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
