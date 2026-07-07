const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const Product = require('../models/product');
const User = require('../models/user');

// GET /api/analytics/summary
router.get('/summary', async (req, res) => {
  try {
    const [totalOrders, totalUsers, totalProducts, revenueData] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments(),
      Product.countDocuments(),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$finalTotal' } } }
      ])
    ]);

    res.json({
      totalOrders,
      totalUsers,
      totalProducts,
      totalRevenue: revenueData[0]?.total || 0
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch summary' });
  }
});

// GET /api/analytics/orders-by-status
router.get('/orders-by-status', async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch order stats' });
  }
});

// GET /api/analytics/top-products
router.get('/top-products', async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.name', totalSold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch top products' });
  }
});

// GET /api/analytics/revenue-over-time
router.get('/revenue-over-time', async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$finalTotal' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch revenue data' });
  }
});

module.exports = router;