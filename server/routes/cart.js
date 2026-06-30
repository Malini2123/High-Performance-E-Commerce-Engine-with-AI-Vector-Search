const express = require('express');
const router = express.Router();
const Product = require('../models/product');

// POST /api/cart/total
// Body: { items: [{productId, quantity}], discountCode }
router.post('/total', async (req, res) => {
  try {
    const { items, discountCode } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items provided' });
    }

    const productIds = items.map(item => item.productId);

    // Aggregation pipeline to calculate total
    const result = await Product.aggregate([
      { $match: { _id: { $in: productIds.map(id => require('mongoose').Types.ObjectId.createFromHexString(id)) } } },
      { $addFields: {
          quantity: {
            $let: {
              vars: { item: { $arrayElemAt: [{ $filter: { input: items, as: 'i', cond: { $eq: ['$$i.productId', { $toString: '$_id' }] } } }, 0] } },
              in: '$$item.quantity'
            }
          }
        }
      },
      { $addFields: { lineTotal: { $multiply: ['$price', '$quantity'] } } },
      { $group: { _id: null, subtotal: { $sum: '$lineTotal' }, itemCount: { $sum: '$quantity' } } }
    ]);

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'No products found' });
    }

    let subtotal = result[0].subtotal;
    let discount = 0;

    // Apply discount code
    if (discountCode === 'SAVE10') discount = subtotal * 0.10;
    if (discountCode === 'SAVE20') discount = subtotal * 0.20;

    const finalTotal = subtotal - discount;

    res.json({
      success: true,
      subtotal: Number(subtotal.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      finalTotal: Number(finalTotal.toFixed(2)),
      itemCount: result[0].itemCount
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/cart/checkout
// Body: { items: [{productId, quantity}] }
router.post('/checkout', async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items provided' });
    }

    const results = [];

    for (const item of items) {
      const product = await Product.findOneAndUpdate(
        { 
          _id: item.productId, 
          stock: { $gte: item.quantity }  // only update if enough stock
        },
        { $inc: { stock: -item.quantity } },  // decrease stock atomically
        { returnDocument: 'after' }
      );

      if (!product) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for product ${item.productId}` 
        });
      }

      results.push({ 
        productId: product._id, 
        name: product.name, 
        remainingStock: product.stock 
      });
    }

    // Invalidate product cache since stock changed
    const { redisClient } = require('../config/redis');
    await redisClient.del('products:all');

    res.json({ 
      success: true, 
      message: 'Order placed successfully', 
      items: results 
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;