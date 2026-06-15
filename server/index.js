const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');

const app = express();

connectDB();
connectRedis();

app.use(cors());
app.use(express.json());

const productRoutes = require('./routes/products');
app.use('/api/products', productRoutes);
const cartRoutes = require('./routes/cart');
app.use('/api/cart', cartRoutes);
const searchRoutes = require('./routes/search');
app.use('/api/search', searchRoutes);

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