/**
 * seedUsers.js — run once to create the three demo accounts
 * Usage: node seedUsers.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/user');

const DEMO_USERS = [
  { name: 'Sanker (Dev User)',   email: 'sanker@nebula.io',  password: 'password123', role: 'user'  },
  { name: 'Malini (Admin User)', email: 'malini@nebula.io',  password: 'password123', role: 'admin' },
  { name: 'Achala (Beta Tester)',email: 'achala@nebula.io',  password: 'password123', role: 'user'  },
];

async function seed() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  for (const demo of DEMO_USERS) {
    const exists = await User.findOne({ email: demo.email });
    if (exists) {
      console.log(`  ⚠  ${demo.email} already exists — skipping`);
      continue;
    }
    const passwordHash = await bcrypt.hash(demo.password, 12);
    await User.create({ name: demo.name, email: demo.email, passwordHash, role: demo.role });
    console.log(`  ✓  Created ${demo.role}: ${demo.email}`);
  }

  await mongoose.disconnect();
  console.log('\nDone! All demo users seeded.');
}

seed().catch((err) => {
  console.error('Seed error:', err.message);
  process.exit(1);
});
