/**
 * Remove products that have Amazon image URLs (blocked by hotlink protection)
 * and old duplicates so the scraper can re-insert clean ones.
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Product = require('./models/product');

async function cleanOldProducts() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Delete any product whose image is from Amazon CDN (blocked)
  const result = await Product.deleteMany({
    $or: [
      { image: { $regex: 'media-amazon', $options: 'i' } },
      { image: { $regex: 'm.media-amazon', $options: 'i' } },
    ]
  });
  console.log(`Deleted ${result.deletedCount} products with Amazon image URLs`);

  const total = await Product.countDocuments();
  console.log(`Remaining products: ${total}`);

  // Clear Redis cache
  try {
    const { createClient } = require('redis');
    const redisClient = createClient({ url: process.env.REDIS_URL });
    await redisClient.connect();
    await redisClient.flushAll();
    console.log('Redis cache cleared');
    await redisClient.disconnect();
  } catch (e) {
    console.log('Redis skip:', e.message);
  }

  await mongoose.disconnect();
  process.exit(0);
}

cleanOldProducts().catch(err => { console.error(err); process.exit(1); });
