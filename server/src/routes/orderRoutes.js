const express = require('express');
const { getMyOrders, getOrderById, getAllOrders, updateOrderStatus } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

const router = express.Router();

// User routes
router.get('/', protect, getMyOrders);
router.get('/:id', protect, getOrderById);

// Admin routes
router.get('/admin/all', protect, requireAdmin, getAllOrders);
router.patch('/admin/:id/status', protect, requireAdmin, updateOrderStatus);

module.exports = router;
