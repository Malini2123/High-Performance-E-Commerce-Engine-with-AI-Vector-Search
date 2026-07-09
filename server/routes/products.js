const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const { redisClient } = require('../config/redis');

// GET /api/products — with filters, sorting, pagination and cache
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

    const isDefault = !category && !minPrice && !maxPrice && !search && page == 1;

    if (isDefault) {
      const start = Date.now();
      const cached = await redisClient.get('products:all');
      if (cached) {
        console.log(`Cache HIT - ${Date.now() - start}ms`);
        return res.json(JSON.parse(cached));
      }
      console.log('Cache MISS - fetching from MongoDB');
    }

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
      Product.find(filter).select('-embedding').sort(sortObj).skip(skip).limit(Number(limit)),
      Product.countDocuments(filter)
    ]);

    const response = {
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      count: products.length,
      data: products
    };

    if (isDefault) {
      await redisClient.setEx('products:all', 60, JSON.stringify(response));
      console.log(`Cache MISS completed - ${Date.now()}ms`);
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/products/:id — single product
router.get('/:id', async (req, res) => {
  try {
    const cacheKey = `product:${req.params.id}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: JSON.parse(cached) });
    }

    const product = await Product.findById(req.params.id).select('-embedding');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await redisClient.setEx(cacheKey, 3600, JSON.stringify(product));
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /api/products/:id/similar — similar products
router.get('/:id/similar', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const similar = await Product.find({
      _id: { $ne: product._id },
      category: product.category
    }).limit(4).select('-embedding');

    res.json({ success: true, similar });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/products — create product
router.post('/', async (req, res) => {
  try {
    const product = await Product.create(req.body);
    await redisClient.del('products:all');
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT /api/products/:id — update product
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
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

// DELETE /api/products/:id — delete product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    await redisClient.del('products:all');
    await redisClient.del(`product:${req.params.id}`);
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;