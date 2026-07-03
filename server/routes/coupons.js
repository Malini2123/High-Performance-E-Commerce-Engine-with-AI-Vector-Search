const express = require('express');
const router = express.Router();
const Coupon = require('../models/coupon');
const { authenticate, requireAdmin } = require('../middleware/auth');

// ── POST /api/coupons/validate ──────────────────────────────────────────────
// Public-ish: validates a coupon code against an order total.
// Returns discount amount and coupon metadata.
router.post('/validate', authenticate, async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    if (!code || orderTotal === undefined) {
      return res.status(400).json({ error: 'code and orderTotal are required.' });
    }

    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });

    if (!coupon || !coupon.isActive) {
      return res.status(404).json({ valid: false, error: 'Coupon code not found or inactive.' });
    }

    // Check expiry
    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return res.status(400).json({ valid: false, error: 'This coupon has expired.' });
    }

    // Check max uses
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ valid: false, error: 'This coupon has reached its usage limit.' });
    }

    // Check per-user usage
    if (coupon.usedBy.some(id => id.toString() === req.user._id.toString())) {
      return res.status(400).json({ valid: false, error: 'You have already used this coupon.' });
    }

    // Check minimum order amount
    if (orderTotal < coupon.minOrderAmount) {
      return res.status(400).json({
        valid: false,
        error: `Minimum order amount for this coupon is ₹${coupon.minOrderAmount}.`
      });
    }

    const discountAmount = coupon.computeDiscount(orderTotal);

    res.json({
      valid: true,
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      finalTotal: parseFloat((orderTotal - discountAmount).toFixed(2))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/coupons/apply ─────────────────────────────────────────────────
// Marks a coupon as used by the current user (called after order placement).
router.post('/apply', authenticate, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'code is required.' });

    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (!coupon) return res.status(404).json({ error: 'Coupon not found.' });

    coupon.usedCount += 1;
    if (!coupon.usedBy.includes(req.user._id)) {
      coupon.usedBy.push(req.user._id);
    }
    await coupon.save();

    res.json({ message: 'Coupon applied successfully.', usedCount: coupon.usedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/coupons ────────────────────────────────────────────────────────
// Admin only: list all coupons
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ total: coupons.length, coupons });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/coupons ───────────────────────────────────────────────────────
// Admin only: create a new coupon
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ message: 'Coupon created.', coupon });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── PATCH /api/coupons/:id ──────────────────────────────────────────────────
// Admin only: update a coupon (toggle active, change value, etc.)
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coupon) return res.status(404).json({ error: 'Coupon not found.' });
    res.json({ message: 'Coupon updated.', coupon });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── DELETE /api/coupons/:id ─────────────────────────────────────────────────
// Admin only: delete a coupon
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: 'Coupon deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
