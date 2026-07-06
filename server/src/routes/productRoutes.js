const express = require('express');
const {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  updateStock,
  deleteProduct,
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/:slug', getProductBySlug);

// Admin routes
router.post('/', protect, requireAdmin, createProduct);
router.put('/:id', protect, requireAdmin, updateProduct);
router.patch('/:id/stock', protect, requireAdmin, updateStock);
router.delete('/:id', protect, requireAdmin, deleteProduct);

module.exports = router;
