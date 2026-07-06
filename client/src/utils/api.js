/**
 * api.js — Authenticated fetch wrapper
 *
 * Automatically attaches the stored JWT Bearer token to every request.
 * Falls back gracefully when no token is present (public routes).
 *
 * Usage:
 *   import { apiFetch } from '../utils/api';
 *   const res = await apiFetch('/api/cart', { method: 'GET' });
 */

const TOKEN_KEY = 'shopai_token';
const USER_KEY  = 'shopai_user';

// ── Token helpers ──────────────────────────────────────────────────────────────

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
};
          
export const saveSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// ── Core fetch wrapper ─────────────────────────────────────────────────────────

/**
 * apiFetch wraps the native fetch API and:
 *  1. Merges Content-Type: application/json by default.
 *  2. Injects Authorization: Bearer <token> when a token is stored.
 *  3. Returns the raw Response so callers can check res.ok / res.status.
 */
export const apiFetch = (url, options = {}) => {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return fetch(url, { ...options, headers });
};
