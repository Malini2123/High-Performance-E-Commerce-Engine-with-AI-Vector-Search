import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import confetti from 'canvas-confetti';

const USERS = [
  { id: '60d5ecb8b39f1c2bd8e12f45', name: 'Sanker (Dev User)', email: 'sanker@nebula.io' },
  { id: '60d5ecb8b39f1c2bd8e12f46', name: 'Malini (Admin User)', email: 'malini@nebula.io' },
  { id: '60d5ecb8b39f1c2bd8e12f47', name: 'Achala (Beta Tester)', email: 'achala@nebula.io' }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(USERS[0]);
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [wishlist, setWishlist] = useState({ products: [] });
  const [orders, setOrders] = useState([]);
  
  // Loading states
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCart, setLoadingCart] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  // Checkout Address Form
  const [address, setAddress] = useState({
    street: '123 Tech Park Ave',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560001'
  });

  // Custom Toast State
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Fetch initial data
  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchCart(currentUser.id);
    fetchWishlist(currentUser.id);
    fetchOrders(currentUser.id);
  }, [currentUser]);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch('/api/products');
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

  const fetchCart = async (userId) => {
    setLoadingCart(true);
    try {
      const res = await fetch(`/api/cart/${userId}`);
      const data = await res.json();
      setCart(data || { items: [], total: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCart(false);
    }
  };

  const fetchWishlist = async (userId) => {
    setLoadingWishlist(true);
    try {
      const res = await fetch(`/api/wishlist/${userId}`);
      const data = await res.json();
      setWishlist(data || { products: [] });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWishlist(false);
    }
  };

  const fetchOrders = async (userId) => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`/api/orders/history/${userId}`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleAddToCart = async (productId, quantity = 1) => {
    setProcessingAction(true);
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, productId, quantity })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Added to Cart successfully!');
        fetchCart(currentUser.id);
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
    setProcessingAction(true);
    try {
      const res = await fetch('/api/cart/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, productId, quantity: newQuantity })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Cart quantity updated');
        fetchCart(currentUser.id);
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
    setProcessingAction(true);
    try {
      const res = await fetch('/api/cart/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, productId })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Removed from Cart', 'info');
        fetchCart(currentUser.id);
      } else {
        showToast(data.error || 'Failed to remove item', 'error');
      }
    } catch (err) {
      showToast('API Connection Error', 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleToggleWishlist = async (productId) => {
    setProcessingAction(true);
    const isWishlisted = wishlist.products?.some(p => p._id === productId || p === productId);
    const endpoint = isWishlisted ? '/api/wishlist/remove' : '/api/wishlist/add';
    const method = isWishlisted ? 'DELETE' : 'POST';
    
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, productId })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(isWishlisted ? 'Removed from Wishlist' : 'Added to Wishlist!');
        fetchWishlist(currentUser.id);
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
    setProcessingAction(true);
    try {
      const cartRes = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, productId, quantity: 1 })
      });
      const cartData = await cartRes.json();
      if (!cartRes.ok) {
        showToast(cartData.error || 'Failed to add item to cart', 'error');
        setProcessingAction(false);
        return;
      }

      const wishRes = await fetch('/api/wishlist/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, productId })
      });
      
      if (wishRes.ok) {
        showToast('Moved item to Cart!');
        fetchCart(currentUser.id);
        fetchWishlist(currentUser.id);
      } else {
        showToast('Added to Cart, but failed to remove from Wishlist', 'warning');
        fetchCart(currentUser.id);
      }
    } catch (err) {
      showToast('API Connection Error', 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.items.length === 0) {
      showToast('Cart is empty', 'error');
      return;
    }
    setProcessingAction(true);
    try {
      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: currentUser.id, 
          shippingAddress: address 
        })
      });
      const data = await res.json();
      if (res.ok) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
        showToast('Order Placed Successfully! 🚀', 'success');
        fetchCart(currentUser.id);
        fetchOrders(currentUser.id);
        fetchProducts(); // refresh product stocks
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
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setProcessingAction(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Order cancelled and stock restored', 'info');
        fetchOrders(currentUser.id);
        fetchProducts(); // refresh product stocks
      } else {
        showToast(data.error || 'Failed to cancel order', 'error');
      }
    } catch (err) {
      showToast('API Connection Error', 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleSeedDatabase = async () => {
    setProcessingAction(true);
    try {
      const mockItems = [
        { name: 'Nebula Pro VR Headset', price: 599.99, category: 'Electronics', description: 'Immersive spatial computing headset with 8K micro-OLED displays.', stock: 15 },
        { name: 'Quantum Core Mechanical Keyboard', price: 189.50, category: 'Electronics', description: 'Hot-swappable optical switches with programmable RGB and smart dial.', stock: 35 },
        { name: 'Chrono-Shift smart Watch', price: 299.00, category: 'Electronics', description: 'Titanium chassis smart watch with health telemetry and solar charging.', stock: 24 },
        { name: 'Cyberpunk Leather Bomber Jacket', price: 145.00, category: 'Clothing', description: 'Waterproof techwear bomber jacket with fiber optic accents.', stock: 50 },
        { name: 'Aerolite Ergonomic Backpack', price: 95.00, category: 'Clothing', description: 'Anti-theft modular backpack with integrated powerbank connector.', stock: 80 },
        { name: 'Designing E-Commerce Engines', price: 45.00, category: 'Books', description: 'A complete handbook on database architectures, caching, and APIs.', stock: 120 },
        { name: 'Vector Search for AI Developers', price: 38.99, category: 'Books', description: 'Learn how to implement high-speed semantic queries using Pinecone and Mongo.', stock: 95 },
        { name: 'Vortex Floating Bonsai Tree', price: 110.00, category: 'Home & Garden', description: 'Magnetic levitating plant pot that slowly spins in mid-air.', stock: 12 },
        { name: 'Smart Hydroponic Grow Kit', price: 175.00, category: 'Home & Garden', description: 'App-controlled indoor garden with full spectrum LED grow lights.', stock: 18 },
        { name: 'Hyper-Velocity Carbon Tennis Racket', price: 220.00, category: 'Sports', description: 'Aerodynamic racket engineered with graphene micro-matrix layers.', stock: 30 }
      ];

      for (const item of mockItems) {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
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

  // Calculations
  const cartItemCount = cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const wishlistCount = wishlist.products?.length || 0;
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Toast Notification Container */}
      <Toast toasts={toasts} />

      {/* Main Header / Navigation */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        cartItemCount={cartItemCount}
        wishlistCount={wishlistCount}
        pendingOrdersCount={pendingOrdersCount}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        users={USERS}
        onUserChange={(u) => {
          setCurrentUser(u);
          showToast(`Switched user context to ${u.name}`);
        }}
      />

      {/* Main Content Body */}
      <main className="flex-1 page-container w-full max-w-7xl px-6 py-8">
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
      </main>

      {/* Footer */}
      <footer className="glass-panel border-t border-white/5 rounded-none py-6 mt-12 bg-[#090818]/60">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© 2026 Nebula Market Engine Core. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Server Link: <span className="text-emerald-400 font-bold">Active (Port 5000)</span></span>
            <span>Redis Cache: <span className="text-emerald-400 font-bold">Connected</span></span>
            <span>Developer Context: <span className="text-cyan-400 font-bold">@Sanker R Nath</span></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
