const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const { redisClient } = require('../config/redis');

// GET all products - with cache-aside
router.get('/', async (req, res) => {
  try {
    // Step 1: Check Redis cache first
    const cached = await redisClient.get('products:all');
    if (cached) {
      console.log('Cache HIT - returning from Redis');
      return res.json(JSON.parse(cached));
    }

    // Step 2: Cache miss - fetch from MongoDB
    console.log('Cache MISS - fetching from MongoDB');
    const products = await Product.find({});
    const response = { success: true, count: products.length, data: products };

    // Step 3: Store in Redis for 60 seconds
    await redisClient.setEx('products:all', 60, JSON.stringify(response));

    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single product - with cache
router.get('/:id', async (req, res) => {
  try {
    const cacheKey = `product:${req.params.id}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log('Cache HIT - single product');
      return res.json(JSON.parse(cached));
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await redisClient.setEx(cacheKey, 60, JSON.stringify({ success: true, data: product }));
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update - with cache invalidation
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Delete stale cache
    await redisClient.del('products:all');
    await redisClient.del(`product:${req.params.id}`);
    console.log('Cache INVALIDATED after update');

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE - with cache invalidation
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await redisClient.del('products:all');
    await redisClient.del(`product:${req.params.id}`);
    console.log('Cache INVALIDATED after delete');

    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create
router.post('/', async (req, res) => {
  try {
    const product = await Product.create(req.body);
    await redisClient.del('products:all');
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;