const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const Product = require('../models/product');
const authMiddleware = require('../middleware/auth');

// POST /api/orders — place an order
router.post('/', authMiddleware, async (req, res) => {
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

    // Invalidate product cache since stock changed
    try {
      const { redisClient } = require('../config/redis');
      await redisClient.del('products:all');
    } catch (cacheErr) {
      console.error('Redis cache clear error in order routing:', cacheErr);
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
router.get('/', authMiddleware, async (req, res) => {
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
router.get('/:id', authMiddleware, async (req, res) => {
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
router.patch('/:id/cancel', authMiddleware, async (req, res) => {
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

module.exports = router;