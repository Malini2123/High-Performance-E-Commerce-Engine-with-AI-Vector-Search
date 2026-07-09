/**
 * useScrollRestore — Scroll Position Persistence
 *
 * Saves the window scroll position to localStorage on every scroll (throttled).
 * Restores it after a page reload (same pathname), but NOT on navigation to a different page.
 * Works on desktop and mobile. Handles dynamic content via a small delay.
 *
 * Usage:
 *   useScrollRestore();           // top-level per-page usage
 *   useScrollRestore(isLoading);  // waits until loading is false before restoring
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const STORAGE_PREFIX = 'scrollPos:';
const THROTTLE_MS = 150; // max one write per 150ms

/**
 * Returns a stable localStorage key for the current route.
 * /product/abc123 → "scrollPos:/product/[id]" so all product pages share the same slot.
 */
function routeKey(pathname) {
  // Normalise dynamic segments so /product/abc and /product/xyz use the same key
  const normalised = pathname
    .replace(/\/product\/[^/]+/, '/product/[id]')
    .replace(/\/orders\/[^/]+/, '/orders/[id]');
  return STORAGE_PREFIX + normalised;
}

/**
 * Detect if this page load is a browser reload/refresh (not an SPA navigation).
 * Uses the Navigation API when available, falls back to performance.navigation.
 */
function isBrowserRefresh() {
  try {
    // Modern browsers
    if (typeof window !== 'undefined' && window.navigation) {
      // navigation.currentEntry?.navigationType is only set on navigations,
      // but we can check the performance entry instead.
    }
    const navEntry = performance.getEntriesByType('navigation')[0];
    if (navEntry) {
      return navEntry.type === 'reload';
    }
    // Fallback for older browsers
    // eslint-disable-next-line no-restricted-globals
    return performance.navigation.type === 1;
  } catch {
    return false;
  }
}

export default function useScrollRestore(isLoading = false) {
  const location = useLocation();
  const key = routeKey(location.pathname);
  const isRefresh = useRef(isBrowserRefresh());
  const restoredRef = useRef(false);
  const throttleTimer = useRef(null);

  // ── 1. Save scroll position on every scroll (throttled) ──────────────────
  useEffect(() => {
    const handleScroll = () => {
      if (throttleTimer.current) return;
      throttleTimer.current = setTimeout(() => {
        try {
          localStorage.setItem(key, String(Math.round(window.scrollY)));
        } catch {
          // localStorage might be unavailable (private mode quota)
        }
        throttleTimer.current = null;
      }, THROTTLE_MS);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (throttleTimer.current) clearTimeout(throttleTimer.current);
    };
  }, [key]);

  // ── 2. Clear the stored position when navigating AWAY (not a refresh) ────
  useEffect(() => {
    // On mount: if this is NOT a refresh, clear any saved position for this route
    // so that navigating back doesn't restore an old position.
    if (!isRefresh.current) {
      try {
        localStorage.removeItem(key);
      } catch { /* ignore */ }
    }
    restoredRef.current = false;

    // On unmount: this route is being left by SPA navigation.
    // We DON'T clear here — the next mount will clear if it's not a refresh.
  }, [location.pathname]); // re-run on every SPA navigation

  // ── 3. Restore scroll position after content has loaded ───────────────────
  useEffect(() => {
    // Only restore on a genuine browser refresh, and only once per mount.
    if (!isRefresh.current || restoredRef.current || isLoading) return;

    const savedPos = parseInt(localStorage.getItem(key) || '0', 10);
    if (!savedPos || savedPos <= 0) return;

    restoredRef.current = true;

    // Small delay to allow React to render dynamic content (images, data, etc.)
    const timer = setTimeout(() => {
      window.scrollTo({ top: savedPos, behavior: 'smooth' });
    }, 300);

    return () => clearTimeout(timer);
  }, [key, isLoading]); // re-run when loading state changes
}
