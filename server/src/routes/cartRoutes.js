const express = require('express');
const {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // every cart route requires auth

router.get('/', getCart);
router.post('/items', addItemToCart);
router.patch('/items/:productId', updateCartItem);
router.delete('/items/:productId', removeCartItem);
router.delete('/', clearCart);

module.exports = router;
