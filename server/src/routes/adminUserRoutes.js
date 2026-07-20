const express = require('express');
const { getUsers, updateUser } = require('../controllers/adminUserController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');
const router = express.Router();
router.use(protect, requireAdmin);
router.get('/', getUsers);
router.patch('/:id', updateUser);
module.exports = router;
