const express = require('express');
const router = express.Router();

/**
 * In-memory SSE client registry.
 * Map<userId (string) → Set<Response>>
 * Multiple tabs/devices per user are supported.
 */
const clients = new Map();

/**
 * Register an SSE response for a given user.
 */
function addClient(userId, res) {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId).add(res);
}

/**
 * Remove an SSE response (on disconnect).
 */
function removeClient(userId, res) {
  const set = clients.get(userId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) clients.delete(userId);
}

/**
 * Push an SSE event to all connections for a specific user.
 * event  — SSE event name (e.g. 'order_update')
 * payload — plain object, will be JSON-serialised into the `data:` field
 */
function notifyUser(userId, event, payload) {
  const set = clients.get(String(userId));
  if (!set || set.size === 0) return;

  const chunk = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of set) {
    try {
      res.write(chunk);
    } catch (_) {
      // Connection already closed — remove stale entry
      set.delete(res);
    }
  }
}

/**
 * Broadcast an event to ALL connected users.
 * Useful for system-wide announcements (flash sales, maintenance, etc.)
 */
function broadcast(event, payload) {
  const chunk = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const set of clients.values()) {
    for (const res of set) {
      try { res.write(chunk); } catch (_) { /* stale */ }
    }
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/notifications/stream
 *
 * Open an SSE stream for the authenticated user.  The client should call this
 * once and keep the connection open; the server will push events as they occur.
 *
 * Auth: Bearer token passed as ?token=<jwt> query param (because EventSource
 * does not support custom request headers in browsers).
 */
const jwt = require('jsonwebtoken');
const User = require('../models/user');

router.get('/stream', async (req, res) => {
  // ── Auth via query-string token (EventSource limitation) ──
  const token = req.query.token;
  if (!token) {
    return res.status(401).json({ error: 'Token required for SSE stream' });
  }

  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('_id');
    if (!user) return res.status(401).json({ error: 'User not found' });
    userId = String(user._id);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // ── SSE headers ──
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();

  // ── Send a welcome ping so the client knows the stream is open ──
  res.write(`event: connected\ndata: ${JSON.stringify({ userId, ts: Date.now() })}\n\n`);

  // ── Keep-alive heartbeat every 25 s (prevents proxy timeouts) ──
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch (_) {
      clearInterval(heartbeat);
    }
  }, 25_000);

  addClient(userId, res);

  // ── Cleanup on disconnect ──
  req.on('close', () => {
    clearInterval(heartbeat);
    removeClient(userId, res);
    console.log(`[SSE] client disconnected: user ${userId} (${clients.size} users online)`);
  });
});

/**
 * GET /api/notifications/online
 * Returns how many unique users currently have an open SSE stream.
 * (Admin convenience endpoint — not auth-guarded here; guard if needed)
 */
router.get('/online', (_req, res) => {
  res.json({
    onlineUsers: clients.size,
    totalConnections: [...clients.values()].reduce((n, s) => n + s.size, 0),
  });
});

module.exports = { router, notifyUser, broadcast };
