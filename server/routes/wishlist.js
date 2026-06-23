const express = require('express');
const router = express.Router();
const Wishlist = require('../models/wishlist');
const Product = require('../models/product');

// GET /api/wishlist/:userId
// Fetch wishlist for a user, populated with product details
router.get('/:userId', async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.params.userId })
      .populate('products', 'name price category stock description');

    if (!wishlist) {
      // Return an empty wishlist structure instead of 404 to make client side easier
      return res.json({ user: req.params.userId, products: [] });
    }

    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/wishlist/add
// Body: { userId, productId }
router.post('/add', async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ error: 'userId and productId are required' });
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, products: [] });
    }

    // Add product if not already in wishlist
    if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
      await wishlist.save();
    }

    // Populate and return
    await wishlist.populate('products', 'name price category stock description');
    res.status(200).json(wishlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/wishlist/remove
// Body: { userId, productId }
router.delete('/remove', async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ error: 'userId and productId are required' });
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
