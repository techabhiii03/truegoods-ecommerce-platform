const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const orderRoutes = require('./routes/orderRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const recommendationRoutes = require('./routes/recommendationRoutes');
const app = express();

// --- Core middleware ---
app.use(
  cors({
    origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://127.0.0.1:5500'],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/recommendations', recommendationRoutes);
// app.use('/api/admin', adminRoutes);   // add later if you build separate admin-only routes

// --- Error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

module.exports = app;