import React, { useState } from 'react';
import { X, LogIn, UserPlus, Eye, EyeOff, Zap, Loader } from 'lucide-react';
import { saveSession } from '../utils/api';

/**
 * AuthModal — Glassmorphic Login / Register modal
 *
 * Props:
 *   onClose  () => void          — called when the user dismisses the modal
 *   onAuth   (user, token) => void — called on successful authentication
 */
export default function AuthModal({ onClose, onAuth }) {
  const [mode, setMode]         = useState('login');   // 'login' | 'register'
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const isLogin = mode === 'login';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body     = isLogin
        ? { email, password }
        : { name, email, password };

      const res  = await fetch(endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        return;
      }

      // Persist token + user, then bubble up to App
      saveSession(data.token, data.user);
      onAuth(data.user, data.token);
    } catch (err) {
      setError('Cannot connect to server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="auth-modal">

        {/* Header */}
        <div className="auth-modal-header">
          <div className="auth-modal-logo">
            <Zap size={18} color="#1a1c2e" />
          </div>
          <h2 className="auth-modal-title">
            {isLogin ? 'Welcome back' : 'Create account'}
          </h2>
          <button className="auth-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="auth-tabs">
          <button
            className={`auth-tab${isLogin ? ' active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            <LogIn size={14} />
            Sign In
          </button>
          <button
            className={`auth-tab${!isLogin ? ' active' : ''}`}
            onClick={() => { setMode('register'); setError(''); }}
          >
            <UserPlus size={14} />
            Register
          </button>
        </div>

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {!isLogin && (
            <div className="auth-field">
              <label htmlFor="auth-name">Full Name</label>
              <input
                id="auth-name"
                type="text"
                placeholder="e.g. Sanker R Nath"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
                autoComplete="name"
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">Password</label>
            <div className="auth-pw-wrap">
              <input
                id="auth-password"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                className="auth-pw-toggle"
                onClick={() => setShowPw(v => !v)}
                aria-label="Toggle password visibility"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading
              ? <><Loader size={15} className="spin" /> Processing…</>
              : isLogin ? 'Sign In' : 'Create Account'
            }
          </button>
        </form>

        {/* Footer hint */}
        <p className="auth-footer-hint">
          {isLogin
            ? <>No account? <button className="auth-link" onClick={() => { setMode('register'); setError(''); }}>Register free</button></>
            : <>Have an account? <button className="auth-link" onClick={() => { setMode('login'); setError(''); }}>Sign in</button></>
          }
        </p>
      </div>
    </div>
  );
}
