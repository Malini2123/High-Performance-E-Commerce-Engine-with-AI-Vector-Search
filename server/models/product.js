const mongoose = require('mongoose');


const productSchema = new mongoose.Schema({
  image: { type: String, default: '' },
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  stock: {
    type: Number,
    required: true,
    default: 0
  },
  embedding: {
    type: [Number],
    default: []
  }
}, {
  timestamps: true
});

productSchema.pre('save', async function() {
  const hasEmbedding = this.embedding && this.embedding.length > 0;
  
  if (this.isNew && hasEmbedding) {
    return;
  }

  const isMetadataModified = this.isModified('name') || this.isModified('category') || this.isModified('description');
  if (isMetadataModified || !hasEmbedding) {
    try {
      const { generateEmbedding } = require('../config/embeddings');
      const text = `${this.name} ${this.category} ${this.description || ''}`;
      this.embedding = await generateEmbedding(text);
    } catch (err) {
      console.error('Error in Product pre-save embedding generation:', err);
    }
  }
});

module.exports = mongoose.model('Product', productSchema);