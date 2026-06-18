const express = require('express');
const router = express.Router();
const Cart = require('../models/cart');
const Product = require('../models/product');

// GET /api/cart/:userId
// Get the full cart for a user, with product details populated
router.get('/:userId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.params.userId })
      .populate('items.product', 'name price category stock');
    // populate pulls name,price,category,stock from Product — not embedding

    if (!cart) return res.json({ user: req.params.userId, items: [], total: 0 });

    // calculate total on the fly using snapshot price
    const total = cart.items.reduce((sum, item) => sum + item.priceAtAdd * item.quantity, 0);

    res.json({ ...cart.toObject(), total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cart/add
// Body: { userId, productId, quantity }
router.post('/add', async (req, res) => {
  try {
    const { userId, productId, quantity = 1 } = req.body;

    // validate product exists and has enough stock
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
      cart.items.push({
        product: productId,
        quantity,
        priceAtAdd: product.price   // snapshot current price
      });
    }

    await cart.save();
    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/cart/update
// Body: { userId, productId, quantity }
router.put('/update', async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;
    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    const item = cart.items.find(i => i.product.toString() === productId);
    if (!item) return res.status(404).json({ error: 'Item not in cart' });

    // check stock before updating
    const product = await Product.findById(productId);
    if (product.stock < quantity) {
      return res.status(400).json({ error: `Only ${product.stock} units available` });
    }

    item.quantity = quantity;
    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cart/remove
// Body: { userId, productId }
router.delete('/remove', async (req, res) => {
  try {
    const { userId, productId } = req.body;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    cart.items = cart.items.filter(i => i.product.toString() !== productId);
    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cart/clear/:userId
// Wipe the entire cart (needed after order placement)
router.delete('/clear/:userId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.params.userId });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    cart.items = [];
    await cart.save();
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;