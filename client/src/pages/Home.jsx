/* eslint-disable */
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import apiClient from '../api/client';
import ProductCard from '../components/ProductCard';
import { getImageUrl } from '../utils/images';
import useScrollRestore from '../hooks/useScrollRestore';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import Magnetic from '../components/Magnetic';

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const slideLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
};

const slideRight = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
};

const CATEGORIES = [
  { label: 'Electronics', icon: '💻', color: '#3b82f6', bg: '#eff6ff' },
  { label: 'Clothing',    icon: '👕', color: '#ec4899', bg: '#fdf2f8' },
  { label: 'Food',        icon: '🍎', color: '#f59e0b', bg: '#fffbeb' },
  { label: 'Books',       icon: '📚', color: '#10b981', bg: '#f0fdf4' },
  { label: 'Sports',      icon: '⚽', color: '#8b5cf6', bg: '#f5f3ff' },
  { label: 'Beauty',      icon: '✨', color: '#db2777', bg: '#fdf2f8' },
];

// Known generic/placeholder images assigned to many products (not product-specific)
const GENERIC_IMAGE_FRAGMENTS = [
  'photo-1472851294608-062f824d29cc', // generic shopping default
  'photo-1512621776951-a57141f2eefd', // generic food
  'photo-1498049794561-7780e7231661', // generic electronics
  'photo-1523381210434-271e8be1f52b', // generic clothing / jewelry fallback
  'photo-1512820790803-83ca734da794', // generic books
  'photo-1461896836934-ffe607ba8211', // generic sports
  'photo-1555041469-a586c61ea9bc',    // generic home
  'photo-1522335789203-aabd1fc54bc9', // generic beauty
  'photo-1585836012334-37a7a9a2c2e0', // shared pots/books
  'photo-1593095948071-474c5cc2989d', // shared protein/granola
  'photo-1495214783159-3503fd1b572d', // shared jacket/oats
  'photo-1551488831-00ddcb6c6bd3',    // shared jacket clothing
  'photo-1521572163474-6864f9cf17ab', // shared t-shirts
  'photo-1525904097878-94fb15835963', // shared watches
  'photo-1523275335684-37898b6baf30', // shared watches 2
  'photo-1625634741537-7a63dc5f15d4', // shared usb/drives
];

const FEATURED_PRODUCT_NAMES = [
  'iPhone 15 Pro',
  'WH-1000XM5 Headphones',
  'Smart TV 55"',
  'Inspiron 15 Laptop',
  'EOS R50 Camera',
  'iPad Air 5th',
  'Galaxy Watch 6',
  'JBL Flip 6'
];

function hasProperImage(product) {
  return product.image && product.image.startsWith('http') && !product.image.includes('media-amazon');
}

// Deterministic discount based on product id
function getOffer(product) {
  const seed = product._id ? product._id.charCodeAt(product._id.length - 1) : 0;
  const discountPct = [10, 15, 20, 25, 30][seed % 5];
  const original = Math.round(product.price / (1 - discountPct / 100) / 10) * 10;
  return { original, discountPct };
}

function OfferBadge({ pct }) {
  return (
    <span style={{
      display: 'inline-block',
      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
      color: '#fff',
      fontSize: 11, fontWeight: 800,
      padding: '3px 10px',
      borderRadius: 20,
      letterSpacing: '0.3px',
    }}>
      -{pct}% OFF
    </span>
  );
}



function DealCard({ product, navigate }) {
  const { original, discountPct } = getOffer(product);
  const img = product.image || getImageUrl(product);

  const addToCart = (e) => {
    e.stopPropagation();
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find(i => i._id === product._id);
    const updated = existing
      ? cart.map(i => i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i)
      : [...cart, { ...product, quantity: 1 }];
    localStorage.setItem('cart', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: { openDrawer: true } }));
  };

  return (
    <motion.div
      onClick={() => navigate(`/product/${product._id}`)}
      whileHover="hover"
      style={{
        background: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--border)',
      }}
      variants={{
        hover: {
          y: -6,
          boxShadow: 'var(--shadow-card-hover)',
          borderColor: 'var(--secondary)',
        }
      }}
    >
      <div style={{ position: 'relative', height: 180, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
        <motion.img
          src={img}
          alt={product.name}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
          }}
          variants={{
            hover: { scale: 1.06 }
          }}
          transition={{ duration: 0.4 }}
          onError={e => { e.target.style.display = 'none'; }}
        />
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2 }}>
          <OfferBadge pct={discountPct} />
        </div>
        {/* Product Name Overlay bottom corner */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
          color: '#fff', padding: '24px 12px 8px 12px',
          fontSize: 12, fontWeight: 700,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          zIndex: 1,
        }}>
          {product.name}
        </div>
      </div>
      <div style={{ padding: '12px 12px 14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
            {product.category}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>₹{product.price}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹{original}</span>
            <span style={{ fontSize: 10, color: 'var(--danger)', fontWeight: 700 }}>Save ₹{original - product.price}</span>
          </div>
        </div>
        <motion.button
          onClick={addToCart}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          style={{
            width: '100%',
            padding: '9px',
            background: 'linear-gradient(135deg, var(--secondary), var(--secondary-hover))',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          🛒 Add to Cart
        </motion.button>
      </div>
    </motion.div>
  );
}

// Scrolling offer ticker
function OfferTicker() {
  const offers = [
    '⚡ FLASH SALE: Up to 30% off on Electronics',
    '📚 Books from ₹299 — Limited Stock!',
    '🍎 Fresh Food deals — Buy 2 Get 1 Free',
    '✨ Beauty Essentials — Extra 20% off on orders above ₹999',
    '👕 Clothing Sale — Flat ₹200 off with code STYLE200',
    '⚽ Sports Gear — Free delivery above ₹499',
  ];
  return (
    <div style={{
      background: 'linear-gradient(90deg, #0B2F1D, var(--secondary), #0B2F1D)',
      color: '#eaf2ec',
      fontSize: 12,
      fontWeight: 600,
      padding: '8px 0',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ display: 'inline-block', animation: 'ticker 28s linear infinite' }}>
        {[...offers, ...offers].map((o, i) => (
          <span key={i} style={{ marginRight: 80 }}>• {o}</span>
        ))}
      </span>
      <style>{`@keyframes ticker { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }`}</style>
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { scrollY } = useScroll();
  const yHeroText = useTransform(scrollY, [0, 400], [0, -35]);
  const yHeroBg = useTransform(scrollY, [0, 400], [0, 90]);
  const opacityHero = useTransform(scrollY, [0, 400], [1, 0.3]);

  // Initialize filters & sorting option from sessionStorage for refresh preservation
  const [activeCategory, setActiveCategory] = useState(() => sessionStorage.getItem('home_activeCategory') || null);
  const [sortBy, setSortBy] = useState(() => sessionStorage.getItem('home_sortBy') || 'default');
  const [searchMode, setSearchMode] = useState(() => sessionStorage.getItem('home_searchMode') === 'true');

  const searchQuery = searchParams.get('q') || '';
  const isAISearch = searchParams.get('ai') === 'true';
  const triggerTime = searchParams.get('t') || '';

  // Synchronize state changes to sessionStorage
  useEffect(() => {
    if (activeCategory === null) {
      sessionStorage.removeItem('home_activeCategory');
    } else {
      sessionStorage.setItem('home_activeCategory', activeCategory);
    }
  }, [activeCategory]);

  useEffect(() => {
    sessionStorage.setItem('home_sortBy', sortBy);
  }, [sortBy]);

  useEffect(() => {
    sessionStorage.setItem('home_searchMode', String(searchMode));
  }, [searchMode]);

  // Clear filters & search mode on direct SPA navigation (e.g. clicking logo or Products link)
  useEffect(() => {
    const isRef = performance.getEntriesByType('navigation')[0]?.type === 'reload' || performance.navigation.type === 1;
    if (!isRef && !searchQuery.trim() && !isAISearch) {
      setActiveCategory(null);
      setSearchMode(false);
    }
  }, [location.pathname, location.search, searchQuery, isAISearch]);

  // Restore scroll position after page refresh (waits for data to load)
  useScrollRestore(loading);

  useEffect(() => {
    apiClient.get('/products?limit=200')
      .then(res => {
        const data = res.data.data || res.data || [];
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (isAISearch && searchQuery.trim()) handleAISearch();
  }, [searchQuery, isAISearch, triggerTime]);

  const handleAISearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true); setError(null);
    setSearchMode(true);
    try {
      const res = await apiClient.post('/search', { query: searchQuery, limit: 40 });
      const results = res.data.results || [];
      setFiltered(results.filter(hasProperImage));
    } catch (err) {
      setError(err.response?.data?.error || 'Search failed. Please try again.');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (isAISearch && searchQuery.trim()) return;
    if (searchQuery.trim()) {
      setSearchMode(true);
      const q = searchQuery.toLowerCase();
      setFiltered(
        products
          .filter(hasProperImage)
          .filter(p =>
            (p.name?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q) ||
            p.category?.toLowerCase().includes(q))
          )
          .slice(0, 40)
      );
      return;
    }
    
    setSearchMode(false);
    let result = products.filter(hasProperImage);
    if (activeCategory) {
      result = result.filter(p => p.category?.toLowerCase() === activeCategory.toLowerCase());
      if (sortBy === 'price-low') result.sort((a, b) => a.price - b.price);
      else if (sortBy === 'price-high') result.sort((a, b) => b.price - a.price);
      else if (sortBy === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
      setFiltered(result.slice(0, 40));
    } else {
      const categories = ['electronics', 'clothing', 'food', 'books', 'sports', 'beauty'];
      const mixedFeatured = [];
      
      for (const cat of categories) {
        const catProducts = result.filter(p => p.category?.toLowerCase() === cat);
        mixedFeatured.push(...catProducts.slice(0, 2));
      }
      
      if (mixedFeatured.length < 12) {
        const remaining = result.filter(p => !mixedFeatured.some(m => m._id === p._id));
        mixedFeatured.push(...remaining.slice(0, 12 - mixedFeatured.length));
      }

      let featured = mixedFeatured.slice(0, 12);

      if (sortBy === 'price-low') featured.sort((a, b) => a.price - b.price);
      else if (sortBy === 'price-high') featured.sort((a, b) => b.price - a.price);
      else if (sortBy === 'name') featured.sort((a, b) => a.name.localeCompare(b.name));
      
      setFiltered(featured);
    }
  }, [activeCategory, sortBy, products, searchQuery, isAISearch]);



  // Today's deals: pick 6 products spaced evenly across the list
  const todaysDeals = products.filter(hasProperImage).filter((_, i) => i % 8 === 3 || i % 8 === 5).slice(0, 6);

  return (
    <AnimatedPage>
      <div style={{ background: '#f7f8fa', minHeight: '100vh' }}>
        {/* Scrolling Ticker */}
        <OfferTicker />

        {!searchQuery.trim() && (
          <>
            {/* Hero */}
            <div style={{ position: 'relative', overflow: 'hidden', padding: '80px 0', background: '#062415' }}>
              <motion.div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #062415 0%, #0B2F1D 45%, #14532D 80%, #062415 100%)', y: yHeroBg, zIndex: 0 }} />
              <div style={{ position: 'absolute', top: '-60px', right: '15%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: '-80px', left: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(74,222,128,0.12) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />

              <div 
                className="hero-inner-container"
                style={{ maxWidth: 1200, width: '100%', margin: '0 auto', padding: '0 40px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 48, position: 'relative', zIndex: 1 }}
              >

                {/* LEFT — Text Content */}
                <motion.div
                  className="hero-left-col"
                  style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                >
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.6 }} style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: 20, color: '#fff', fontSize: 12, fontWeight: 600, marginBottom: 16 }}>
                    <span style={{ marginRight: 6 }}>⚡</span> ZapCart Premium Store
                  </motion.div>

                  <motion.h1 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }} style={{ fontSize: 48, fontWeight: 900, color: '#fff', margin: '0 0 16px', lineHeight: 1.1 }}>
                    Shop Smarter.<br />
                    <span style={{ color: '#4ADE80' }}>Save Bigger.</span>
                  </motion.h1>

                  <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }} style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', marginBottom: 32, maxWidth: 450 }}>
                    Curated deals across Electronics, Books, Beauty, Food &amp; more — all at unbeatable prices.
                  </motion.p>

                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }} style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    <Magnetic>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ padding: '12px 24px', background: '#4ADE80', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer' }} onClick={() => { const el = document.getElementById('deals'); el && el.scrollIntoView({ behavior: 'smooth' }); }}>
                        🛍️ Shop Today's Deals
                      </motion.button>
                    </Magnetic>
                    <Magnetic>
                      <motion.button whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.12)' }} whileTap={{ scale: 0.95 }} style={{ padding: '12px 24px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer' }} onClick={() => { const el = document.getElementById('browse'); el && el.scrollIntoView({ behavior: 'smooth' }); }}>
                        Browse Products →
                      </motion.button>
                    </Magnetic>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.6 }} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 36 }}>
                    {[
                      { icon: '⚡', label: 'Flash Sale', sub: 'Ends midnight!', accent: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.25)' },
                      { icon: '🚚', label: 'Free Delivery', sub: 'Above ₹499', accent: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.25)' },
                      { icon: '🔒', label: 'Safe Checkout', sub: '100% Secure', accent: 'rgba(20,83,45,0.25)', border: 'rgba(20,83,45,0.4)' },
                    ].map(card => (
                      <div key={card.label} style={{ display: 'flex', alignItems: 'center', gap: 10, background: card.accent, border: `1px solid ${card.border}`, padding: '10px 16px', borderRadius: 16, fontSize: 12, color: '#fff', backdropFilter: 'blur(8px)' }}>
                        <span style={{ fontSize: 18 }}>{card.icon}</span>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 700, fontSize: 12 }}>{card.label}</div>
                          <div style={{ fontSize: 10, opacity: 0.75, marginTop: 1 }}>{card.sub}</div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                </motion.div>

                {/* RIGHT — Product Showcase Staggered Layout */}
                <div 
                  className="hero-right-col"
                  style={{ flex: 1.2, minWidth: 0, display: 'flex', gap: 16, alignItems: 'center', height: 380, padding: '20px 0' }}
                >
                  {[
                    { img: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=300&h=450&fit=crop&q=80', label: 'Sport Shoes', price: '₹2,499', badge: '15% OFF', offset: -25 },
                    { img: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=300&h=450&fit=crop&q=80', label: 'Organic Serum', price: '₹849', badge: '30% OFF', offset: 25 },
                    { img: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300&h=450&fit=crop&q=80', label: 'Smart Watch', price: '₹3,299', badge: '25% OFF', offset: -25 },
                  ].map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: item.offset + 50 }}
                      animate={{ opacity: 1, y: item.offset }}
                      whileHover={{ y: item.offset - 12, scale: 1.04, boxShadow: '0 20px 48px rgba(0,0,0,0.45)' }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      style={{
                        flex: 1,
                        borderRadius: 16,
                        overflow: 'hidden',
                        position: 'relative',
                        cursor: 'pointer',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        background: '#0a2e1a',
                        height: 280,
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                      onClick={() => { const el = document.getElementById('browse'); el && el.scrollIntoView({ behavior: 'smooth' }); }}
                    >
                      <img
                        src={item.img}
                        alt={item.label}
                        style={{ width: '100%', height: 210, objectFit: 'cover', display: 'block' }}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                      {/* Discount badge */}
                      <div style={{ position: 'absolute', top: 8, right: 8, background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 10, zIndex: 2 }}>
                        {item.badge}
                      </div>
                      {/* Label bar */}
                      <div style={{ flex: 1, padding: '10px 12px', background: 'rgba(6,36,21,0.92)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2 }}>
                        <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{item.label}</span>
                        <span style={{ color: '#4ADE80', fontSize: 13, fontWeight: 900 }}>{item.price}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

              </div>
            </div>

            {/* Flash Sale Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              style={S.flashBanner}
            >
              <div style={S.flashInner}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '8px 14px', fontSize: 22, border: '1px solid rgba(255,255,255,0.2)' }}>⚡</div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Flash Sale — Today Only!</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 3 }}>Use code <strong style={{ background: 'rgba(255,255,255,0.18)', padding: '1px 8px', borderRadius: 6 }}>SAVE20</strong> for extra 20% off on orders above ₹599</div>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.06, background: '#fff', color: '#16A34A' }}
                  whileTap={{ scale: 0.95 }}
                  style={{ padding: '12px 28px', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: 30, fontWeight: 800, fontSize: 14, cursor: 'pointer', backdropFilter: 'blur(8px)', transition: 'all 0.2s' }}
                  onClick={() => document.getElementById('deals')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Shop Now →
                </motion.button>
              </div>
            </motion.div>
          </>
        )}

        {/* Browse / Category Filter Section */}
        <motion.div
          id="browse"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
          style={{
            ...S.section,
            background: '#fff',
            borderRadius: 24,
            margin: searchQuery.trim() ? '40px auto 40px' : '0 auto 40px',
            maxWidth: 1200,
            padding: 32
          }}
        >
          {/* Results Header & Filters Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24, paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
            {/* Left side: Results title */}
            <div>
              <h2 style={{ ...S.sectionTitle, marginBottom: 4 }}>
                {searchQuery.trim()
                  ? `Results for "${searchQuery}"`
                  : activeCategory
                    ? `${activeCategory} Collection`
                    : 'Featured Products'}
              </h2>
              {searchMode && <span style={{ fontSize: 12, color: '#6b7280' }}>{filtered.length} products found</span>}
            </div>

            {/* Right side: Category Filter Pills + Sort select */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              
              {/* Category pills */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '4px' }}>Category:</span>
                <Magnetic>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setActiveCategory(null); setSearchMode(false); }}
                    style={{
                      padding: '6px 14px',
                      background: !activeCategory ? 'var(--secondary)' : 'var(--bg-secondary)',
                      color: !activeCategory ? '#fff' : 'var(--text-primary)',
                      border: 'none', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    All
                  </motion.button>
                </Magnetic>
                {CATEGORIES.map(cat => (
                  <Magnetic key={cat.label}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveCategory(cat.label)}
                      style={{
                        padding: '6px 14px',
                        background: activeCategory === cat.label ? 'var(--secondary)' : 'var(--bg-secondary)',
                        color: activeCategory === cat.label ? '#fff' : 'var(--text-primary)',
                        border: 'none', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {cat.icon} {cat.label}
                    </motion.button>
                  </Magnetic>
                ))}
              </div>

              {/* Vertical Divider */}
              <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />

              {/* Sorting select */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Sort By:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 12, background: '#fff', cursor: 'pointer', outline: 'none', fontWeight: 600, color: '#374151' }}
                >
                  <option value="default">Sort: Featured</option>
                  <option value="price-low">Price: Low → High</option>
                  <option value="price-high">Price: High → Low</option>
                  <option value="name">Name: A → Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="browse-skeleton"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.3 } }}
                style={S.productsGrid}
              >
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="shimmer" style={{ height: 340, background: 'var(--border)', borderRadius: 16 }} />
                ))}
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ textAlign: 'center', color: '#ef4444', padding: 40 }}
              >
                ⚠️ {error}
              </motion.div>
            ) : filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}
              >
                <div style={{ fontSize: 48 }}>🔍</div>
                <div style={{ fontWeight: 600, marginTop: 12 }}>No products found</div>
              </motion.div>
            ) : (
              <motion.div
                key="browse-content"
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                style={S.productsGrid}
              >
                {filtered.map(product => (
                  <motion.div key={product._id} variants={cardItemVariants}>
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Today's Deals */}
        {!searchQuery.trim() && (
          <motion.div
            id="deals"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={sectionVariants}
            style={S.section}
          >
            <div style={S.sectionHeader}>
              <h2 style={S.sectionTitle}>🔥 Today's Deals</h2>
              <p style={S.sectionSub}>Limited time offers — prices slashed!</p>
            </div>
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="deals-skeleton"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.3 } }}
                  style={S.dealsGrid}
                >
                  {[...Array(6)].map((_, i) => <div key={i} className="shimmer" style={{ height: 340, background: 'var(--border)', borderRadius: 16 }} />)}
                </motion.div>
              ) : (
                <motion.div
                  key="deals-content"
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainer}
                  style={S.dealsGrid}
                >
                  {todaysDeals.map(product => (
                    <motion.div key={product._id} variants={cardItemVariants}>
                      <DealCard product={product} navigate={navigate} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
        <style>{`
          @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }
        `}</style>
      </div>
    </AnimatedPage>
  );
}const S = {
  heroWrap: {
    background: 'linear-gradient(135deg, #062415 0%, #0B2F1D 45%, #14532D 80%, #062415 100%)',
    padding: '100px 0 80px',
  },
  heroInner: {
    maxWidth: 1200,
    width: '100%',
    margin: '0 auto',
    padding: '0 40px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 48,
  },
  heroLeft: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    textAlign: 'left',
  },
  heroRight: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  heroPill: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'rgba(34,197,94,0.12)',
    border: '1px solid rgba(34,197,94,0.3)',
    color: '#4ADE80',
    padding: '6px 16px',
    borderRadius: 24,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '1px',
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 'clamp(32px, 5.5vw, 60px)',
    fontWeight: 900,
    color: '#fff',
    lineHeight: 1.15,
    margin: '0 0 20px',
    letterSpacing: '-0.04em',
  },
  heroSub: {
    color: '#a8c4b0',
    fontSize: 16,
    lineHeight: 1.8,
    marginBottom: 36,
    maxWidth: 600,
  },
  heroBtn: {
    padding: '15px 32px',
    background: 'linear-gradient(135deg, #16A34A, #15803D)',
    color: '#fff',
    border: 'none',
    borderRadius: 32,
    fontSize: 14,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 6px 24px rgba(22,163,74,0.4)',
    transition: 'all 0.2s',
    letterSpacing: '0.01em',
  },
  heroOutlineBtn: {
    padding: '14px 30px',
    background: 'rgba(255,255,255,0.06)',
    color: '#fff',
    border: '1.5px solid rgba(255,255,255,0.25)',
    borderRadius: 32,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    backdropFilter: 'blur(8px)',
  },
  heroRight: {
    display: 'none',
  },
  heroCard: {
    borderRadius: 16,
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  section: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '48px 24px',
  },
  sectionHeader: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 900,
    color: '#111',
    margin: '0 0 6px',
    letterSpacing: '-0.02em',
  },
  sectionSub: {
    fontSize: 14,
    color: '#6b7280',
    margin: 0,
  },
  catGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 20,
  },
  dealsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 22,
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
    gap: 22,
  },
  flashBanner: {
    background: 'linear-gradient(90deg, #14532D 0%, #16A34A 50%, #15803D 100%)',
    padding: '24px 24px',
    boxShadow: '0 10px 30px rgba(22,163,74,0.15)',
  },
  flashInner: {
    maxWidth: 1200,
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
};

export default Home;