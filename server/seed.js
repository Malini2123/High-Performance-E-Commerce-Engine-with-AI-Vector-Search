const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
require('dotenv').config();

const Product = require('./models/Product');

const categories = [
  'Electronics', 'Clothing', 'Books', 
  'Home & Garden', 'Sports', 'Toys'
];

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Generate 100 fake products
    const products = [];
    for (let i = 0; i < 100; i++) {
      products.push({
        name: faker.commerce.productName(),
        price: parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
        category: categories[Math.floor(Math.random() * categories.length)],
        description: faker.commerce.productDescription(),
        stock: faker.number.int({ min: 0, max: 500 }),
        embedding: Array.from({ length: 10 }, () => Math.random())
      });
    }

    await Product.insertMany(products);
    console.log('100 products seeded successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedProducts();