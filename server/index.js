const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');

const app = express();
app.set('trust proxy', 1); // Fix for Render deployment

connectDB();
connectRedis();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, please try again later.' }
});

app.use(cors());
app.use(express.json());
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/', limiter);
app.use('/api/auth', authLimiter);

const productRoutes = require('./routes/products');
app.use('/api/products', productRoutes);
const cartRoutes = require('./routes/cart');
app.use('/api/cart', cartRoutes);
const searchRoutes = require('./routes/search');
app.use('/api/search', searchRoutes);
const recRoutes = require('./routes/recommendations');
app.use('/api/products', recRoutes);
const reviewRoutes = require('./routes/reviews');
app.use('/api/reviews', reviewRoutes);
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
const wishlistRoutes = require('./routes/wishlist');
app.use('/api/wishlist', wishlistRoutes);
const orderRoutes = require('./routes/orders');
app.use('/api/orders', orderRoutes);
const chatbotRoutes = require('./routes/chatbot');
app.use('/api/chatbot', chatbotRoutes);
const paymentRoutes = require('./routes/payment');
app.use('/api/payment', paymentRoutes);
const analyticsRoutes = require('./routes/analytics');
app.use('/api/analytics', analyticsRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'E-Commerce API is running!',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});