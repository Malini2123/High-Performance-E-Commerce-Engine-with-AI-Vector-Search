/**
 * ScrollRestorer
 *
 * Drop this once inside <App> (inside <BrowserRouter>).
 *
 * Behaviour:
 *  - SPA navigation  → scroll to top immediately (standard browser behaviour)
 *  - Browser refresh → do nothing here; individual pages call useScrollRestore()
 *                      which restores their specific position after data loads.
 *
 * This lives at the app level so EVERY route gets top-scroll on navigation
 * without each page needing to handle it.
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

function isBrowserRefresh() {
  try {
    const navEntry = performance.getEntriesByType('navigation')[0];
    if (navEntry) return navEntry.type === 'reload';
    return performance.navigation.type === 1;
  } catch {
    return false;
  }
}

export default function ScrollRestorer() {
  const location = useLocation();
  const prevPath = useRef(null);
  const isRefresh = useRef(isBrowserRefresh());

  useEffect(() => {
    const currentPath = location.pathname + location.search;

    // On first mount: if this is a refresh, don't force-scroll to top —
    // the individual page's useScrollRestore() will handle restoration.
    if (prevPath.current === null) {
      prevPath.current = currentPath;
      return;
    }

    // SPA navigation to a different route: scroll to top.
    if (!isRefresh.current && prevPath.current !== currentPath) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    prevPath.current = currentPath;
    // After the first navigation, we are never in a "refresh" context again.
    isRefresh.current = false;
  }, [location]);

  return null;
}
