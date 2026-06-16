const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const { generateEmbedding } = require('../config/embeddings');

// POST /api/chatbot
router.post('/', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    // Generate embedding for the user's question
    const queryEmbedding = await generateEmbedding(message);

    // Find semantically relevant products
    const products = await Product.aggregate([
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 20,
          limit: 3
        }
      },
      { $addFields: { score: { $meta: 'vectorSearchScore' } } },
      { $project: { embedding: 0 } }
    ]);

    // Build smart response
    let reply = '';

    if (products.length === 0) {
      reply = "I couldn't find any products matching your question. Try searching for something else!";
    } else {
      const msg = message.toLowerCase();

      if (msg.includes('cheap') || msg.includes('budget') || msg.includes('affordable') || msg.includes('low price')) {
        const sorted = [...products].sort((a, b) => a.price - b.price);
        reply = `💰 Most affordable option: **${sorted[0].name}** at ₹${sorted[0].price}. `;
        reply += `Also check: ${sorted.slice(1).map(p => p.name).join(', ')}.`;
      } else if (msg.includes('best') || msg.includes('top') || msg.includes('recommend')) {
        reply = `⭐ I recommend **${products[0].name}** (₹${products[0].price}) — it's the closest match to what you're looking for. `;
        reply += `Other great options: ${products.slice(1).map(p => `${p.name} (₹${p.price})`).join(', ')}.`;
      } else if (msg.includes('stock') || msg.includes('available')) {
        const inStock = products.filter(p => p.stock > 0);
        if (inStock.length > 0) {
          reply = `✅ In stock: ${inStock.map(p => `**${p.name}** (${p.stock} units)`).join(', ')}.`;
        } else {
          reply = '❌ Sorry, the products matching your query are currently out of stock.';
        }
      } else {
        reply = `🛍️ Found ${products.length} products for you:\n`;
        products.forEach((p, i) => {
          reply += `${i + 1}. **${p.name}** — ₹${p.price} | Category: ${p.category} | Stock: ${p.stock}\n`;
        });
        reply += `\nWould you like more details about any of these?`;
      }
    }

    res.json({
      message,
      reply,
      productsFound: products.length,
      products: products.map(p => ({
        id: p._id,
        name: p.name,
        price: p.price,
        category: p.category,
        stock: p.stock
      }))
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;