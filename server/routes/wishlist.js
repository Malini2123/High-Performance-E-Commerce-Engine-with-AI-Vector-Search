const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { authenticate } = require('../middleware/auth');

// GET /api/wishlist — get user's wishlist
router.get('/', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist', { embedding: 0 });
    // Return as { products: [...] } so frontend wishlist.products works correctly
    res.json({ products: user.wishlist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/wishlist/add — add to wishlist (productId in request body)
router.post('/add', authenticate, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId is required' });

    const user = await User.findById(req.user._id);
    if (user.wishlist.map(id => id.toString()).includes(productId))
      return res.status(400).json({ error: 'Already in wishlist' });

    user.wishlist.push(productId);
    await user.save();
    res.json({ message: 'Added to wishlist' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/wishlist/remove — remove from wishlist (productId in request body)
router.delete('/remove', authenticate, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId is required' });

    const user = await User.findById(req.user._id);
    user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
    await user.save();
    res.json({ message: 'Removed from wishlist' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
