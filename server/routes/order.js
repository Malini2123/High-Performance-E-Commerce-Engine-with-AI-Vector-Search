const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const Cart = require('../models/cart');
const Product = require('../models/product');
const { authenticate, requireRole } = require('../middleware/auth');
const { redisClient } = require('../config/redis');

// --- Cache key helpers ---
const orderHistoryCacheKey = (userId) => `orders:history:${userId}`;
const singleOrderCacheKey = (orderId) => `order:${orderId}`;

// POST /api/orders/checkout — authenticated users place orders
router.post('/checkout', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { shippingAddress } = req.body;

    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Check stock for all items first
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${item.product.name}`,
        });
      }
    }

    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      quantity: item.quantity,
      priceAtOrder: item.priceAtAdd,
    }));

    const totalAmount = orderItems.reduce(
      (sum, item) => sum + item.priceAtOrder * item.quantity,
      0
    );

    const order = new Order({ user: userId, items: orderItems, totalAmount, shippingAddress });
    await order.save();

    // Decrement stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity },
      });
    }

    // Clear cart
    cart.items = [];
    await cart.save();

    // --- Invalidate caches after checkout ---
    try {
      await redisClient.del(orderHistoryCacheKey(userId)); // Order list is now stale
      await redisClient.del(`cart:${userId}`);             // Cart was cleared
      console.log(`Cache invalidated for user ${userId} after checkout`);
    } catch (cacheErr) {
      console.warn('Redis invalidation after checkout failed (non-fatal):', cacheErr.message);
    }

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/history/:userId — users see own orders; admins see all
router.get('/history/:userId', authenticate, async (req, res) => {
  try {
    // Admins can query any userId; regular users can only see their own
    const targetId = req.user.role === 'admin' ? req.params.userId : req.user.id;
    const cacheKey = orderHistoryCacheKey(targetId);

    // --- Redis Cache Read ---
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log(`Order History Cache HIT for user ${targetId}`);
      return res.json(JSON.parse(cached));
    }
    console.log(`Order History Cache MISS for user ${targetId} — fetching from MongoDB`);

    const orders = await Order.find({ user: targetId })
      .populate('items.product', 'name price category')
      .sort({ createdAt: -1 });

    // Cache for 300 seconds (5 minutes)
    await redisClient.setEx(cacheKey, 300, JSON.stringify(orders));

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/all — ADMIN ONLY: all orders across all users
router.get('/all', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('items.product', 'name price category')
      .populate('user', 'name email role')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/:orderId — single order detail (ownership enforced)
router.get('/:orderId', authenticate, async (req, res) => {
  try {
    const cacheKey = singleOrderCacheKey(req.params.orderId);

    // --- Redis Cache Read ---
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      const order = JSON.parse(cached);
      // Enforce ownership even on cache hit
      if (req.user.role !== 'admin' && order.user.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Access denied.' });
      }
      console.log(`Single Order Cache HIT for order ${req.params.orderId}`);
      return res.json(order);
    }
    console.log(`Single Order Cache MISS for order ${req.params.orderId} — fetching from MongoDB`);

    const order = await Order.findById(req.params.orderId)
      .populate('items.product', 'name price category');

    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Non-admins can only view their own orders
    if (req.user.role !== 'admin' && order.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Cache for 600 seconds (10 minutes)
    await redisClient.setEx(cacheKey, 600, JSON.stringify(order));

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/orders/:orderId/cancel — cancel (only if still pending; ownership enforced)
router.put('/:orderId/cancel', authenticate, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Non-admins can only cancel their own orders
    if (req.user.role !== 'admin' && order.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: `Cannot cancel a ${order.status} order` });
    }

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    order.status = 'cancelled';
    await order.save();

    // --- Invalidate caches after cancel ---
    try {
      await redisClient.del(singleOrderCacheKey(req.params.orderId));     // Stale single order
      await redisClient.del(orderHistoryCacheKey(order.user.toString())); // Stale history list
      console.log(`Cache invalidated for order ${req.params.orderId} after cancellation`);
    } catch (cacheErr) {
      console.warn('Redis invalidation after cancel failed (non-fatal):', cacheErr.message);
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;