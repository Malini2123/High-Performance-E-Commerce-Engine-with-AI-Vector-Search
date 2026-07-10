import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../api/client';

export default function Chatbot() {
  const [chatHistory, setChatHistory] = useState(() => {
    try {
      const saved = sessionStorage.getItem('global_chatHistory');
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
  const [chatOpen, setChatOpen] = useState(() => sessionStorage.getItem('global_chatOpen') === 'true');
  const chatEndRef = useRef(null);

  useEffect(() => {
    sessionStorage.setItem('global_chatHistory', JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    sessionStorage.setItem('global_chatOpen', String(chatOpen));
    window.dispatchEvent(new CustomEvent('chatbot-state-changed', { detail: { open: chatOpen } }));
  }, [chatOpen]);

  useEffect(() => {
    if (chatOpen) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [chatHistory, chatOpen]);

  useEffect(() => {
    const handleToggle = () => {
      setChatOpen(prev => !prev);
    };

    window.addEventListener('toggle-chatbot', handleToggle);
    return () => {
      window.removeEventListener('toggle-chatbot', handleToggle);
    };
  }, []);

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
    <>
      {/* Chat FAB */}
      <motion.button
        style={styles.fab}
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
            style={styles.chatPanel}
          >
            <div style={styles.chatHeader}>
              <div>
                <div style={styles.chatTitle}>🤖 AI Shopping Assistant</div>
                <div style={styles.chatOnline}>● Online</div>
              </div>
              <button style={styles.chatClose} onClick={() => setChatOpen(false)}>✕</button>
            </div>

            <div style={styles.chatMessages}>
              {chatHistory.map((msg, i) => (
                <div key={i} style={msg.role === 'user' ? styles.userBubble : styles.aiBubble}>
                  {msg.text}
                </div>
              ))}
              {chatLoading && (
                <div style={styles.aiBubble}>
                  <span style={{ opacity: 0.5 }}>Thinking...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form style={styles.chatForm} onSubmit={handleChat}>
              <input
                style={styles.chatInput}
                placeholder="Ask about products..."
                value={chatMsg}
                onChange={e => setChatMsg(e.target.value)}
              />
              <button type="submit" style={styles.chatSend} disabled={!chatMsg.trim() || chatLoading}>
                ➤
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const styles = {
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
    background: 'var(--bg-card)', borderRadius: 16,
    boxShadow: 'var(--shadow-xl)',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
    border: '1px solid var(--border)',
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
    background: 'var(--bg-card)',
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
