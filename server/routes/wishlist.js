const express = require('express');
const router = express.Router();
const Wishlist = require('../models/wishlist');
const Product = require('../models/product');
const { authenticate } = require('../middleware/auth');

// All wishlist routes require authentication
// userId is always sourced from req.user.id (JWT)

// GET /api/wishlist — get authenticated user's wishlist
router.get('/', authenticate, async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id })
      .populate('products', 'name price category stock description');

    if (!wishlist) {
      return res.json({ user: req.user.id, products: [] });
    }

    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Legacy route — kept for backward compat, always returns the authenticated user's wishlist
router.get('/:userId', authenticate, async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id })
      .populate('products', 'name price category stock description');

    if (!wishlist) {
      return res.json({ user: req.user.id, products: [] });
    }

    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/wishlist/add
// Body: { productId }
router.post('/add', authenticate, async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    if (!productId) {
      return res.status(400).json({ error: 'productId is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, products: [] });
    }

    if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
      await wishlist.save();
    }

    await wishlist.populate('products', 'name price category stock description');
    res.status(200).json(wishlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/wishlist/remove
// Body: { productId }
router.delete('/remove', authenticate, async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    if (!productId) {
      return res.status(400).json({ error: 'productId is required' });
    }

    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    wishlist.products = wishlist.products.filter(p => p.toString() !== productId);
    await wishlist.save();

    await wishlist.populate('products', 'name price category stock description');
    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
