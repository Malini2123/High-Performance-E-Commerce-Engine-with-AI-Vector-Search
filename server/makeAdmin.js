/**
 * makeAdmin.js — Promote a user to admin role
 *
 * Usage:
 *   node makeAdmin.js user@example.com
 *
 * This script finds the user by email and sets their role to 'admin'
 * so they can access the /admin dashboard in the React frontend.
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/user');

async function makeAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌  Usage: node makeAdmin.js <email>');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅  MongoDB connected');

    const user = await User.findOne({ email });
    if (!user) {
      console.error(`❌  No user found with email: ${email}`);
      process.exit(1);
    }

    user.role = 'admin';
    await user.save();

    console.log(`✅  Successfully promoted "${user.name}" (${user.email}) to admin!`);
    console.log('   They can now log in and visit /admin in the dashboard.');
  } catch (err) {
    console.error('❌  Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

makeAdmin();
