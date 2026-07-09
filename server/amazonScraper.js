/**
 * Dynamic Product Scraper
 * Fetches real product data from DummyJSON and FakeStore APIs (with their own CDN images).
 * Books use Open Library cover images.
 *
 * Usage: node amazonScraper.js
 */

const mongoose = require('mongoose');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Product = require('./models/product');

// Map DummyJSON/FakeStore categories to our DB categories
const CATEGORY_MAP = {
  'smartphones': 'Electronics',
  'laptops': 'Electronics',
  'tablets': 'Electronics',
  'mobile-accessories': 'Electronics',
  'fragrances': 'Beauty',
  'skincare': 'Beauty',
  'groceries': 'Food',
  'home-decoration': 'Electronics',
  'kitchen-accessories': 'Electronics',
  'furniture': 'Electronics',
  'tops': 'Clothing',
  'womens-dresses': 'Clothing',
  'womens-shoes': 'Clothing',
  'mens-shirts': 'Clothing',
  'mens-shoes': 'Clothing',
  'mens-watches': 'Clothing',
  'womens-watches': 'Clothing',
  'womens-bags': 'Clothing',
  'womens-jewellery': 'Clothing',
  'sunglasses': 'Clothing',
  'motorcycle': 'Electronics',
  'vehicle': 'Electronics',
  'sports-accessories': 'Sports',
  // FakeStore
  'electronics': 'Electronics',
  "men's clothing": 'Clothing',
  "women's clothing": 'Clothing',
  'jewelery': 'Clothing',
};

const USD_TO_INR = 83;

// ─── BOOKS from Open Library (free, no API key needed) ───────────────────────
const BOOKS = [
  { isbn: '9780735224292', name: 'Atomic Habits by James Clear', price: 499 },
  { isbn: '9780062315007', name: 'The Alchemist by Paulo Coelho', price: 299 },
  { isbn: '9781612680194', name: 'Rich Dad Poor Dad by Robert Kiyosaki', price: 399 },
  { isbn: '9781585424337', name: 'Think and Grow Rich by Napoleon Hill', price: 349 },
  { isbn: '9780857197689', name: 'The Psychology of Money by Morgan Housel', price: 449 },
  { isbn: '9780804139021', name: 'Zero to One by Peter Thiel', price: 549 },
  { isbn: '9781455586691', name: 'Deep Work by Cal Newport', price: 499 },
  { isbn: '9780743269513', name: 'The 7 Habits of Highly Effective People', price: 399 },
  { isbn: '9780439708180', name: 'Harry Potter and the Sorcerers Stone', price: 699 },
  { isbn: '9780307887894', name: 'The Lean Startup by Eric Ries', price: 599 },
  { isbn: '9780062316110', name: 'Sapiens A Brief History of Humankind', price: 649 },
  { isbn: '9781577314806', name: 'The Power of Now by Eckhart Tolle', price: 349 },
  { isbn: '9780143130727', name: 'Ikigai The Japanese Secret to a Long Life', price: 299 },
  { isbn: '9780062457714', name: 'The Subtle Art of Not Giving a Fck', price: 449 },
  { isbn: '9781591846444', name: 'Start With Why by Simon Sinek', price: 499 },
];

// ─── FOOD from DummyJSON (their own CDN images) ───────────────────────────────
// DummyJSON's "groceries" category already gets loaded. These are extra food items
// with images directly from DummyJSON's own CDN.
const FOOD_EXTRA = [
  {
    name: 'Organic Green Tea 100 Bags',
    price: 349,
    description: 'Premium organic green tea. Rich in antioxidants. 100 tea bags.',
    stock: 150,
    image: 'https://cdn.dummyjson.com/products/images/groceries/Green%20Bell%20Pepper/1.png',
  },
  {
    name: 'Himalayan Pink Salt 1kg',
    price: 199,
    description: 'Pure unrefined Himalayan pink salt, rich in 84 trace minerals. 1kg.',
    stock: 200,
    image: 'https://cdn.dummyjson.com/products/images/groceries/Salted%20Butter/1.png',
  },
  {
    name: 'Mixed Dry Fruits Premium Pack 500g',
    price: 799,
    description: 'Premium mix – almonds, cashews, raisins, pistachios, walnuts. 500g.',
    stock: 100,
    image: 'https://cdn.dummyjson.com/products/images/groceries/Honey%20Jar/1.png',
  },
  {
    name: 'Cold Press Extra Virgin Olive Oil 500ml',
    price: 699,
    description: 'Imported cold-pressed extra virgin olive oil. 500ml glass bottle.',
    stock: 80,
    image: 'https://cdn.dummyjson.com/products/images/groceries/Cooking%20Oil/1.png',
  },
  {
    name: 'Dark Chocolate 70% Cocoa 200g',
    price: 299,
    description: 'Rich dark chocolate with 70% cocoa. Vegan, gluten-free. 200g.',
    stock: 120,
    image: 'https://cdn.dummyjson.com/products/images/groceries/Chocolate%20Syrup/1.png',
  },
  {
    name: 'Organic Honey Raw Unfiltered 500g',
    price: 499,
    description: 'Pure raw unfiltered honey from natural beehives. 500g jar.',
    stock: 90,
    image: 'https://cdn.dummyjson.com/products/images/groceries/Honey%20Jar/1.png',
  },
  {
    name: 'Instant Oats Quick Cook 1kg',
    price: 249,
    description: 'Rolled oats for a healthy breakfast, cooks in 2 minutes. 1kg.',
    stock: 180,
    image: 'https://cdn.dummyjson.com/products/images/groceries/Oat%20Groats/1.png',
  },
  {
    name: 'Peanut Butter Crunchy 1kg',
    price: 449,
    description: 'Natural crunchy peanut butter, high protein, no hydrogenated oil. 1kg.',
    stock: 130,
    image: 'https://cdn.dummyjson.com/products/images/groceries/Peanut%20Butter/1.png',
  },
  {
    name: 'Masala Chai Tea Bags 100 Pack',
    price: 199,
    description: 'Authentic Indian masala chai with ginger, cardamom and cinnamon. 100 bags.',
    stock: 160,
    image: 'https://cdn.dummyjson.com/products/images/groceries/Green%20Bell%20Pepper/1.png',
  },
  {
    name: 'Basmati Rice Aged Premium 5kg',
    price: 899,
    description: 'Long grain aged basmati rice, aromatic and fluffy. 5kg pack.',
    stock: 70,
    image: 'https://cdn.dummyjson.com/products/images/groceries/Rice/1.png',
  },
  {
    name: 'Protein Granola Bars Chocolate 12 Pack',
    price: 549,
    description: 'High-protein granola bars with chocolate chips. Gluten-free. Pack of 12.',
    stock: 110,
    image: 'https://cdn.dummyjson.com/products/images/groceries/Chocolate%20Syrup/1.png',
  },
  {
    name: 'Apple Cider Vinegar with Mother 500ml',
    price: 349,
    description: 'Raw unfiltered apple cider vinegar with the mother. Boosts immunity. 500ml.',
    stock: 95,
    image: 'https://cdn.dummyjson.com/products/images/groceries/Cooking%20Oil/1.png',
  },
  {
    name: 'Almonds Premium Whole 500g',
    price: 649,
    description: 'California premium raw almonds. Rich in healthy fats. 500g resealable pack.',
    stock: 140,
    image: 'https://cdn.dummyjson.com/products/images/groceries/Honey%20Jar/1.png',
  },
  {
    name: 'Coconut Oil Virgin Cold Pressed 500ml',
    price: 399,
    description: 'Pure virgin cold-pressed coconut oil for cooking and skin care. 500ml.',
    stock: 85,
    image: 'https://cdn.dummyjson.com/products/images/groceries/Cooking%20Oil/1.png',
  },
  {
    name: 'Protein Powder Whey Chocolate 1kg',
    price: 1499,
    description: 'Whey protein isolate with 24g protein per serving. Chocolate flavour. 1kg.',
    stock: 60,
    image: 'https://cdn.dummyjson.com/products/images/groceries/Oat%20Groats/1.png',
  },
];

// ─── BEAUTY from DummyJSON CDN ────────────────────────────────────────────────
const BEAUTY_EXTRA = [
  {
    name: 'Vitamin C Face Serum 30ml',
    price: 599,
    description: 'Brightening vitamin C serum with niacinamide. Reduces dark spots. 30ml.',
    stock: 120,
    image: 'https://cdn.dummyjson.com/products/images/beauty/Essence%20Mascara%20Lash%20Princess/1.png',
  },
  {
    name: 'Hyaluronic Acid Moisturizer 50ml',
    price: 799,
    description: 'Intense hydration with hyaluronic acid and ceramides. All skin types. 50ml.',
    stock: 90,
    image: 'https://cdn.dummyjson.com/products/images/beauty/Eyeshadow%20Palette%20with%20Mirror/1.png',
  },
  {
    name: 'Sunscreen SPF 50 PA+++ 100g',
    price: 499,
    description: 'Broad spectrum UVA/UVB protection. Lightweight, non-greasy. 100g.',
    stock: 150,
    image: 'https://cdn.dummyjson.com/products/images/beauty/Powder%20Canister/1.png',
  },
  {
    name: 'Retinol Anti-Ageing Night Cream 50ml',
    price: 999,
    description: 'Advanced retinol night cream for wrinkle reduction. 50ml.',
    stock: 70,
    image: 'https://cdn.dummyjson.com/products/images/beauty/Eyeshadow%20Palette%20with%20Mirror/1.png',
  },
  {
    name: 'Rose Water Toner 200ml',
    price: 299,
    description: 'Natural rose water toner. Hydrates, tones and reduces pores. 200ml.',
    stock: 130,
    image: 'https://cdn.dummyjson.com/products/images/beauty/Red%20Nail%20Polish/1.png',
  },
  {
    name: 'Charcoal Face Wash Deep Cleanse 100ml',
    price: 349,
    description: 'Activated charcoal face wash for deep pore cleansing and oil control. 100ml.',
    stock: 110,
    image: 'https://cdn.dummyjson.com/products/images/beauty/Essence%20Mascara%20Lash%20Princess/1.png',
  },
  {
    name: 'Argan Oil Hair Serum 100ml',
    price: 549,
    description: 'Pure Moroccan argan oil for shine, frizz control and nourishment. 100ml.',
    stock: 95,
    image: 'https://cdn.dummyjson.com/products/images/beauty/Powder%20Canister/1.png',
  },
  {
    name: 'Lipstick Matte Long Lasting Pack of 6',
    price: 699,
    description: '6-piece matte lipstick collection. Long-lasting, highly pigmented formula.',
    stock: 80,
    image: 'https://cdn.dummyjson.com/products/images/beauty/Red%20Nail%20Polish/1.png',
  },
  {
    name: 'Niacinamide 10% Face Serum 30ml',
    price: 749,
    description: '10% niacinamide + zinc serum for pores and blemish control. 30ml.',
    stock: 85,
    image: 'https://cdn.dummyjson.com/products/images/beauty/Essence%20Mascara%20Lash%20Princess/1.png',
  },
  {
    name: 'Micellar Water Makeup Remover 400ml',
    price: 499,
    description: 'Gentle micellar water for complete makeup removal without rinsing. 400ml.',
    stock: 120,
    image: 'https://cdn.dummyjson.com/products/images/beauty/Eyeshadow%20Palette%20with%20Mirror/1.png',
  },
  {
    name: 'Keratin Hair Mask Deep Repair 200ml',
    price: 649,
    description: 'Professional keratin hair mask for damaged and frizzy hair. 200ml.',
    stock: 65,
    image: 'https://cdn.dummyjson.com/products/images/beauty/Powder%20Canister/1.png',
  },
  {
    name: 'Perfume Floral Musk Eau de Parfum 100ml',
    price: 1299,
    description: 'Elegant floral musk with top notes of rose and jasmine. Long-lasting. 100ml.',
    stock: 50,
    image: 'https://cdn.dummyjson.com/products/images/fragrances/Chanel%20Coco%20Noir%20Eau%20De/1.png',
  },
  {
    name: 'Eye Cream Dark Circles and Puffiness 15ml',
    price: 899,
    description: 'Advanced eye cream targeting dark circles, puffiness and fine lines. 15ml.',
    stock: 75,
    image: 'https://cdn.dummyjson.com/products/images/beauty/Eyeshadow%20Palette%20with%20Mirror/1.png',
  },
  {
    name: 'BB Cream SPF 30 with Moisturiser 30ml',
    price: 549,
    description: 'Tinted BB cream with SPF 30 for natural coverage and hydration. 30ml.',
    stock: 100,
    image: 'https://cdn.dummyjson.com/products/images/beauty/Powder%20Canister/1.png',
  },
  {
    name: 'Aloe Vera Gel 99 Percent Pure 300ml',
    price: 249,
    description: 'Pure 99% aloe vera gel for skin soothing, sunburn relief and moisturising. 300ml.',
    stock: 200,
    image: 'https://cdn.dummyjson.com/products/images/beauty/Red%20Nail%20Polish/1.png',
  },
];

// ─── Fetch from DummyJSON API ─────────────────────────────────────────────────
async function fetchDummyJSON() {
  console.log('\n📡 Fetching from DummyJSON API...');
  try {
    const response = await axios.get(
      'https://dummyjson.com/products?limit=194&select=title,price,description,category,stock,images,rating,brand,thumbnail',
      { timeout: 15000 }
    );
    const products = response.data.products.map(p => ({
      name: p.title,
      price: Math.round(p.price * USD_TO_INR),
      category: CATEGORY_MAP[p.category] || 'Electronics',
      description: `${p.description}${p.brand ? `. Brand: ${p.brand}` : ''}. Rated ${p.rating}/5 stars.`,
      stock: p.stock || Math.floor(Math.random() * 80) + 10,
      image: p.thumbnail || (p.images && p.images[0]) || '',
    }));
    console.log(`   ✅ Fetched ${products.length} products from DummyJSON`);
    return products;
  } catch (err) {
    console.log(`   ❌ DummyJSON error: ${err.message}`);
    return [];
  }
}

// ─── Fetch from FakeStore API ─────────────────────────────────────────────────
async function fetchFakeStore() {
  console.log('\n📡 Fetching from FakeStore API...');
  try {
    const response = await axios.get('https://fakestoreapi.com/products', { timeout: 15000 });
    const products = response.data.map(p => ({
      name: p.title,
      price: Math.round(p.price * USD_TO_INR),
      category: CATEGORY_MAP[p.category] || 'Electronics',
      description: `${p.description}. Rated ${p.rating?.rate || 4}/5 stars with ${p.rating?.count || 0} reviews.`,
      stock: Math.floor(Math.random() * 100) + 15,
      image: p.image || '',
    }));
    console.log(`   ✅ Fetched ${products.length} products from FakeStore`);
    return products;
  } catch (err) {
    console.log(`   ❌ FakeStore error: ${err.message}`);
    return [];
  }
}

// ─── Fetch book cover from Open Library ──────────────────────────────────────
async function buildBooksProducts() {
  console.log('\n📡 Building Books with Open Library covers...');
  const books = [];
  for (const book of BOOKS) {
    const coverUrl = `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`;
    books.push({
      name: book.name,
      price: book.price,
      category: 'Books',
      description: `${book.name}. A bestselling book. Available in paperback and hardcover.`,
      stock: Math.floor(Math.random() * 80) + 20,
      image: coverUrl,
    });
    console.log(`   📚 ${book.name}`);
  }
  return books;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const existingCount = await Product.countDocuments();
    console.log(`📦 Existing products in DB: ${existingCount}`);

    const [dummyProducts, fakeStoreProducts, booksProducts] = await Promise.all([
      fetchDummyJSON(),
      fetchFakeStore(),
      buildBooksProducts(),
    ]);

    // Combine: DummyJSON + FakeStore + Books + extra Food + extra Beauty
    const foodExtra = FOOD_EXTRA.map(p => ({ ...p, category: 'Food' }));
    const beautyExtra = BEAUTY_EXTRA.map(p => ({ ...p, category: 'Beauty' }));

    const allProducts = [
      ...dummyProducts,
      ...fakeStoreProducts,
      ...booksProducts,
      ...foodExtra,
      ...beautyExtra,
    ];

    console.log(`\n📊 Total products to process: ${allProducts.length}`);
    console.log(`   📚 Books: ${booksProducts.length}, 🍎 Extra Food: ${foodExtra.length}, ✨ Extra Beauty: ${beautyExtra.length}`);

    let inserted = 0;
    let skipped = 0;

    for (const product of allProducts) {
      if (!product.name || product.name.length < 3) { skipped++; continue; }

      const nameWords = product.name.split(' ').slice(0, 4).join(' ');
      const escapedName = nameWords.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const exists = await Product.findOne({ name: { $regex: new RegExp(escapedName, 'i') } });

      if (exists) { skipped++; continue; }

      await new Product({
        name: product.name,
        price: product.price,
        category: product.category,
        description: product.description,
        stock: product.stock,
        image: product.image,
        embedding: [],
      }).save();

      inserted++;
      console.log(`   ✅ ${product.category.padEnd(12)} | ₹${String(product.price).padStart(7)} | ${product.name.substring(0, 55)}`);
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 Scraper Summary:`);
    console.log(`   Total fetched:    ${allProducts.length}`);
    console.log(`   Inserted:         ${inserted}`);
    console.log(`   Skipped (dupes):  ${skipped}`);
    console.log(`   Total in DB now:  ${await Product.countDocuments()}`);
    console.log(`${'='.repeat(60)}\n`);

    // Clear Redis cache
    try {
      const { createClient } = require('redis');
      const redisClient = createClient({ url: process.env.REDIS_URL });
      await redisClient.connect();
      await redisClient.flushAll();
      console.log('🗑️  Redis cache cleared — new products will appear immediately');
      await redisClient.disconnect();
    } catch (redisErr) {
      console.log('⚠️  Could not clear Redis:', redisErr.message);
    }

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  }
}

main();
