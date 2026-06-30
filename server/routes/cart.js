const express = require('express');
const router = express.Router();
const Cart = require('../models/cart');
const Product = require('../models/product');
const { authenticate } = require('../middleware/auth');
const { redisClient } = require('../config/redis');

// All cart routes require authentication
// userId is always sourced from req.user.id (JWT) — never trusted from body

// Helper to build a consistent cache key per user
const cartCacheKey = (userId) => `cart:${userId}`;

// Helper to invalidate a user's cart cache after any mutation
const invalidateCartCache = async (userId) => {
  try {
    await redisClient.del(cartCacheKey(userId));
  } catch (err) {
    console.warn('Redis cart cache invalidation failed (non-fatal):', err.message);
  }
};

// GET /api/cart — get the authenticated user's cart
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const cacheKey = cartCacheKey(userId);

    // --- Redis Cache Read ---
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log(`Cart Cache HIT for user ${userId}`);
      return res.json(JSON.parse(cached));
    }
    console.log(`Cart Cache MISS for user ${userId} — fetching from MongoDB`);

    const cart = await Cart.findOne({ user: userId })
      .populate('items.product', 'name price category stock');

    const result = cart
      ? { ...cart.toObject(), total: cart.items.reduce((sum, item) => sum + item.priceAtAdd * item.quantity, 0) }
      : { user: userId, items: [], total: 0 };

    // Cache for 120 seconds
    await redisClient.setEx(cacheKey, 120, JSON.stringify(result));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Legacy route kept for backward compat during migration — redirects to user's own cart
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const cacheKey = cartCacheKey(userId);

    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log(`Cart Cache HIT (legacy route) for user ${userId}`);
      return res.json(JSON.parse(cached));
    }

    const cart = await Cart.findOne({ user: userId })
      .populate('items.product', 'name price category stock');

    const result = cart
      ? { ...cart.toObject(), total: cart.items.reduce((sum, item) => sum + item.priceAtAdd * item.quantity, 0) }
      : { user: userId, items: [], total: 0 };

    await redisClient.setEx(cacheKey, 120, JSON.stringify(result));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cart/add
// Body: { productId, quantity }
router.post('/add', authenticate, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user.id;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.stock < quantity) {
      return res.status(400).json({ error: `Only ${product.stock} units in stock` });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = new Cart({ user: userId, items: [] });

    const existing = cart.items.find(i => i.product.toString() === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity, priceAtAdd: product.price });
    }

    await cart.save();
    await invalidateCartCache(userId); // Bust the cache after mutation
    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/cart/update
// Body: { productId, quantity }
router.put('/update', authenticate, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    const item = cart.items.find(i => i.product.toString() === productId);
    if (!item) return res.status(404).json({ error: 'Item not in cart' });

    const product = await Product.findById(productId);
    if (product.stock < quantity) {
      return res.status(400).json({ error: `Only ${product.stock} units available` });
    }

    item.quantity = quantity;
    await cart.save();
    await invalidateCartCache(userId); // Bust the cache after mutation
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cart/remove
// Body: { productId }
router.delete('/remove', authenticate, async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    cart.items = cart.items.filter(i => i.product.toString() !== productId);
    await cart.save();
    await invalidateCartCache(userId); // Bust the cache after mutation
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cart/clear/:userId — wipe the entire cart (after order placement)
router.delete('/clear/:userId', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    cart.items = [];
    await cart.save();
    await invalidateCartCache(userId); // Bust the cache after mutation
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;