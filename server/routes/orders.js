const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const Product = require('../models/product');
const { authenticate, requireRole } = require('../middleware/auth');
const { notifyUser } = require('./notifications');

// POST /api/orders — place an order
router.post('/', authenticate, async (req, res) => {
  try {
    const { items, discountCode, address, paymentMethod } = req.body;
    if (!items || items.length === 0)
      return res.status(400).json({ error: 'No items in order' });

    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ error: `Product ${item.productId} not found` });
      if (product.stock < item.quantity)
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });

      total += product.price * item.quantity;
      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity
      });

      // Decrement stock
      await Product.findByIdAndUpdate(product._id, { $inc: { stock: -item.quantity } });
    }

    let discount = 0;
    if (discountCode === 'SAVE10') discount = total * 0.10;
    if (discountCode === 'SAVE20') discount = total * 0.20;

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      total,
      discount,
      finalTotal: total - discount,
      address: address || '',
      paymentMethod: paymentMethod || 'COD'
    });

    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders — get current user's orders
router.get('/', authenticate, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('items.product', 'name price');
    res.json({ total: orders.length, orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/:id — get single order
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
      .populate('items.product', 'name price');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/orders/:id/cancel — cancel an order
router.patch('/:id/cancel', authenticate, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'pending')
      return res.status(400).json({ error: 'Only pending orders can be cancelled' });

    order.status = 'cancelled';
    await order.save();
    res.json({ message: 'Order cancelled', order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin Routes ────────────────────────────────────────────────────────────

/**
 * PATCH /api/orders/:id/status
 * Admin-only: update the status of any order.
 * Also pushes a real-time SSE notification to the order's owner.
 *
 * Body: { status: 'confirmed' | 'shipped' | 'delivered' | 'cancelled' }
 */
const VALID_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

router.patch('/:id/status', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const previousStatus = order.status;
    order.status = status;
    await order.save();

    // Push real-time notification to the buyer (fire-and-forget)
    try {
      notifyUser(String(order.user), 'order_update', {
        orderId: order._id,
        previousStatus,
        status,
        message: `Your order #${String(order._id).slice(-8).toUpperCase()} has been ${status}.`,
        updatedAt: new Date().toISOString()
      });
    } catch (notifyErr) {
      console.warn('[SSE] Failed to notify user:', notifyErr.message);
    }

    res.json({
      message: `Order status updated to "${status}"`,
      order
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/orders/admin/all
 * Admin-only: list all orders with pagination, optional status filter.
 * Query: ?status=pending&page=1&limit=20
 */
router.get('/admin/all', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('user', 'name email')
        .populate('items.product', 'name price'),
      Order.countDocuments(filter)
    ]);

    res.json({
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      orders
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
