const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { authenticate } = require('../middleware/auth');

// GET /api/wishlist — get user's wishlist
router.get('/', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist', { embedding: 0 });
    res.json({ wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/wishlist/:productId — add to wishlist
router.post('/:productId', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.wishlist.includes(req.params.productId))
      return res.status(400).json({ error: 'Already in wishlist' });

    user.wishlist.push(req.params.productId);
    await user.save();
    res.json({ message: 'Added to wishlist', wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/wishlist/:productId — remove from wishlist
router.delete('/:productId', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.wishlist = user.wishlist.filter(id => id.toString() !== req.params.productId);
    await user.save();
    res.json({ message: 'Removed from wishlist', wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
