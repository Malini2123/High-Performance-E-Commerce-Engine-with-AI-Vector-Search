const express = require('express');
const router = express.Router();
const Product = require('../models/product');

// POST /api/cart/total
// Body: { items: [{productId, qty}], discountCode }
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
          qty: {
            $let: {
              vars: { item: { $arrayElemAt: [{ $filter: { input: items, as: 'i', cond: { $eq: ['$$i.productId', { $toString: '$_id' }] } } }, 0] } },
              in: '$$item.qty'
            }
          }
        }
      },
      { $addFields: { lineTotal: { $multiply: ['$price', '$qty'] } } },
      { $group: { _id: null, subtotal: { $sum: '$lineTotal' }, itemCount: { $sum: '$qty' } } }
    ]);

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'No products found' });
    }

    let subtotal = result[0].subtotal;
    let discount = 0;

    // Apply discount code
    if (discountCode === 'SAVE10') discount = subtotal * 0.10;
    if (discountCode === 'SAVE20') discount = subtotal * 0.20;

    const total = subtotal - discount;

    res.json({
      success: true,
      subtotal: subtotal.toFixed(2),
      discount: discount.toFixed(2),
      total: total.toFixed(2),
      itemCount: result[0].itemCount
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;