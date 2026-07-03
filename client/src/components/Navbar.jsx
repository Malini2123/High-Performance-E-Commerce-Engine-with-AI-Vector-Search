import React, { useState, useEffect } from 'react';
import { Package, ShoppingCart, Heart, ClipboardList, Zap, Search, LogIn, LogOut, UserCircle, User } from 'lucide-react';

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
  // ── Dark mode ──────────────────────────────────────────────────────────────
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('shopai_theme') === 'dark';
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('shopai_theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('shopai_theme', 'light');
    }
  }, [dark]);

  const navItems = [
    { id: 'products', label: 'Products', icon: Package },
    { id: 'search',   label: 'Search',   icon: Search },
    { id: 'cart',     label: 'Cart',     icon: ShoppingCart,  count: cartItemCount,      badgeClass: '' },
    { id: 'wishlist', label: 'Wishlist', icon: Heart,         count: wishlistCount,      badgeClass: 'nav-badge-rose' },
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

        {/* ── Auth + Dark Mode controls ── */}
        <div className="navbar-auth" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

          {/* Dark Mode Toggle */}
          <button
            id="theme-toggle-btn"
            className="theme-toggle"
            onClick={() => setDark(d => !d)}
            title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle dark mode"
          >
            <span className="toggle-icon">{dark ? '☀️' : '🌙'}</span>
            <span>{dark ? 'Light' : 'Dark'}</span>
          </button>

          {currentUser ? (
            <div className="navbar-user">
              {/* Profile link */}
              <button
                id="navbar-profile-btn"
                className={`nav-link${activeTab === 'profile' ? ' active' : ''}`}
                onClick={() => setActiveTab('profile')}
                title="My Profile"
                style={{ display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <User size={15} />
                Profile
              </button>

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
