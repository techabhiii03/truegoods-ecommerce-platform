const express = require('express');
const { getCategories, createCategory } = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

const router = express.Router();

router.get('/', getCategories);
router.post('/', protect, requireAdmin, createCategory);

module.exports = router;
