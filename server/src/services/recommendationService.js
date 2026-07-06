const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

// --- Phase 1: content-based "similar products" ---
// Same category, overlapping tags scored higher, excludes the product itself and inactive items.
const getSimilarProducts = async (productId, limit = 8) => {
  const product = await Product.findById(productId);
  if (!product) return [];

  const candidates = await Product.find({
    _id: { $ne: productId },
    isActive: true,
    category: product.category,
  })
    .limit(limit * 3) // over-fetch, then rank by tag overlap below
    .lean();

  const scored = candidates.map((c) => {
    const overlap = (c.tags || []).filter((t) => (product.tags || []).includes(t)).length;
    return { ...c, _score: overlap };
  });

  scored.sort((a, b) => b._score - a._score || b.ratingAvg - a.ratingAvg);

  return scored.slice(0, limit);
};

// --- "Frequently bought together" ---
// Looks at all past orders containing this product, counts which OTHER products
// most commonly appear alongside it, and returns the top co-occurring ones.
const getFrequentlyBoughtTogether = async (productId, limit = 6) => {
  const ordersWithProduct = await Order.find({ 'items.product': productId }).select('items').lean();

  const coOccurrence = {};
  for (const order of ordersWithProduct) {
    for (const item of order.items) {
      const id = item.product.toString();
      if (id === productId.toString()) continue;
      coOccurrence[id] = (coOccurrence[id] || 0) + 1;
    }
  }

  const topIds = Object.entries(coOccurrence)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  if (topIds.length === 0) return [];

  const products = await Product.find({ _id: { $in: topIds }, isActive: true }).lean();
  // preserve the co-occurrence ranking order, since Mongo's $in doesn't guarantee it
  return topIds.map((id) => products.find((p) => p._id.toString() === id)).filter(Boolean);
};

// --- Personalized "for you" recommendations ---
// Looks at the user's past order categories, recommends popular active products from those
// categories that the user hasn't already bought. Falls back to overall best-rated products
// for users with no order history yet (cold start).
const getPersonalizedRecommendations = async (userId, limit = 8) => {
  const pastOrders = await Order.find({ user: userId }).select('items').lean();
  const purchasedProductIds = new Set(
    pastOrders.flatMap((o) => o.items.map((i) => i.product.toString()))
  );

  if (purchasedProductIds.size === 0) {
    // Cold start: no purchase history yet, just show top-rated active products
    return Product.find({ isActive: true }).sort({ ratingAvg: -1, createdAt: -1 }).limit(limit).lean();
  }

  const purchasedProducts = await Product.find({ _id: { $in: [...purchasedProductIds] } })
    .select('category')
    .lean();
  const categoryIds = [...new Set(purchasedProducts.map((p) => p.category.toString()))];

  const recommendations = await Product.find({
    _id: { $nin: [...purchasedProductIds] },
    category: { $in: categoryIds },
    isActive: true,
  })
    .sort({ ratingAvg: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  // Top up with globally popular items if the category-based list is thin
  if (recommendations.length < limit) {
    const excludeIds = [...purchasedProductIds, ...recommendations.map((p) => p._id.toString())];
    const fillers = await Product.find({ _id: { $nin: excludeIds }, isActive: true })
      .sort({ ratingAvg: -1 })
      .limit(limit - recommendations.length)
      .lean();
    return [...recommendations, ...fillers];
  }

  return recommendations;
};

module.exports = { getSimilarProducts, getFrequentlyBoughtTogether, getPersonalizedRecommendations };
