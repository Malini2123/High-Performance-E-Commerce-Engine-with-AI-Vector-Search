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
    console.warn('Vector search failed, falling back to text/regex keyword search:', err.message);
    try {
      const { query, limit = 10 } = req.body;
      if (!query || query.trim() === '') {
        return res.status(400).json({ error: 'Query is required' });
      }
      
      const regex = new RegExp(query.split(/\s+/).filter(Boolean).map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i');
      
      const fallbackResults = await Product.find({
        $or: [
          { name: { $regex: regex } },
          { category: { $regex: regex } },
          { description: { $regex: regex } }
        ]
      }, { embedding: 0 }).limit(limit);

      const resultsWithScores = fallbackResults.map(p => {
        const obj = p.toObject();
        obj.score = 0.8; // Satisfy frontend score matching
        return obj;
      });

      res.json({
        query,
        count: resultsWithScores.length,
        results: resultsWithScores,
        fallback: true
      });
    } catch (fallbackErr) {
      console.error('Search fallback failed:', fallbackErr);
      res.status(500).json({ error: fallbackErr.message });
    }
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