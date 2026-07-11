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

// GET /api/orders/admin/all — get all orders in system (admin only)
router.get('/admin/all', authMiddleware, authMiddleware.adminOnly, async (req, res) => {
  try {
    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .populate('items.product', 'name price');
    res.json({ total: orders.length, orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/orders/admin/:id/status — update status of any order (admin only)
router.patch('/admin/:id/status', authMiddleware, authMiddleware.adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email');
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const oldStatus = order.status;
    const newStatus = status;

    if (oldStatus === newStatus) {
      return res.json({ message: `Order status is already ${status}`, order });
    }

    // 1. Transition: pending -> confirmed (deduct stock)
    if (oldStatus === 'pending' && newStatus === 'confirmed') {
      // First pass: Verify all products are in stock
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(404).json({ error: `Product not found for item: ${item.name}` });
        }
        if (product.stock < item.quantity) {
          return res.status(400).json({
            error: `Insufficient stock for "${product.name}". Available: ${product.stock}, Ordered: ${item.quantity}.`
          });
        }
      }

      // Second pass: Deduct stock and invalidate cache
      const { redisClient } = require('../config/redis');
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        product.stock -= item.quantity;
        await product.save();
        
        try {
          await redisClient.del(`product:${product._id}`);
        } catch (cErr) {
          console.error(cErr);
        }
      }
      try {
        await redisClient.del('products:all');
      } catch (cErr) {
        console.error(cErr);
      }
    }

    // 2. Transition: (confirmed or shipped) -> cancelled (restore stock)
    if (['confirmed', 'shipped'].includes(oldStatus) && newStatus === 'cancelled') {
      const { redisClient } = require('../config/redis');
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          await product.save();
          try {
            await redisClient.del(`product:${product._id}`);
          } catch (cErr) {
            console.error(cErr);
          }
        }
      }
      try {
        await redisClient.del('products:all');
      } catch (cErr) {
        console.error(cErr);
      }
    }

    order.status = newStatus;
    await order.save();
    res.json({ message: `Order status updated to ${status}`, order });
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
    if (!['pending', 'confirmed'].includes(order.status))
      return res.status(400).json({ error: 'Only pending or confirmed orders can be cancelled' });

    const oldStatus = order.status;

    // If order was confirmed, restore stock on cancel
    if (oldStatus === 'confirmed') {
      const { redisClient } = require('../config/redis');
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          await product.save();
          try {
            await redisClient.del(`product:${product._id}`);
          } catch (cErr) {
            console.error(cErr);
          }
        }
      }
      try {
        await redisClient.del('products:all');
      } catch (cErr) {
        console.error(cErr);
      }
    }

    order.status = 'cancelled';
    await order.save();
    res.json({ message: 'Order cancelled successfully', order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;