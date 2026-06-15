const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const { generateEmbedding } = require('../config/embeddings');

// POST /api/search — semantic vector search
router.post('/', async (req, res) => {
  try {
    const { query, limit = 10, minScore = 0.5 } = req.body;

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query);

    // MongoDB Atlas vector search aggregation
    const results = await Product.aggregate([
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: limit
        }
      },
      {
        $addFields: {
          score: { $meta: 'vectorSearchScore' }
        }
      },
      {
        $match: {
          score: { $gte: minScore }
        }
      },
      {
        $project: {
          embedding: 0
        }
      }
    ]);

    res.json({
      query,
      count: results.length,
      results
    });

  } catch (err) {
    console.error('Vector search error:', err);
    if (err.message?.includes('$vectorSearch')) {
      return res.status(500).json({
        error: 'Vector index not ready. Check Atlas Search indexes — status must be Active.',
        details: err.message
      });
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /api/search/suggest?q=warm+jacket — autocomplete
router.get('/suggest', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    const suggestions = await Product.find(
      { name: { $regex: q, $options: 'i' } },
      { name: 1, category: 1, price: 1 }
    ).limit(5);

    res.json({ suggestions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;