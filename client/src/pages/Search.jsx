/* eslint-disable */
import { useState, useRef, useEffect } from 'react';
import apiClient from '../api/client';
import ProductCard from '../components/ProductCard';
import useScrollRestore from '../hooks/useScrollRestore';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';

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

const SUGGESTIONS = [
  'wireless headphones', 'running shoes', 'organic food',
  'budget laptop', 'smartwatch', 'protein powder',
];

export default function Search() {
  const [query, setQuery] = useState(() => sessionStorage.getItem('search_query') || '');
  const [results, setResults] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('search_results') || '[]');
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(() => sessionStorage.getItem('search_searched') === 'true');

  // Restore scroll position on page refresh
  useScrollRestore(loading);
  const [chatHistory, setChatHistory] = useState(() => {
    try {
      const saved = sessionStorage.getItem('search_chatHistory');
      return saved ? JSON.parse(saved) : [
        { role: 'ai', text: '👋 Hi! I\'m your AI shopping assistant. Ask me anything about products!' }
      ];
    } catch {
      return [
        { role: 'ai', text: '👋 Hi! I\'m your AI shopping assistant. Ask me anything about products!' }
      ];
    }
  });
  const [chatMsg, setChatMsg] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(() => sessionStorage.getItem('search_chatOpen') === 'true');
  const chatEndRef = useRef(null);

  // Sync state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('search_query', query);
  }, [query]);

  useEffect(() => {
    sessionStorage.setItem('search_results', JSON.stringify(results));
  }, [results]);

  useEffect(() => {
    sessionStorage.setItem('search_searched', String(searched));
  }, [searched]);

  useEffect(() => {
    sessionStorage.setItem('search_chatHistory', JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    sessionStorage.setItem('search_chatOpen', String(chatOpen));
  }, [chatOpen]);

  useEffect(() => {
    if (chatOpen) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatOpen]);

  const handleSearch = async (e, q) => {
    if (e) e.preventDefault();
    const searchQuery = q || query;
    if (!searchQuery.trim()) return;
    setQuery(searchQuery);
    setLoading(true);
    setSearched(true);
    try {
      const res = await apiClient.post('/search', { query: searchQuery });
      setResults(res.data.results || res.data || []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatMsg.trim() || chatLoading) return;
    const userMsg = chatMsg.trim();
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatMsg('');
    setChatLoading(true);
    try {
      const res = await apiClient.post('/chatbot', { message: userMsg });
      const reply = res.data.reply || res.data.response || 'No response.';
      setChatHistory(prev => [...prev, { role: 'ai', text: reply }]);
    } catch {
      setChatHistory(prev => [...prev, { role: 'ai', text: 'Sorry, something went wrong!' }]);
    }
    setChatLoading(false);
  };

  return (
    <AnimatedPage>
      <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>

        {/* Search Hero */}
        <div style={s.hero}>
          <div style={s.heroInner}>
            <p style={s.badge}>✨ Powered by AI Vector Search</p>
            <h1 style={s.heroTitle}>Search by meaning,<br />not just keywords</h1>
            <p style={s.heroSub}>Describe what you need in plain English — our AI understands context</p>
            <form onSubmit={handleSearch} style={s.searchForm}>
              <div style={s.searchBox}>
                <span style={s.searchIcon}>🔍</span>
                <input
                  style={s.searchInput}
                  placeholder='Try "warm jacket for winter hiking" or "budget gaming laptop"...'
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  autoFocus
                />
                <button type="submit" style={s.searchBtn} disabled={loading}>
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </form>

            {/* Suggestion chips */}
            {!searched && (
              <div style={s.chips}>
                <span style={{ fontSize: 12, color: '#aaa', marginRight: 8 }}>Try:</span>
                {SUGGESTIONS.map(s_ => (
                  <button key={s_} style={s.chip} onClick={() => handleSearch(null, s_)}>
                    {s_}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div style={s.section}>
          {loading && (
            <div style={s.center}>
              <div style={s.spinner} />
              <p style={{ color: '#888', marginTop: 16 }}>Finding the best matches...</p>
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div style={s.center}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
              <h3 style={{ margin: '0 0 8px' }}>No results found</h3>
              <p style={{ color: '#888' }}>Try rephrasing or ask the AI assistant</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <>
              <div style={s.resultsHeader}>
                <h2 style={s.resultsTitle}>
                  {results.length} results for "<span style={{ color: '#1a1a1a' }}>{query}</span>"
                </h2>
                <span style={s.aiBadge}>🤖 AI Matched</span>
              </div>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                style={s.grid}
              >
                {results.map(p => (
                  <motion.div key={p._id} variants={cardItemVariants}>
                    <ProductCard product={p} />
                  </motion.div>
                ))}
              </motion.div>
            </>
          )}

        {!searched && !loading && (
          <div style={s.center}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✨</div>
            <h3 style={{ margin: '0 0 8px', color: '#1a1a1a' }}>AI-Powered Search</h3>
            <p style={{ color: '#888', maxWidth: 400, textAlign: 'center' }}>
              Type a natural description above and our AI will find the most relevant products for you
            </p>
          </div>
        )}
      </div>

      {/* Chat FAB */}
      <motion.button
        style={s.fab}
        onClick={() => setChatOpen(o => !o)}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9, rotate: -5 }}
      >
        {chatOpen ? '✕' : '🤖'}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 220 }}
            style={s.chatPanel}
          >
            <div style={s.chatHeader}>
              <div>
                <div style={s.chatTitle}>🤖 AI Shopping Assistant</div>
                <div style={s.chatOnline}>● Online</div>
              </div>
              <button style={s.chatClose} onClick={() => setChatOpen(false)}>✕</button>
            </div>

            <div style={s.chatMessages}>
              {chatHistory.map((msg, i) => (
                <div key={i} style={msg.role === 'user' ? s.userBubble : s.aiBubble}>
                  {msg.text}
                </div>
              ))}
              {chatLoading && (
                <div style={s.aiBubble}>
                  <span style={{ opacity: 0.5 }}>Thinking...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form style={s.chatForm} onSubmit={handleChat}>
              <input
                style={s.chatInput}
                placeholder="Ask about products..."
                value={chatMsg}
                onChange={e => setChatMsg(e.target.value)}
              />
              <button type="submit" style={s.chatSend} disabled={!chatMsg.trim() || chatLoading}>
                ➤
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </AnimatedPage>
  );
}

const s = {
  hero: {
    background: 'linear-gradient(135deg, #090a0f 0%, #161824 50%, #090a0f 100%)',
    padding: '72px 20px 60px',
    color: '#fff',
    borderBottom: '1px solid var(--border)',
  },
  heroInner: { maxWidth: 800, margin: '0 auto', textAlign: 'center' },
  badge: {
    display: 'inline-block',
    background: 'rgba(110,231,183,0.12)',
    border: '1px solid rgba(110,231,183,0.25)',
    color: '#6ee7b7',
    padding: '6px 16px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 20,
    letterSpacing: '0.5px',
  },
  heroTitle: {
    fontSize: 'clamp(26px, 4.5vw, 44px)',
    fontWeight: 800,
    margin: '0 0 16px',
    lineHeight: 1.2,
    color: '#fff',
    letterSpacing: '-0.02em',
  },
  heroSub: { color: '#94a3b8', fontSize: 15, marginBottom: 36, lineHeight: 1.6 },
  searchForm: { width: '100%' },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--card-bg)',
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: 'var(--shadow-xl)',
    maxWidth: 700,
    margin: '0 auto',
    border: '1px solid var(--border)',
    transition: 'all 0.3s',
  },
  searchIcon: { padding: '0 18px', fontSize: 18, color: 'var(--text-secondary)' },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: 15,
    padding: '16px 0',
    background: 'transparent',
    color: 'var(--text-primary)',
  },
  searchBtn: {
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
    color: '#fff',
    border: 'none',
    padding: '16px 32px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginTop: 24,
    alignItems: 'center',
  },
  chip: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#cbd5e1',
    padding: '6px 16px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  section: { maxWidth: 1200, margin: '0 auto', padding: '40px 20px 80px' },
  resultsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 12,
  },
  resultsTitle: { fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-secondary)' },
  aiBadge: {
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    color: '#10b981',
    padding: '6px 14px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '24px',
  },
  center: { textAlign: 'center', padding: '100px 20px', color: 'var(--text-secondary)' },
  spinner: {
    width: 40, height: 40,
    border: '3px solid var(--border)',
    borderTop: '3px solid var(--primary)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto',
  },

  // Chat
  fab: {
    position: 'fixed', bottom: 28, right: 28, zIndex: 100,
    width: 60, height: 60, borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
    color: '#fff', border: 'none',
    fontSize: 24, cursor: 'pointer',
    boxShadow: 'var(--shadow-xl)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'transform 0.2s',
  },
  chatPanel: {
    position: 'fixed', bottom: 104, right: 28, zIndex: 100,
    width: 350, height: 500,
    background: 'var(--card-bg)', borderRadius: 16,
    boxShadow: 'var(--shadow-xl)',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
    border: '1px solid var(--border)',
    animation: 'fadeIn 0.2s ease-out',
  },
  chatHeader: {
    background: 'var(--bg-secondary)', color: 'var(--text-primary)',
    padding: '16px 20px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderBottom: '1px solid var(--border)',
  },
  chatTitle: { fontSize: 14, fontWeight: 700 },
  chatOnline: { fontSize: 11, color: '#10b981', marginTop: 2, fontWeight: 600 },
  chatClose: { background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 16, cursor: 'pointer' },
  chatMessages: {
    flex: 1, overflowY: 'auto', padding: 20,
    display: 'flex', flexDirection: 'column', gap: 12,
    background: 'var(--bg-primary)',
  },
  userBubble: {
    alignSelf: 'flex-end', background: 'var(--primary)', color: '#fff',
    padding: '12px 16px', borderRadius: '16px 16px 3px 16px',
    fontSize: 13, maxWidth: '80%',
    boxShadow: 'var(--shadow-sm)',
    fontWeight: 500,
  },
  aiBubble: {
    alignSelf: 'flex-start', background: 'var(--bg-secondary)',
    padding: '12px 16px', borderRadius: '16px 16px 16px 3px',
    fontSize: 13, maxWidth: '80%', color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    fontWeight: 500,
    lineHeight: 1.4,
  },
  chatForm: {
    display: 'flex', borderTop: '1px solid var(--border)',
    background: 'var(--card-bg)',
  },
  chatInput: {
    flex: 1, border: 'none', outline: 'none',
    padding: '16px', fontSize: 13,
    background: 'transparent',
    color: 'var(--text-primary)',
  },
  chatSend: {
    background: 'transparent', color: 'var(--primary)', border: 'none',
    padding: '0 20px', fontSize: 18, cursor: 'pointer',
    fontWeight: 700,
    transition: 'color 0.2s',
  },
};