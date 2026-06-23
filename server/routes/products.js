const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const { redisClient } = require('../config/redis');

// GET all products - with cache-aside and timing
router.get('/', async (req, res) => {
  try {
    const start = Date.now();
    let cached = null;
    if (redisClient.isOpen && redisClient.isReady) {
      try {
        cached = await redisClient.get('products:all');
      } catch (cacheErr) {
        console.warn('Redis Get Error:', cacheErr.message);
      }
    }
    if (cached) {
      const duration = Date.now() - start;
      console.log(`Cache HIT - ${duration}ms`);
      return res.json(JSON.parse(cached));
    }

    console.log('Cache MISS - fetching from MongoDB');
    const products = await Product.find({});
    const response = { success: true, count: products.length, data: products };
    if (redisClient.isOpen && redisClient.isReady) {
      try {
        await redisClient.setEx('products:all', 60, JSON.stringify(response));
      } catch (cacheErr) {
        console.warn('Redis Set Error:', cacheErr.message);
      }
    }
    const duration = Date.now() - start;
    console.log(`Cache MISS completed - ${duration}ms`);
    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single product - with cache
router.get('/:id', async (req, res) => {
  try {
    const cacheKey = `product:${req.params.id}`;
    let cached = null;
    if (redisClient.isOpen && redisClient.isReady) {
      try {
        cached = await redisClient.get(cacheKey);
      } catch (cacheErr) {
        console.warn('Redis Get Product Error:', cacheErr.message);
      }
    }
    if (cached) {
      console.log('Cache HIT - single product');
      return res.json(JSON.parse(cached));
    }
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (redisClient.isOpen && redisClient.isReady) {
      try {
        await redisClient.setEx(cacheKey, 60, JSON.stringify({ success: true, data: product }));
      } catch (cacheErr) {
        console.warn('Redis Set Product Error:', cacheErr.message);
      }
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create
router.post('/', async (req, res) => {
  try {
    const product = await Product.create(req.body);
    if (redisClient.isOpen && redisClient.isReady) {
      try {
        await redisClient.del('products:all');
      } catch (cacheErr) {
        console.warn('Redis Del Error:', cacheErr.message);
      }
    }
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
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
    if (redisClient.isOpen && redisClient.isReady) {
      try {
        await redisClient.del('products:all');
        await redisClient.del(`product:${req.params.id}`);
        console.log('Cache INVALIDATED after update');
      } catch (cacheErr) {
        console.warn('Redis Invalidation Error:', cacheErr.message);
      }
    }
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
    if (redisClient.isOpen && redisClient.isReady) {
      try {
        await redisClient.del('products:all');
        await redisClient.del(`product:${req.params.id}`);
        console.log('Cache INVALIDATED after delete');
      } catch (cacheErr) {
        console.warn('Redis Invalidation Error:', cacheErr.message);
      }
    }
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;