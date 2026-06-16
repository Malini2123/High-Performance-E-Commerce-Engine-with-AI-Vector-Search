const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const { redisClient } = require('../config/redis');

// GET all products - with cache-aside and timing
router.get('/', async (req, res) => {
  try {
    const start = Date.now();
    const cached = await redisClient.get('products:all');
    if (cached) {
      const duration = Date.now() - start;
      console.log(`Cache HIT - ${duration}ms`);
      return res.json(JSON.parse(cached));
    }

    console.log('Cache MISS - fetching from MongoDB');
    const products = await Product.find({});
    const response = { success: true, count: products.length, data: products };
    await redisClient.setEx('products:all', 60, JSON.stringify(response));
    const duration = Date.now() - start;
    console.log(`Cache MISS completed - ${duration}ms`);
    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/products — with filters, sorting, pagination
router.get('/', async (req, res) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      sort = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 10,
      search
    } = req.query;

    // Build filter object
    const filter = {};
    if (category) filter.category = { $regex: category, $options: 'i' };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (search) filter.name = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const sortObj = { [sort]: order === 'asc' ? 1 : -1 };

    const [products, total] = await Promise.all([
      Product.find(filter, { embedding: 0 })
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter)
    ]);

    res.json({
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      limit: Number(limit),
      products
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
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

// PUT update - with cache invalidation
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
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

module.exports = router;