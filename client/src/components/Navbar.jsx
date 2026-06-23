import React from 'react';
import { Package, ShoppingBag, Heart, ClipboardList, User, Sparkles } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  cartItemCount,
  wishlistCount,
  pendingOrdersCount,
  currentUser,
  setCurrentUser,
  users,
  onUserChange
}) {
  return (
    <header className="glass-panel sticky top-0 z-40 border-b border-white/5 rounded-none backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        {/* Logo */}
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

        {/* Navigation Tabs */}
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

        {/* User Switcher Context */}
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
          <User className="w-4 h-4 text-cyan-400" />
          <select 
            value={currentUser.id} 
            onChange={(e) => {
              const u = users.find(user => user.id === e.target.value);
              onUserChange(u);
            }}
            className="bg-transparent text-xs text-white focus:outline-none border-none font-semibold cursor-pointer"
          >
            {users.map(u => (
              <option key={u.id} value={u.id} className="bg-[#0f0e21] text-white">
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
