const express = require('express');
const {
  similarProducts,
  frequentlyBoughtTogether,
  forYou,
} = require('../controllers/recommendationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/similar/:productId', similarProducts);
router.get('/frequently-bought/:productId', frequentlyBoughtTogether);
router.get('/for-you', protect, forYou);

module.exports = router;
