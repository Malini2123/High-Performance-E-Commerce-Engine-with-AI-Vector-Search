const express = require('express');
const router = express.Router();
const Product = require('../models/product');

// GET /api/products/:id/similar
router.get('/:id/similar', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const results = await Product.aggregate([
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: product.embedding,
          numCandidates: 50,
          limit: 6
        }
      },
      { $addFields: { score: { $meta: 'vectorSearchScore' } } },
      { $match: { _id: { $ne: product._id } } },
      { $project: { embedding: 0 } }
    ]);

    res.json({ productId: req.params.id, count: results.length, similar: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
