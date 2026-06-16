const express = require('express');
const router = express.Router();
const Review = require('../models/review');
const Product = require('../models/product');

// POST /api/reviews — add a review
router.post('/', async (req, res) => {
  try {
    const { productId, userName, rating, comment } = req.body;
    if (!productId || !userName || !rating || !comment) {
      return res.status(400).json({ error: 'All fields required' });
    }
    const review = await Review.create({ product: productId, userName, rating, comment });
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reviews/:productId — get reviews + avg rating
router.get('/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId }).sort({ createdAt: -1 });
    const avg = reviews.length
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    res.json({
      productId: req.params.productId,
      totalReviews: reviews.length,
      averageRating: Number(avg),
      reviews
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/reviews/:id — delete a review
router.delete('/:id', async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;