const mongoose = require('mongoose');

/**
 * Coupon Model
 * Supports percentage and flat discount types with optional per-user
 * usage limits, expiry dates, and minimum-order enforcement.
 */
const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  discountType: {
    type: String,
    enum: ['percentage', 'flat'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minOrderAmount: {
    type: Number,
    default: 0
  },
  maxUses: {
    type: Number,
    default: null   // null = unlimited
  },
  usedCount: {
    type: Number,
    default: 0
  },
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  expiresAt: {
    type: Date,
    default: null   // null = never expires
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Helper: compute discount amount for a given order total
couponSchema.methods.computeDiscount = function (orderTotal) {
  if (this.discountType === 'percentage') {
    return parseFloat(((orderTotal * this.discountValue) / 100).toFixed(2));
  }
  return Math.min(this.discountValue, orderTotal);
};

module.exports = mongoose.model('Coupon', couponSchema);
