import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CartDrawer from './CartDrawer';

function Navbar() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [chatOpen, setChatOpen] = useState(() => sessionStorage.getItem('global_chatOpen') === 'true');
  const [searchFocused, setSearchFocused] = useState(false);

  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const updateCartCount = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const count = cart.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(count);
    } catch {
      setCartCount(0);
    }
  };

  const updateWishlistCount = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('wishlistIds') || '[]');
      setWishlistCount(saved.length);
    } catch {
      setWishlistCount(0);
    }
  };

  useEffect(() => {
    updateCartCount();
    updateWishlistCount();

    const handleCartUpdated = (e) => {
      updateCartCount();
      if (e.detail && e.detail.openDrawer) {
        setIsDrawerOpen(true);
      }
    };

    const handleWishlistUpdated = () => {
      updateWishlistCount();
    };

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('cart-updated', handleCartUpdated);
    window.addEventListener('wishlist-updated', handleWishlistUpdated);
    window.addEventListener('storage', () => {
      updateCartCount();
      updateWishlistCount();
    });
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdated);
      window.removeEventListener('wishlist-updated', handleWishlistUpdated);
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    const handleStateChange = (e) => {
      setChatOpen(e.detail.open);
    };
    window.addEventListener('chatbot-state-changed', handleStateChange);
    return () => {
      window.removeEventListener('chatbot-state-changed', handleStateChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    window.location.reload();
  };

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    if (window.location.pathname !== '/') {
      navigate('/?q=' + encodeURIComponent(val));
    } else {
      setSearchParams(prev => {
        if (!val) prev.delete('q');
        else prev.set('q', val);
        return prev;
      });
    }
  };

  const toggleAISearch = () => {
    window.dispatchEvent(new CustomEvent('toggle-chatbot'));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (window.location.pathname !== '/') {
        navigate('/?q=' + encodeURIComponent(searchQuery));
      } else {
        setSearchParams(prev => {
          prev.set('q', searchQuery);
          return prev;
        });
      }
    }
  };

  return (
    <div style={styles.navWrapper}>
      <nav 
        className="nav-bar-container"
        style={{
          ...styles.nav,
          boxShadow: isScrolled ? '0 10px 30px rgba(11,47,29,0.06)' : 'none',
          borderBottomColor: isScrolled ? 'rgba(220,232,224,0.4)' : 'var(--border)',
          paddingTop: isScrolled ? '10px' : '14px',
          paddingBottom: isScrolled ? '10px' : '14px',
        }}
      >
        <div style={styles.container} className="nav-inner-container">
          <Link to="/" style={styles.logo}>
            <img 
              src="/zapcart_logo.png" 
              alt="ZapCart Logo" 
              style={{ height: '34px', width: '34px', borderRadius: '8px', objectFit: 'cover', border: '1.5px solid var(--border)' }}
            />
            <span style={{ fontWeight: 800 }}>ZapCart</span>
          </Link>

          {/* Search Bar - expands on focus */}
          <div 
            className="nav-search-bar"
            style={{
              ...styles.searchBar,
              borderColor: searchFocused ? 'var(--secondary)' : 'var(--border)',
              boxShadow: searchFocused ? '0 0 0 3px rgba(22, 163, 74, 0.12)' : 'inset 0 1px 2px rgba(11,47,29,0.03)',
              maxWidth: searchFocused ? '720px' : '580px',
            }}
          >
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              id="product-search-input"
              placeholder="Search products..."
              style={styles.searchInput}
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            />
            {searchQuery && (
              <button
                style={styles.clearBtn}
                onClick={() => handleSearchChange('')}
              >
                ✕
              </button>
            )}
            <button
              style={chatOpen ? styles.aiBtnActive : styles.aiBtn}
              onClick={toggleAISearch}
              title={chatOpen ? "Close AI Shopping Assistant" : "Open AI Shopping Assistant"}
            >
              🤖 {chatOpen ? 'AI Mode' : 'AI'}
            </button>
          </div>

          <div style={styles.links} className="nav-desktop-links">
            <Link to="/" className="nav-link">Products</Link>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="nav-link"
              style={styles.navButton}
            >
              Cart
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: [0.6, 1.4, 0.9, 1.1, 1], opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={styles.badge}
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            
            <Link to="/wishlist" className="nav-link" style={{ position: 'relative' }}>
              Wishlist
              <AnimatePresence>
                {wishlistCount > 0 && (
                  <motion.span
                    key={`wish-${wishlistCount}`}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: [0.6, 1.4, 0.9, 1.1, 1], opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={styles.badge}
                  >
                    {wishlistCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            <Link to="/orders" className="nav-link">Orders</Link>
            <Link to="/analytics" className="nav-link">Analytics</Link>

            {user ? (
              <div 
                style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
                onMouseEnter={() => setShowProfileMenu(true)}
                onMouseLeave={() => setShowProfileMenu(false)}
              >
                <div style={styles.avatar}>
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      style={styles.profileDropdown}
                    >
                      <div style={styles.dropdownHeader}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.email}</div>
                      </div>
                      <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0' }} />
                      <button onClick={handleLogout} style={styles.dropdownItem} className="dropdown-item-hover">
                        🚪 Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login" style={styles.loginBtn}>Login</Link>
            )}
          </div>

          {/* Hamburger toggle button (visible on mobile/tablet only) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="nav-mobile-toggle"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
            }}
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile menu overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="mobile-menu-overlay"
              style={{
                background: '#fff',
                borderTop: '1px solid var(--border)',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '16px 24px',
                overflow: 'hidden',
              }}
            >
              <Link to="/" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>🛍️ Products</Link>
              
              <button
                onClick={() => { setIsDrawerOpen(true); setIsMobileMenuOpen(false); }}
                className="nav-link"
                style={{ ...styles.navButton, textAlign: 'left', width: '100%' }}
              >
                🛒 Cart {cartCount > 0 && <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: '12px', padding: '1px 6px', fontSize: '10px', fontWeight: 800, marginLeft: '5px' }}>{cartCount}</span>}
              </button>
              
              <Link to="/wishlist" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>❤️ Wishlist {wishlistCount > 0 && <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: '12px', padding: '1px 6px', fontSize: '10px', fontWeight: 800, marginLeft: '5px' }}>{wishlistCount}</span>}</Link>
              <Link to="/orders" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>📦 Orders</Link>
              <Link to="/analytics" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>📈 Analytics</Link>

              <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />

              {user ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ ...styles.avatar, width: '28px', height: '28px', fontSize: '12px' }}>
                      {user.name ? user.name[0].toUpperCase() : 'U'}
                    </div>
                    {user.name}
                  </div>
                  <button onClick={handleLogout} style={{ ...styles.dropdownItem, padding: '8px 0', color: 'var(--danger)' }} className="dropdown-item-hover">
                    🚪 Logout
                  </button>
                </div>
              ) : (
                <Link to="/login" style={{ ...styles.loginBtn, alignSelf: 'flex-start', textAlign: 'center' }} onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
      <CartDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </div>
  );
}

const styles = {
  navWrapper: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  topBar: {
    background: '#1b3222',
    color: '#e2e7e3',
    fontSize: '12px',
    padding: '8px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  topBarContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
  },
  contactInfo: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
  },
  topLink: {
    color: '#e2e7e3',
    textDecoration: 'none',
    fontSize: '11px',
    fontWeight: 600,
  },
  topPromo: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#f59e0b',
  },
  nav: {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom: '1px solid var(--border)',
    padding: '0 24px',
    transition: 'all 0.3s ease',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '68px',
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--bg-secondary)',
    border: '1.5px solid var(--border)',
    borderRadius: '28px',
    padding: '8px 12px 8px 18px',
    gap: '10px',
    flex: '1 1 500px',
    maxWidth: '650px',
    margin: '0 24px',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
    transition: 'all 0.2s ease',
  },
  searchIcon: {
    color: 'var(--text-muted)',
    fontSize: '15px',
  },
  searchInput: {
    border: 'none',
    background: 'none',
    outline: 'none',
    color: 'var(--text-primary)',
    fontSize: '14px',
    width: '100%',
    fontFamily: 'var(--sans)',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '12px',
    padding: '2px 6px',
  },
  aiBtn: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    borderRadius: '16px',
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  aiBtnActive: {
    background: 'rgba(22, 163, 74, 0.12)',
    border: '1px solid rgba(22, 163, 74, 0.3)',
    color: 'var(--primary)',
    borderRadius: '16px',
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 0 10px rgba(22, 163, 74, 0.15)',
  },
  logo: {
    color: 'var(--text-primary)',
    textDecoration: 'none',
    fontSize: '22px',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    letterSpacing: '-0.03em',
  },
  logoSpark: {
    color: 'var(--accent)',
    fontSize: '24px',
    textShadow: '0 0 10px rgba(22, 163, 74, 0.3)',
  },
  links: {
    display: 'flex',
    gap: '24px',
    alignItems: 'center',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'var(--secondary)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(22, 163, 74, 0.15)',
    border: '1.5px solid rgba(255,255,255,0.8)',
    transition: 'all 0.2s',
  },
  profileDropdown: {
    position: 'absolute',
    top: '46px',
    right: 0,
    background: '#fff',
    border: '1.5px solid var(--border)',
    borderRadius: '12px',
    boxShadow: 'var(--shadow-lg)',
    padding: '12px',
    minWidth: '180px',
    zIndex: 1000,
    textAlign: 'left',
  },
  dropdownHeader: {
    padding: '4px 8px',
  },
  dropdownItem: {
    width: '100%',
    textAlign: 'left',
    background: 'none',
    border: 'none',
    color: 'var(--text-primary)',
    padding: '8px 10px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    transition: 'all 0.2s',
    display: 'block',
    outline: 'none',
  },
  loginBtn: {
    background: 'var(--primary)',
    color: '#fff',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: 700,
    padding: '8px 22px',
    borderRadius: 'var(--radius-full)',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: 'var(--shadow-sm)',
    letterSpacing: '0.3px',
  },
  navButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    padding: 0,
    outline: 'none',
  },
  badge: {
    background: 'var(--accent)',
    color: '#fff',
    borderRadius: '12px',
    padding: '1px 6px',
    fontSize: '10px',
    fontWeight: 800,
    marginLeft: '5px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '18px',
    height: '18px',
  },
};

export default Navbar;