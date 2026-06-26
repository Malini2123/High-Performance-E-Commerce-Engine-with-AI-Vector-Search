import { useState } from 'react';
import apiClient from '../api/client';
import ProductCard from '../components/ProductCard';

function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [chatMsg, setChatMsg] = useState('');
  const [chatReply, setChatReply] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await apiClient.post('/search', { query });
      setResults(res.data.results || []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatMsg.trim()) return;
    setChatLoading(true);
    try {
      const res = await apiClient.post('/chatbot', { message: chatMsg });
      setChatReply(res.data.reply);
    } catch {
      setChatReply('Sorry, something went wrong.');
    }
    setChatLoading(false);
  };

  return (
    <div style={styles.container}>

      {/* Vector Search */}
      <div style={styles.section}>
        <h1 style={styles.title}>🔍 AI Vector Search</h1>
        <p style={styles.subtitle}>Search by meaning, not just keywords</p>
        <form onSubmit={handleSearch} style={styles.form}>
          <input
            style={styles.input}
            placeholder='Try "warm winter jacket" or "budget smartphone"...'
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {searched && !loading && (
          <p style={styles.resultCount}>
            {results.length > 0 ? `Found ${results.length} results for "${query}"` : `No results found for "${query}"`}
          </p>
        )}

        {results.length > 0 && (
          <div style={styles.grid}>
            {results.map(p => (
              <div key={p._id} style={styles.resultCard}>
                <ProductCard product={p} />
                <div style={styles.scoreBadge}>
                  Match: {(p.score * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Chatbot */}
      <div style={styles.chatSection}>
        <h2 style={styles.chatTitle}>🤖 AI Shopping Assistant</h2>
        <p style={styles.subtitle}>Ask anything about our products</p>
        <form onSubmit={handleChat} style={styles.form}>
          <input
            style={styles.input}
            placeholder='Try "recommend cheap electronics" or "what is in stock?"'
            value={chatMsg}
            onChange={e => setChatMsg(e.target.value)}
          />
          <button type="submit" style={styles.chatBtn} disabled={chatLoading}>
            {chatLoading ? 'Thinking...' : 'Ask AI'}
          </button>
        </form>

        {chatReply && (
          <div style={styles.replyBox}>
            <strong>🤖 AI:</strong> {chatReply}
          </div>
        )}
      </div>

    </div>
  );
}

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '32px 20px' },
  section: { marginBottom: '60px' },
  title: { fontSize: '28px', fontWeight: 700, margin: '0 0 8px' },
  subtitle: { color: '#888', marginBottom: '20px' },
  form: { display: 'flex', gap: '12px', marginBottom: '20px' },
  input: {
    flex: 1,
    padding: '12px 16px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: '15px',
    outline: 'none',
  },
  btn: {
    padding: '12px 28px',
    background: '#1a1a1a',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  resultCount: { color: '#555', marginBottom: '16px', fontSize: '14px' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '20px',
  },
  resultCard: { position: 'relative' },
  scoreBadge: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: '#1a1a1a',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 600,
  },
  chatSection: {
    background: '#f8f9fa',
    borderRadius: '16px',
    padding: '32px',
  },
  chatTitle: { fontSize: '22px', fontWeight: 700, margin: '0 0 8px' },
  chatBtn: {
    padding: '12px 28px',
    background: '#7c3aed',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  replyBox: {
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '10px',
    padding: '16px',
    fontSize: '15px',
    lineHeight: 1.6,
    marginTop: '12px',
  },
};

export default Search;