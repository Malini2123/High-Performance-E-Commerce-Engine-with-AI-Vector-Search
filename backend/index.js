const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require('./config/db');
//const userRoutes = require('./routes/authRoutes');
const path = require('path');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes.js'));
app.use('/api/orders', require('./routes/orderRoutes.js/index.js'));
app.use('/api/payment', require('./routes/paymentRoutes.js/index.js'));
app.use('/api/analytics', require('./routes/analyticsRoutes.js/index.js'));



app.get("/", (req, res) => {
    res.send("ShopAi backend is working properly");
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is runnig on port ${PORT}`);
});