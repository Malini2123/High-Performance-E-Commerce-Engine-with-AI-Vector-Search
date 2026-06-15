const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
require('dotenv').config();

const Product = require('./models/product');
const { generateEmbedding } = require('./config/embeddings');

const categories = [
  'Electronics', 'Clothing', 'Books',
  'Home & Garden', 'Sports', 'Toys'
];

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    await Product.deleteMany({});
    console.log('Cleared existing products');

    const products = [];
    console.log('Generating embeddings for 100 products...');

    for (let i = 0; i < 100; i++) {
      const name = faker.commerce.productName();
      const description = faker.commerce.productDescription();
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      // Generate real AI embedding
      const text = `${name} ${category} ${description}`;
      const embedding = await generateEmbedding(text);

      products.push({
        name,
        price: parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
        category,
        description,
        stock: faker.number.int({ min: 0, max: 500 }),
        embedding
      });

      if ((i + 1) % 10 === 0) {
        console.log(`Generated ${i + 1}/100 products...`);
      }
    }

    await Product.insertMany(products);
    console.log('100 products seeded with real embeddings!');
    process.exit(0);

  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedProducts();