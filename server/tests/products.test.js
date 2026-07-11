/**
 * Server Integration Tests
 * Stack: Jest + Supertest
 *
 * Tests cover the three core Week 2–3 deliverables:
 *   1. Product API with Redis Cache-Aside Pattern
 *   2. Cache Invalidation on updates/deletes
 *   3. Cart Aggregation Pipeline (totals + discount codes)
 *
 * The Redis client and Mongoose are mocked so tests run
 * without needing live services in CI.
 */

const request = require('supertest');

// ── Mock Redis before loading app modules ──────────────────
const mockRedis = {
  get: jest.fn().mockResolvedValue(null),   // default: cache MISS
  set: jest.fn().mockResolvedValue('OK'),
  setEx: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  on: jest.fn(),
  connect: jest.fn().mockResolvedValue(undefined),
};

jest.mock('../config/redis', () => ({
  redisClient: mockRedis,
  connectRedis: jest.fn().mockResolvedValue(undefined),
}));

// ── Mock MongoDB connection ────────────────────────────────
jest.mock('../config/db', () => jest.fn().mockResolvedValue(undefined));

// ── Mock embedding generation (avoid loading ~500MB model) ─
jest.mock('../config/embeddings', () => ({
  generateEmbedding: jest.fn().mockResolvedValue(new Array(384).fill(0.1)),
}));

// ── Mock Auth Middleware to bypass for testing ──────────────
jest.mock('../middleware/auth', () => {
  const mockAuth = (req, res, next) => {
    req.user = { _id: '64a1b2c3d4e5f60000000001', role: 'admin', name: 'Mock Admin' };
    next();
  };
  mockAuth.adminOnly = (req, res, next) => next();
  return mockAuth;
});

// ── Mock Mongoose models ───────────────────────────────────
const mockProducts = [
  {
    _id: '64a1b2c3d4e5f60000000001',
    name: 'Sony WH-1000XM5 Headphones',
    category: 'Electronics',
    price: 29999,
    stock: 40,
    description: 'Premium wireless noise cancelling headphones',
    image: '',
  },
  {
    _id: '64a1b2c3d4e5f60000000002',
    name: "Men's Winter Jacket",
    category: 'Clothing',
    price: 2499,
    stock: 5,
    description: 'Warm padded winter jacket',
    image: '',
  },
];

jest.mock('../models/product', () => {
  const mockFind = jest.fn();
  const mockCountDocuments = jest.fn();
  const mockFindById = jest.fn();
  const mockFindByIdAndUpdate = jest.fn();
  const mockFindByIdAndDelete = jest.fn();
  const mockCreate = jest.fn();
  const mockAggregate = jest.fn();

  const Model = {
    find: mockFind,
    countDocuments: mockCountDocuments,
    findById: mockFindById,
    findByIdAndUpdate: mockFindByIdAndUpdate,
    findByIdAndDelete: mockFindByIdAndDelete,
    create: mockCreate,
    aggregate: mockAggregate,
  };

  // Default implementations
  mockFind.mockImplementation(() => ({
    select: () => ({
      sort: () => ({
        skip: () => ({
          limit: () => Promise.resolve(mockProducts.map(p => ({ ...p, toObject: () => p }))),
        }),
      }),
    }),
  }));
  mockCountDocuments.mockResolvedValue(mockProducts.length);
  mockFindById.mockImplementation((id) => ({
    select: () => Promise.resolve(mockProducts.find(p => p._id === id) || null),
  }));
  mockFindByIdAndUpdate.mockImplementation((id, body, opts) =>
    Promise.resolve({ ...mockProducts[0], ...body, _id: id })
  );
  mockFindByIdAndDelete.mockImplementation((id) =>
    Promise.resolve(mockProducts.find(p => p._id === id) || null)
  );
  mockCreate.mockImplementation((data) =>
    Promise.resolve({ _id: '64a1b2c3d4e5f60000000099', ...data })
  );
  mockAggregate.mockResolvedValue([{ subtotal: 32498, itemCount: 2 }]);

  return Model;
});

jest.mock('../models/user', () => ({
  findById: jest.fn(),
}));

// ── Load the Express app after mocks are set up ────────────
let app;
beforeAll(() => {
  // Require app AFTER mocks
  const express = require('express');
  const cors = require('cors');
  const productRoutes = require('../routes/products');
  const cartRoutes = require('../routes/cart');
  const searchRoutes = require('../routes/search');

  app = express();
  app.use(express.json());
  app.use(cors());
  app.use('/api/products', productRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/search', searchRoutes);
});

beforeEach(() => {
  jest.clearAllMocks();
  // Reset to default cache-MISS behavior before each test
  mockRedis.get.mockResolvedValue(null);
});

// ══════════════════════════════════════════════════════════
// SUITE 1 — Product API & Cache-Aside Pattern (Week 2)
// ══════════════════════════════════════════════════════════
describe('GET /api/products — Cache-Aside Pattern', () => {
  test('returns 200 with paginated product list on cache MISS', async () => {
    mockRedis.get.mockResolvedValue(null); // cache miss

    const res = await request(app).get('/api/products');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('pages');
  });

  test('returns cached data on cache HIT without hitting MongoDB', async () => {
    const cached = {
      success: true, total: 2, page: 1, pages: 1, count: 2,
      data: mockProducts,
    };
    mockRedis.get.mockResolvedValue(JSON.stringify(cached)); // cache HIT

    const res = await request(app).get('/api/products');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    // Redis get should have been called
    expect(mockRedis.get).toHaveBeenCalledWith('products:all');
    // setEx should NOT be called since we served from cache
    expect(mockRedis.setEx).not.toHaveBeenCalled();
  });

  test('stores result in Redis with TTL after cache MISS', async () => {
    mockRedis.get.mockResolvedValue(null);

    await request(app).get('/api/products');

    expect(mockRedis.setEx).toHaveBeenCalledWith(
      'products:all',
      60, // 60 second TTL
      expect.any(String)
    );
  });

  test('supports ?category= filter (skips cache, queries MongoDB)', async () => {
    const res = await request(app).get('/api/products?category=Electronics');
    expect(res.status).toBe(200);
    // Filtered queries should NOT use the global cache key
    expect(mockRedis.get).not.toHaveBeenCalledWith('products:all');
  });

  test('supports pagination params', async () => {
    const res = await request(app).get('/api/products?page=2&limit=5');
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════
// SUITE 2 — Single Product & Per-Item Cache (Week 2)
// ══════════════════════════════════════════════════════════
describe('GET /api/products/:id — Single product cache', () => {
  const VALID_ID = '64a1b2c3d4e5f60000000001';

  test('returns 200 for valid product ID', async () => {
    const res = await request(app).get(`/api/products/${VALID_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('checks per-product cache key', async () => {
    await request(app).get(`/api/products/${VALID_ID}`);
    expect(mockRedis.get).toHaveBeenCalledWith(`product:${VALID_ID}`);
  });

  test('stores product in Redis with 3600s TTL after cache MISS', async () => {
    await request(app).get(`/api/products/${VALID_ID}`);
    expect(mockRedis.setEx).toHaveBeenCalledWith(
      `product:${VALID_ID}`,
      3600,
      expect.any(String)
    );
  });

  test('returns 404 for non-existent product', async () => {
    const Product = require('../models/product');
    Product.findById.mockImplementation(() => ({
      select: () => Promise.resolve(null),
    }));

    const res = await request(app).get('/api/products/000000000000000000000000');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════
// SUITE 3 — Cache Invalidation on Mutations (Week 2)
// ══════════════════════════════════════════════════════════
describe('Cache invalidation on product mutations', () => {
  const VALID_ID = '64a1b2c3d4e5f60000000001';

  test('PUT /api/products/:id invalidates products:all and product:<id>', async () => {
    const res = await request(app)
      .put(`/api/products/${VALID_ID}`)
      .send({ price: 27999 });

    expect(res.status).toBe(200);
    expect(mockRedis.del).toHaveBeenCalledWith('products:all');
    expect(mockRedis.del).toHaveBeenCalledWith(`product:${VALID_ID}`);
  });

  test('DELETE /api/products/:id invalidates products:all and product:<id>', async () => {
    const res = await request(app).delete(`/api/products/${VALID_ID}`);

    expect(res.status).toBe(200);
    expect(mockRedis.del).toHaveBeenCalledWith('products:all');
    expect(mockRedis.del).toHaveBeenCalledWith(`product:${VALID_ID}`);
  });

  test('POST /api/products (new product) invalidates products:all', async () => {
    const res = await request(app).post('/api/products').send({
      name: 'Test Product', category: 'Electronics',
      price: 999, stock: 10, description: 'A test product'
    });

    expect(res.status).toBe(201);
    expect(mockRedis.del).toHaveBeenCalledWith('products:all');
  });
});

// ══════════════════════════════════════════════════════════
// SUITE 4 — Cart Aggregation Pipeline (Week 3)
// ══════════════════════════════════════════════════════════
describe('POST /api/cart/total — Aggregation pipeline + discounts', () => {
  test('returns 200 with subtotal for valid cart items', async () => {
    const Product = require('../models/product');
    Product.aggregate.mockResolvedValue([{ subtotal: 32498, itemCount: 2 }]);

    const res = await request(app).post('/api/cart/total').send({
      items: [
        { productId: '64a1b2c3d4e5f60000000001', quantity: 1 },
        { productId: '64a1b2c3d4e5f60000000002', quantity: 1 },
      ]
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.subtotal).toBe(32498);
    expect(res.body.discount).toBe(0);
    expect(res.body.finalTotal).toBe(32498);
  });

  test('applies SAVE10 discount code (10% off)', async () => {
    const Product = require('../models/product');
    Product.aggregate.mockResolvedValue([{ subtotal: 10000, itemCount: 1 }]);

    const res = await request(app).post('/api/cart/total').send({
      items: [{ productId: '64a1b2c3d4e5f60000000001', quantity: 1 }],
      discountCode: 'SAVE10'
    });

    expect(res.status).toBe(200);
    expect(res.body.discount).toBe(1000);
    expect(res.body.finalTotal).toBe(9000);
  });

  test('applies SAVE20 discount code (20% off)', async () => {
    const Product = require('../models/product');
    Product.aggregate.mockResolvedValue([{ subtotal: 10000, itemCount: 1 }]);

    const res = await request(app).post('/api/cart/total').send({
      items: [{ productId: '64a1b2c3d4e5f60000000001', quantity: 1 }],
      discountCode: 'SAVE20'
    });

    expect(res.status).toBe(200);
    expect(res.body.discount).toBe(2000);
    expect(res.body.finalTotal).toBe(8000);
  });

  test('returns 400 when no items provided', async () => {
    const res = await request(app).post('/api/cart/total').send({ items: [] });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════
// SUITE 5 — Semantic Search Endpoint (Week 3)
// ══════════════════════════════════════════════════════════
describe('POST /api/search — Vector / semantic search', () => {
  test('returns 400 when query is empty', async () => {
    const res = await request(app).post('/api/search').send({ query: '' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('returns search results for a valid query (fallback path)', async () => {
    const Product = require('../models/product');
    // Simulate vector search failing → fallback text search
    Product.aggregate.mockRejectedValue(new Error('Atlas vector index not found'));
    // search.js calls: Product.find(filter, { embedding: 0 }).limit(n)
    // so the mock must return an object with .limit() directly
    Product.find.mockReturnValue({
      limit: () => Promise.resolve(
        mockProducts.map(p => ({ ...p, toObject: () => ({ ...p }) }))
      ),
    });

    const res = await request(app).post('/api/search').send({ query: 'warm winter jacket' });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.fallback).toBe(true);
  });

  test('returns results with score field in fallback mode', async () => {
    const Product = require('../models/product');
    Product.aggregate.mockRejectedValue(new Error('vector index unavailable'));
    Product.find.mockReturnValue({
      limit: () => Promise.resolve(
        mockProducts.map(p => ({ ...p, toObject: () => ({ ...p }) }))
      ),
    });

    const res = await request(app).post('/api/search').send({ query: 'headphones' });
    expect(res.status).toBe(200);
    res.body.results.forEach(r => {
      expect(r).toHaveProperty('score');
      expect(r.score).toBeGreaterThan(0);
    });
  });
});
