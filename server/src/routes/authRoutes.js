const express = require('express');
const {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getCurrentUser,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { getWishlist, toggleWishlist } = require('../controllers/wishlistController');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logoutUser);
router.get('/me', protect, getCurrentUser);
router.get('/wishlist', protect, getWishlist);
router.patch('/wishlist/:productId', protect, toggleWishlist);

module.exports = router;
