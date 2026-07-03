const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const Order = require('../models/order');
const { redisClient } = require('../config/redis');

/**
 * GET /api/stats/products
 * Returns category distribution, price stats, top-stocked items.
 * Results are cached in Redis for 5 minutes.
 */
router.get('/products', async (req, res) => {
  try {
    const CACHE_KEY = 'stats:products';
    const cached = await redisClient.get(CACHE_KEY);
    if (cached) {
      return res.json({ ...JSON.parse(cached), cached: true });
    }

    const [categoryStats, priceStats, topStocked, lowStock, totalProducts] = await Promise.all([
      // Group by category
      Product.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 }, avgPrice: { $avg: '$price' }, totalStock: { $sum: '$stock' } } },
        { $sort: { count: -1 } }
      ]),

      // Global price stats
      Product.aggregate([
        {
          $group: {
            _id: null,
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' },
            avgPrice: { $avg: '$price' },
            totalStock: { $sum: '$stock' }
          }
        }
      ]),

      // Top 5 most-stocked products
      Product.find().sort({ stock: -1 }).limit(5).select('name price category stock'),

      // Products with stock < 10 (low stock warning)
      Product.countDocuments({ stock: { $lt: 10 } }),

      // Total product count
      Product.countDocuments()
    ]);

    const stats = {
      totalProducts,
      lowStockCount: lowStock,
      priceStats: priceStats[0] || { minPrice: 0, maxPrice: 0, avgPrice: 0, totalStock: 0 },
      categoryBreakdown: categoryStats.map(c => ({
        category: c._id,
        productCount: c.count,
        avgPrice: parseFloat(c.avgPrice.toFixed(2)),
        totalStock: c.totalStock
      })),
      topStockedProducts: topStocked
    };

    await redisClient.setEx(CACHE_KEY, 300, JSON.stringify(stats));
    res.json({ ...stats, cached: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/stats/orders
 * Returns order status distribution and revenue totals.
 * Cached for 2 minutes.
 */
router.get('/orders', async (req, res) => {
  try {
    const CACHE_KEY = 'stats:orders';
    const cached = await redisClient.get(CACHE_KEY);
    if (cached) {
      return res.json({ ...JSON.parse(cached), cached: true });
    }

    const [statusBreakdown, revenueStats, totalOrders] = await Promise.all([
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, avgOrderValue: { $avg: '$totalAmount' } } }
      ]),
      Order.countDocuments()
    ]);

    const stats = {
      totalOrders,
      revenueStats: revenueStats[0]
        ? {
            totalRevenue: parseFloat(revenueStats[0].totalRevenue.toFixed(2)),
            avgOrderValue: parseFloat(revenueStats[0].avgOrderValue.toFixed(2))
          }
        : { totalRevenue: 0, avgOrderValue: 0 },
      statusBreakdown: statusBreakdown.map(s => ({ status: s._id, count: s.count }))
    };

    await redisClient.setEx(CACHE_KEY, 120, JSON.stringify(stats));
    res.json({ ...stats, cached: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/stats/track-view/:productId
 * Lightweight hit: increments a Redis sorted-set member score by 1.
 * Call this whenever a product detail page is viewed.
 * The sorted set key is  `trending:views:YYYY-MM-DD`  (daily window).
 */
router.post('/track-view/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
    const key = `trending:views:${today}`;

    // ZINCRBY returns the new score as a string
    await redisClient.zIncrBy(key, 1, productId);

    // Keep the sorted set for 7 days then auto-expire
    await redisClient.expire(key, 7 * 24 * 3600);

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/stats/trending
 * Returns the top-N most-viewed products over the last `days` days.
 * Merges daily Redis sorted sets, then resolves product docs from MongoDB.
 *
 * Query: ?limit=10&days=7
 */
router.get('/trending', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const days  = Math.min(Number(req.query.days)  || 7,  30);

    // Build list of date keys for the window
    const keys = [];
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      keys.push(`trending:views:${d.toISOString().slice(0, 10)}`);
    }

    // ZUNIONSTORE into a temp key, then ZREVRANGE for top-N
    const tmpKey = `trending:tmp:${Date.now()}`;
    await redisClient.zUnionStore(tmpKey, keys);
    await redisClient.expire(tmpKey, 60); // auto-clean after 60 s

    // ZRANGE with REV + LIMIT
    const topIds = await redisClient.zRange(tmpKey, 0, limit - 1, { REV: true });

    if (!topIds.length) {
      return res.json({ trending: [], cached: false, window: `${days}d` });
    }

    // Fetch scores for display
    const scores = await Promise.all(
      topIds.map(id => redisClient.zScore(tmpKey, id))
    );

    // Resolve product documents
    const products = await Product.find({ _id: { $in: topIds } })
      .select('name price category stock');

    // Preserve ranking order and attach view count
    const productMap = Object.fromEntries(products.map(p => [String(p._id), p]));
    const trending = topIds
      .map((id, idx) => ({
        product: productMap[id] || null,
        views: Number(scores[idx]) || 0
      }))
      .filter(t => t.product !== null);

    res.json({ trending, window: `${days}d`, cached: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/stats/health
 * Lightweight uptime/health-check endpoint.
 * Returns service status, uptime, and Redis connectivity.
 */
router.get('/health', async (req, res) => {
  let redisOk = false;
  try {
    const pong = await redisClient.ping();
    redisOk = pong === 'PONG';
  } catch (_) { /* Redis down */ }

  res.json({
    status: 'ok',
    uptime: process.uptime(),
    memoryMB: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
    redis: redisOk ? 'connected' : 'disconnected',
    ts: new Date().toISOString()
  });
});

module.exports = router;
