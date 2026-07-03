/**
 * seedCoupons.js
 * Run once to populate the database with demo coupon codes.
 *
 * Usage:
 *   node server/seedCoupons.js
 */
require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Dynamically load model after connection
  const Coupon = require('./server/models/coupon');

  await Coupon.deleteMany({}); // clear existing

  const coupons = [
    {
      code: 'SAVE10',
      description: '10% off your order',
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 0,
      maxUses: null,
      isActive: true
    },
    {
      code: 'SAVE20',
      description: '20% off orders above ₹200',
      discountType: 'percentage',
      discountValue: 20,
      minOrderAmount: 200,
      maxUses: 50,
      isActive: true
    },
    {
      code: 'FLAT500',
      description: 'Flat ₹500 off on orders above ₹2000',
      discountType: 'flat',
      discountValue: 500,
      minOrderAmount: 2000,
      maxUses: 100,
      isActive: true
    },
    {
      code: 'WELCOME',
      description: '15% welcome discount for new users',
      discountType: 'percentage',
      discountValue: 15,
      minOrderAmount: 0,
      maxUses: null,
      isActive: true,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
    }
  ];

  await Coupon.insertMany(coupons);
  console.log(`✅ Seeded ${coupons.length} coupons:`);
  coupons.forEach(c => console.log(`  • ${c.code} — ${c.description}`));

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
