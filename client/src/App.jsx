import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Heart, 
  ListFilter, 
  ClipboardList, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag as CartIcon, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  User, 
  Sparkles,
  ArrowRight,
  Database,
  Search,
  Package,
  Calendar,
  DollarSign
} from 'lucide-react';
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

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
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
      // Ensure we format the response correctly
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
      // 1. Add to cart
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

      // 2. Remove from wishlist
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
        // Fire confetti!
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

  // Helper to trigger database seeding
  const handleSeedDatabase = async () => {
    setProcessingAction(true);
    try {
      // In seed.js it connects to DB directly. Let's see if we can trigger it or if we should add a seed endpoint.
      // Wait, let's create a seed endpoint in the backend for easy seeding, or seed manually.
      // Let's check if the backend has products. If they are empty, let's just make a POST call to /api/products
      // with standard mockup data since we have a POST /api/products endpoint in products.js!
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

  const categories = ['All', ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col">
      {/* Toast Notification Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`pointer-events-auto p-4 rounded-xl shadow-xl flex items-center justify-between border backdrop-blur-md animate-fade-in ${
              toast.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300' :
              toast.type === 'error' ? 'bg-rose-950/80 border-rose-500/30 text-rose-300' :
              toast.type === 'info' ? 'bg-cyan-950/80 border-cyan-500/30 text-cyan-300' :
              'bg-amber-950/80 border-amber-500/30 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-current pulse-slow" />
              <p className="text-sm font-semibold">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Header / Navigation */}
      <header className="glass-panel sticky top-0 z-40 border-b border-white/5 rounded-none backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('products')}>
            <div className="p-2.5 bg-gradient-to-tr from-violet-600 to-cyan-400 rounded-xl shadow-lg flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #8a2be2 0%, #00f2fe 100%)' }}>
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white font-display">
                NEBULA<span className="text-cyan-400" style={{ color: '#00f2fe' }}>MARKET</span>
              </h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Engine UI v3.0</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button 
              onClick={() => setActiveTab('products')} 
              className={`btn ${activeTab === 'products' ? 'btn-primary' : 'btn-outline'} text-xs sm:text-sm py-2 px-4`}
            >
              <Package className="w-4 h-4" />
              Products
            </button>

            <button 
              onClick={() => setActiveTab('cart')} 
              className={`btn ${activeTab === 'cart' ? 'btn-primary' : 'btn-outline'} text-xs sm:text-sm py-2 px-4`}
            >
              <ShoppingBag className="w-4 h-4" />
              Cart
              {cartItemCount > 0 && (
                <span className="badge badge-secondary ml-1">{cartItemCount}</span>
              )}
            </button>

            <button 
              onClick={() => setActiveTab('wishlist')} 
              className={`btn ${activeTab === 'wishlist' ? 'btn-primary' : 'btn-outline'} text-xs sm:text-sm py-2 px-4`}
            >
              <Heart className="w-4 h-4" />
              Wishlist
              {wishlistCount > 0 && (
                <span className="badge badge-primary ml-1" style={{ backgroundColor: '#ff007f' }}>{wishlistCount}</span>
              )}
            </button>

            <button 
              onClick={() => setActiveTab('orders')} 
              className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-outline'} text-xs sm:text-sm py-2 px-4`}
            >
              <ClipboardList className="w-4 h-4" />
              Orders
              {pendingOrdersCount > 0 && (
                <span className="badge badge-warning ml-1">{pendingOrdersCount}</span>
              )}
            </button>
          </nav>

          {/* Active User Switcher */}
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
            <User className="w-4 h-4 text-cyan-400" />
            <select 
              value={currentUser.id} 
              onChange={(e) => {
                const u = USERS.find(user => user.id === e.target.value);
                setCurrentUser(u);
                showToast(`Switched user context to ${u.name}`);
              }}
              className="bg-transparent text-xs text-white focus:outline-none border-none font-semibold cursor-pointer"
            >
              {USERS.map(u => (
                <option key={u.id} value={u.id} className="bg-[#0f0e21] text-white">
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 page-container w-full max-w-7xl px-6 py-8">
        
        {/* PRODUCTS VIEW */}
        {activeTab === 'products' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-3xl font-extrabold text-white tracking-tight font-display">Explore Tech Collection</h2>
                <p className="text-gray-400 text-sm mt-1">High-performance items powered by vector-based semantic recommendations.</p>
              </div>

              {/* Search & Seeding Helpers */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search product details..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field pl-10 py-2.5 text-sm"
                  />
                </div>
                
                <button 
                  onClick={handleSeedDatabase}
                  disabled={processingAction}
                  className="btn btn-outline py-2.5 px-4 text-xs font-semibold"
                  title="Adds 10 premium sample products to MongoDB"
                >
                  <Database className="w-4 h-4 text-cyan-400" />
                  Seed Products
                </button>
              </div>
            </div>

            {/* Category Filter Buttons */}
            <div className="flex flex-wrap gap-2 pb-2 border-b border-white/5">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`btn py-1.5 px-4 text-xs rounded-full border ${
                    selectedCategory === cat 
                      ? 'btn-primary border-violet-500/30' 
                      : 'btn-outline border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Loading Indicator */}
            {loadingProducts ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                <p className="text-gray-400 text-sm">Querying database models...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="glass-panel text-center p-16 space-y-4">
                <Package className="w-16 h-16 text-gray-600 mx-auto" />
                <h3 className="text-xl font-bold text-white font-display">No Products in Database</h3>
                <p className="text-gray-400 text-sm max-w-md mx-auto">
                  Click the "Seed Products" button in the top right to populate MongoDB with a curated high-performance catalog.
                </p>
                <button onClick={handleSeedDatabase} className="btn btn-primary mt-2">
                  <Database className="w-4 h-4" />
                  Seed 10 Sample Products
                </button>
              </div>
            ) : (
              <div className="grid-products">
                {filteredProducts.map(product => {
                  const isInWishlist = wishlist.products?.some(p => p._id === product._id);
                  const isInCart = cart.items?.some(i => i.product?._id === product._id);
                  return (
                    <div 
                      key={product._id} 
                      className="glass-panel p-5 flex flex-col justify-between hover:scale-[1.02] active:scale-[0.99] border-white/5 group relative overflow-hidden"
                    >
                      {/* Glow design effects */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/10 rounded-full blur-2xl group-hover:bg-violet-600/20 transition-all duration-300 pointer-events-none" />
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest px-2.5 py-1 rounded-md bg-cyan-950/40 border border-cyan-800/30">
                            {product.category}
                          </span>
                          
                          <button
                            onClick={() => handleToggleWishlist(product._id)}
                            disabled={processingAction}
                            className={`p-2 rounded-full border transition-all ${
                              isInWishlist 
                                ? 'bg-rose-950/50 border-rose-500/30 text-rose-500' 
                                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <Heart className="w-4.5 h-4.5 fill-current" />
                          </button>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                            {product.name}
                          </h3>
                          <p className="text-gray-400 text-xs mt-1.5 line-clamp-2 h-8 leading-relaxed">
                            {product.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Unit Price</p>
                          <p className="text-xl font-black text-white font-display">${product.price.toFixed(2)}</p>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Stock status</p>
                          {product.stock > 0 ? (
                            <span className={`text-xs font-bold ${product.stock < 15 ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {product.stock} units
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-rose-500">Out of Stock</span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4">
                        <button
                          onClick={() => handleAddToCart(product._id, 1)}
                          disabled={product.stock === 0 || processingAction}
                          className={`btn w-full text-xs font-bold ${
                            product.stock === 0
                              ? 'btn-outline border-white/5 text-gray-500 cursor-not-allowed'
                              : isInCart
                              ? 'btn-secondary text-[#080711]'
                              : 'btn-primary'
                          }`}
                        >
                          <ShoppingBag className="w-4 h-4" />
                          {product.stock === 0 ? 'Out of stock' : isInCart ? 'Add More to Cart' : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CART VIEW */}
        {activeTab === 'cart' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight font-display">Your Virtual Cart</h2>
              <p className="text-gray-400 text-sm mt-1">Review items, adjust quantities, and lock in current unit prices.</p>
            </div>

            {loadingCart ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                <p className="text-gray-400 text-sm">Syncing shopping basket...</p>
              </div>
            ) : !cart.items || cart.items.length === 0 ? (
              <div className="glass-panel text-center p-16 space-y-4">
                <CartIcon className="w-16 h-16 text-gray-600 mx-auto animate-bounce" />
                <h3 className="text-xl font-bold text-white font-display">Your Cart is Empty</h3>
                <p className="text-gray-400 text-sm max-w-sm mx-auto">
                  Browse our technology listing and click "Add to Cart" to start building your configuration.
                </p>
                <button onClick={() => setActiveTab('products')} className="btn btn-primary mt-2">
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items List */}
                <div className="lg:col-span-2 space-y-4">
                  {cart.items.map(item => {
                    const product = item.product || {};
                    const priceDiff = product.price !== undefined && product.price !== item.priceAtAdd;
                    return (
                      <div 
                        key={item._id} 
                        className="glass-panel p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-white/5"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-violet-400">
                            <Package className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-white line-clamp-1">{product.name || 'Unknown Product'}</h3>
                            <p className="text-xs text-gray-400 capitalize mt-0.5">{product.category || 'N/A'}</p>
                            
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              <span className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-300">
                                Unit: ${item.priceAtAdd.toFixed(2)}
                              </span>
                              {priceDiff && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-amber-950/80 border border-amber-500/30 text-amber-300 rounded font-semibold" title={`Catalog price is currently $${product.price}`}>
                                  Price locked (Saved)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quantity & Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 border-white/5">
                          <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-1">
                            <button
                              onClick={() => handleUpdateCartQuantity(product._id, item.quantity - 1)}
                              disabled={processingAction}
                              className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-3.5 text-sm font-black text-white">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateCartQuantity(product._id, item.quantity + 1)}
                              disabled={processingAction}
                              className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="text-right">
                            <p className="text-xs text-gray-500 font-semibold uppercase">Total</p>
                            <p className="text-base font-black text-white">${(item.priceAtAdd * item.quantity).toFixed(2)}</p>
                          </div>

                          <button
                            onClick={() => handleRemoveFromCart(product._id)}
                            disabled={processingAction}
                            className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-500/10 hover:border-rose-500/40 text-rose-400 hover:bg-rose-950/50 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Cart Summary */}
                <div className="space-y-6">
                  <div className="glass-panel p-6 border-white/5 space-y-6">
                    <h3 className="text-lg font-bold text-white border-b border-white/5 pb-3 font-display">Order Summary</h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Subtotal ({cartItemCount} items)</span>
                        <span className="font-semibold text-white">${cart.total?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Shipping</span>
                        <span className="text-emerald-400 font-semibold">Free Delivery</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Sales Tax (GST)</span>
                        <span className="font-semibold text-white">$0.00</span>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-4 flex justify-between items-end">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Amount</p>
                        <p className="text-2xl font-black text-cyan-400 font-display">${cart.total?.toFixed(2)}</p>
                      </div>
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/50 px-2 py-1 rounded border border-emerald-500/20 font-bold uppercase">
                        Active Promo
                      </span>
                    </div>

                    <button
                      onClick={() => setActiveTab('checkout')}
                      className="btn btn-primary w-full py-3"
                    >
                      Secure Checkout
                      <ArrowRight className="w-4 h-4 animate-pulse" />
                    </button>
                  </div>

                  <div className="glass-panel p-4 border-white/5 bg-gradient-to-br from-cyan-950/20 to-violet-950/10 flex gap-3 text-xs text-gray-400">
                    <CheckCircle className="w-5 h-5 text-cyan-400 shrink-0" />
                    <div>
                      <p className="font-bold text-white">Stock Allocation Locked</p>
                      <p className="mt-0.5">Proceed to check out soon. Stock quantity is reserved on a first-come, first-served basis during checkout.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* WISHLIST VIEW */}
        {activeTab === 'wishlist' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight font-display">Saved Wishlist</h2>
              <p className="text-gray-400 text-sm mt-1">Keep track of items you like. Transfer them directly to your active shopping cart.</p>
            </div>

            {loadingWishlist ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                <p className="text-gray-400 text-sm">Querying wishlist model...</p>
              </div>
            ) : !wishlist.products || wishlist.products.length === 0 ? (
              <div className="glass-panel text-center p-16 space-y-4">
                <Heart className="w-16 h-16 text-gray-600 mx-auto" />
                <h3 className="text-xl font-bold text-white font-display">Your Wishlist is Empty</h3>
                <p className="text-gray-400 text-sm max-w-sm mx-auto">
                  Click the heart icon on product cards while browsing the store to save items here for later.
                </p>
                <button onClick={() => setActiveTab('products')} className="btn btn-primary mt-2">
                  Browse Products
                </button>
              </div>
            ) : (
              <div className="grid-products">
                {wishlist.products.map(product => (
                  <div 
                    key={product._id} 
                    className="glass-panel p-5 flex flex-col justify-between border-white/5 hover:scale-[1.02] transition-transform"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest px-2.5 py-1 rounded-md bg-cyan-950/40 border border-cyan-800/30">
                          {product.category}
                        </span>
                        
                        <button
                          onClick={() => handleToggleWishlist(product._id)}
                          disabled={processingAction}
                          className="p-2 rounded-full bg-rose-950/30 border border-rose-500/20 text-rose-400 hover:bg-rose-950/60 hover:border-rose-500/50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-white">{product.name}</h3>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2 h-8 leading-relaxed">
                          {product.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Price</p>
                        <p className="text-lg font-black text-white">${product.price?.toFixed(2)}</p>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Stock status</p>
                        {product.stock > 0 ? (
                          <span className="text-xs font-semibold text-emerald-400">Available</span>
                        ) : (
                          <span className="text-xs font-semibold text-rose-500">Out of Stock</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => handleMoveToCart(product._id)}
                        disabled={product.stock === 0 || processingAction}
                        className="btn btn-primary flex-1 text-xs font-bold"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Move to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CHECKOUT VIEW */}
        {activeTab === 'checkout' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight font-display">Secure Checkout</h2>
              <p className="text-gray-400 text-sm mt-1">Submit your delivery details to deploy and verify your order.</p>
            </div>

            {cart.items.length === 0 ? (
              <div className="glass-panel text-center p-16 space-y-4">
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
                <h3 className="text-xl font-bold text-white font-display">Ready for Next Transaction</h3>
                <p className="text-gray-400 text-sm">You do not have any items in your checkout session. Return to products catalog.</p>
                <button onClick={() => setActiveTab('products')} className="btn btn-primary mt-2">
                  Go to Products
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Delivery Form */}
                <form onSubmit={handlePlaceOrder} className="lg:col-span-2 glass-panel p-6 border-white/5 space-y-6">
                  <h3 className="text-lg font-bold text-white border-b border-white/5 pb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-cyan-400" />
                    Shipping Details
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="label">Street Address</label>
                      <input 
                        type="text" 
                        required
                        value={address.street}
                        onChange={(e) => setAddress({...address, street: e.target.value})}
                        className="input-field" 
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="label">City</label>
                        <input 
                          type="text" 
                          required
                          value={address.city}
                          onChange={(e) => setAddress({...address, city: e.target.value})}
                          className="input-field" 
                        />
                      </div>
                      <div>
                        <label className="label">State</label>
                        <input 
                          type="text" 
                          required
                          value={address.state}
                          onChange={(e) => setAddress({...address, state: e.target.value})}
                          className="input-field" 
                        />
                      </div>
                      <div>
                        <label className="label">Pincode</label>
                        <input 
                          type="text" 
                          required
                          value={address.pincode}
                          onChange={(e) => setAddress({...address, pincode: e.target.value})}
                          className="input-field" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-6 space-y-4">
                    <h4 className="text-sm font-semibold text-white">Payment Method Simulator</h4>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 rounded-full border-4 border-cyan-400" />
                        <div>
                          <p className="text-sm font-bold text-white">Direct Engine Checkout (Sandbox)</p>
                          <p className="text-[10px] text-gray-400">Order executes immediately, updating inventories automatically.</p>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30 font-bold uppercase">
                        Mock Mode
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab('cart')}
                      className="btn btn-outline flex-1 py-3"
                    >
                      Back to Cart
                    </button>
                    <button
                      type="submit"
                      disabled={processingAction}
                      className="btn btn-primary flex-1 py-3"
                    >
                      {processingAction ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing Transaction...
                        </>
                      ) : (
                        <>
                          Place Order (${cart.total?.toFixed(2)})
                          <CheckCircle className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Checkout Order Review Panel */}
                <div className="glass-panel p-6 border-white/5 h-fit space-y-6">
                  <h3 className="text-lg font-bold text-white border-b border-white/5 pb-3 font-display">Review Order</h3>
                  
                  <div className="space-y-3 divide-y divide-white/5 max-h-72 overflow-y-auto pr-1">
                    {cart.items.map(item => (
                      <div key={item._id} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold text-white line-clamp-1">{item.product?.name}</p>
                          <p className="text-[10px] text-gray-400">Qty: {item.quantity} × ${item.priceAtAdd.toFixed(2)}</p>
                        </div>
                        <span className="text-sm font-semibold text-white">${(item.priceAtAdd * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-white/5 pt-4 space-y-2">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Subtotal</span>
                      <span>${cart.total?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Shipping</span>
                      <span className="text-emerald-400">Free</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-white pt-2">
                      <span>Total Amount</span>
                      <span className="text-cyan-400">${cart.total?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ORDERS VIEW */}
        {activeTab === 'orders' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight font-display">Order History</h2>
              <p className="text-gray-400 text-sm mt-1">Track transactional status, view past line items, and cancel pending requests.</p>
            </div>

            {loadingOrders ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                <p className="text-gray-400 text-sm">Fetching client transaction ledger...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="glass-panel text-center p-16 space-y-4">
                <ClipboardList className="w-16 h-16 text-gray-600 mx-auto" />
                <h3 className="text-xl font-bold text-white font-display">No Orders Found</h3>
                <p className="text-gray-400 text-sm max-w-sm mx-auto">
                  You have not placed any orders yet using this mock user account. Add some items to your cart and check out!
                </p>
                <button onClick={() => setActiveTab('products')} className="btn btn-primary mt-2">
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map(order => {
                  const dateFormatted = new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  });
                  return (
                    <div 
                      key={order._id} 
                      className="glass-panel border-white/5 overflow-hidden"
                    >
                      {/* Order Header info block */}
                      <div className="bg-white/5 px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-white/5">
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Order ID</p>
                            <p className="text-xs font-mono font-bold text-cyan-400">{order._id}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Date Placed</p>
                            <p className="text-xs text-white flex items-center gap-1 font-semibold">
                              <Calendar className="w-3.5 h-3.5 text-violet-400" />
                              {dateFormatted}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Total Amount</p>
                            <p className="text-sm font-bold text-white font-display">${order.totalAmount.toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Order Status Badges */}
                          {order.status === 'pending' && <span className="badge badge-warning">Pending Approval</span>}
                          {order.status === 'confirmed' && <span className="badge badge-primary">Confirmed</span>}
                          {order.status === 'shipped' && <span className="badge badge-info">Shipped</span>}
                          {order.status === 'delivered' && <span className="badge badge-success">Delivered ✔</span>}
                          {order.status === 'cancelled' && <span className="badge badge-danger">Cancelled</span>}

                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleCancelOrder(order._id)}
                              disabled={processingAction}
                              className="btn btn-outline py-1 px-3 text-xs border-rose-500/20 text-rose-400 hover:bg-rose-950/30 hover:border-rose-500/60 font-semibold"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Cancel Order
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Order items and shipping info */}
                      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-3">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order Line Items</h4>
                          
                          <div className="space-y-3 divide-y divide-white/5">
                            {order.items?.map((item, idx) => (
                              <div key={item._id || idx} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-white/5 border border-white/10 rounded-lg text-violet-400">
                                    <Package className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-white">{item.product?.name || 'Archived Product'}</p>
                                    <p className="text-[10px] text-gray-500">Qty: {item.quantity} × ${item.priceAtOrder.toFixed(2)}</p>
                                  </div>
                                </div>
                                <span className="text-sm font-bold text-white">${(item.priceAtOrder * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Shipping Address breakdown */}
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-2 h-fit">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                            Delivery Address
                          </h4>
                          <div className="text-xs text-gray-300 space-y-1 mt-2">
                            <p>{order.shippingAddress?.street}</p>
                            <p>{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
                            <p className="font-mono mt-1 text-[10px] text-gray-500 font-semibold">ZIP: {order.shippingAddress?.pincode}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
