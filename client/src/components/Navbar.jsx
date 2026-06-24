import React from 'react';
import { Package, ShoppingCart, Heart, ClipboardList, User, Zap, Search } from 'lucide-react';

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
  const navItems = [
    { id: 'products', label: 'Products', icon: Package },
    { id: 'search',   label: 'Search',   icon: Search },
    { id: 'cart',     label: 'Cart',     icon: ShoppingCart, count: cartItemCount, badgeClass: '' },
    { id: 'wishlist', label: 'Wishlist', icon: Heart,        count: wishlistCount, badgeClass: 'nav-badge-rose' },
    { id: 'orders',   label: 'Orders',   icon: ClipboardList, count: pendingOrdersCount, badgeClass: 'nav-badge-amber' },
  ];

  return (
    <header className="navbar">
      <div className="navbar-inner">

        {/* ── Logo ── */}
        <div className="navbar-logo" onClick={() => setActiveTab('products')}>
          <div className="navbar-logo-icon">
            <Zap size={20} color="#1a1c2e" />
          </div>
          <span className="navbar-logo-text">
            Shop<span>AI</span>
          </span>
        </div>

        {/* ── Nav Links ── */}
        <nav className="navbar-nav">
          {navItems.map(({ id, label, icon: Icon, count, badgeClass }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`nav-link${activeTab === id ? ' active' : ''}`}
            >
              <Icon size={15} />
              {label}
              {count > 0 && (
                <span className={`nav-badge ${badgeClass || ''}`}>{count}</span>
              )}
            </button>
          ))}
        </nav>

        {/* ── User Switcher ── */}
        <div className="user-switcher">
          <User size={14} color="rgba(255,255,255,0.7)" />
          <select
            value={currentUser.id}
            onChange={(e) => {
              const u = users.find(user => user.id === e.target.value);
              onUserChange(u);
            }}
          >
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

      </div>
    </header>
  );
}
