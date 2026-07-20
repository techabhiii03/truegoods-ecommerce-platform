const User = require('../models/User');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');

const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate({ path: 'wishlist', populate: { path: 'category', select: 'name slug' } });
  res.json({ products: user?.wishlist || [] });
});

const toggleWishlist = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) { res.status(404); throw new Error('Product not found'); }
  const user = await User.findById(req.user.id);
  const exists = user.wishlist.some((id) => id.toString() === product._id.toString());
  user.wishlist = exists ? user.wishlist.filter((id) => id.toString() !== product._id.toString()) : [...user.wishlist, product._id];
  await user.save();
  res.json({ saved: !exists, productId: product._id });
});

module.exports = { getWishlist, toggleWishlist };
