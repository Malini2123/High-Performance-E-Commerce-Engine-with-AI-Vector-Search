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


module.exports = mongoose.model('Product', productSchema);