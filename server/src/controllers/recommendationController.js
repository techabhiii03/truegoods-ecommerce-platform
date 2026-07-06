const {
  getSimilarProducts,
  getFrequentlyBoughtTogether,
  getPersonalizedRecommendations,
} = require('../services/recommendationService');
const asyncHandler = require('../utils/asyncHandler');

// @route GET /api/recommendations/similar/:productId
// @access Public
const similarProducts = asyncHandler(async (req, res) => {
  const products = await getSimilarProducts(req.params.productId);
  res.status(200).json({ products });
});

// @route GET /api/recommendations/frequently-bought/:productId
// @access Public
const frequentlyBoughtTogether = asyncHandler(async (req, res) => {
  const products = await getFrequentlyBoughtTogether(req.params.productId);
  res.status(200).json({ products });
});

// @route GET /api/recommendations/for-you
// @access Auth
const forYou = asyncHandler(async (req, res) => {
  const products = await getPersonalizedRecommendations(req.user.id);
  res.status(200).json({ products });
});

module.exports = { similarProducts, frequentlyBoughtTogether, forYou };
