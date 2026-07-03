const express = require('express');
const router = express.Router();
const Review = require('../models/review');
const { redisClient } = require('../config/redis');

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

/**
 * PATCH /api/reviews/:id/helpful
 * Increment the "helpful" counter on a review.
 * Redis debounce: a given fingerprint (IP + reviewId) can only vote
 * once per hour, preventing trivial spam without requiring auth.
 */
router.patch('/:id/helpful', async (req, res) => {
  try {
    const reviewId = req.params.id;

    // Build a fingerprint from the client IP (falls back to a header)
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim()
      || req.socket?.remoteAddress
      || 'unknown';
    const debounceKey = `review:helpful:${reviewId}:${ip}`;

    // Check if this IP already voted on this review recently
    const alreadyVoted = await redisClient.get(debounceKey);
    if (alreadyVoted) {
      return res.status(429).json({
        error: 'You already marked this review as helpful. Try again later.'
      });
    }

    // Atomically increment the helpful counter
    const review = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { helpful: 1 } },
      { new: true }
    );
    if (!review) return res.status(404).json({ error: 'Review not found' });

    // Lock this IP for 1 hour (3600 seconds)
    await redisClient.setEx(debounceKey, 3600, '1');

    res.json({ reviewId, helpful: review.helpful });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
