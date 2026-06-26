import React from 'react';
import { Package, ShoppingCart, Heart, ClipboardList, Zap, Search, LogIn, LogOut, UserCircle } from 'lucide-react';

/**
 * Navbar
 *
 * Props:
 *   activeTab          string
 *   setActiveTab       (tab: string) => void
 *   cartItemCount      number
 *   wishlistCount      number
 *   pendingOrdersCount number
 *   currentUser        { name, email, role } | null
 *   onLogin            () => void
 *   onLogout           () => void
 */
export default function Navbar({
  activeTab,
  setActiveTab,
  cartItemCount,
  wishlistCount,
  pendingOrdersCount,
  currentUser,
  onLogin,
  onLogout,
}) {
  const navItems = [
    { id: 'products', label: 'Products', icon: Package },
    { id: 'search',   label: 'Search',   icon: Search },
    { id: 'cart',     label: 'Cart',     icon: ShoppingCart, count: cartItemCount,      badgeClass: '' },
    { id: 'wishlist', label: 'Wishlist', icon: Heart,        count: wishlistCount,      badgeClass: 'nav-badge-rose' },
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

        {/* ── Auth controls ── */}
        <div className="navbar-auth">
          {currentUser ? (
            <div className="navbar-user">
              <UserCircle size={16} color="rgba(255,255,255,0.7)" />
              <span className="navbar-username" title={currentUser.email}>
                {currentUser.name}
                {currentUser.role === 'admin' && (
                  <span className="navbar-role-badge">admin</span>
                )}
              </span>
              <button className="navbar-auth-btn navbar-logout-btn" onClick={onLogout} title="Sign out">
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button className="navbar-auth-btn navbar-login-btn" onClick={onLogin}>
              <LogIn size={14} />
              <span>Sign In</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
