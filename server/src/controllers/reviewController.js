const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const refreshProductRating = async (productId) => {
  const [summary] = await Review.aggregate([
    { $match: { product: productId } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Product.findByIdAndUpdate(productId, {
    ratingAvg: summary ? Number(summary.avg.toFixed(2)) : 0,
    ratingCount: summary?.count || 0,
  });
};

const getProductReviews = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Number(req.query.limit || 10), 50);
  const skip = (page - 1) * limit;
  const filter = { product: req.params.productId };
  const [reviews, total] = await Promise.all([
    Review.find(filter).populate('user', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Review.countDocuments(filter),
  ]);
  const distributionRows = await Review.aggregate([
    { $match: { product: new (require('mongoose').Types.ObjectId)(req.params.productId) } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
  ]);
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  distributionRows.forEach((row) => { distribution[row._id] = row.count; });
  res.json({ reviews, page, totalPages: Math.ceil(total / limit), total, distribution });
});

const createReview = asyncHandler(async (req, res) => {
  const { rating, title, comment } = req.body;
  if (!rating || rating < 1 || rating > 5 || !title?.trim() || !comment?.trim()) {
    res.status(400); throw new Error('Rating, title and comment are required');
  }
  const product = await Product.findById(req.params.productId);
  if (!product) { res.status(404); throw new Error('Product not found'); }
  const existing = await Review.findOne({ product: product._id, user: req.user.id });
  if (existing) { res.status(409); throw new Error('You have already reviewed this product'); }
  const verifiedPurchase = Boolean(await Order.exists({
    user: req.user.id,
    'items.product': product._id,
    paymentStatus: 'paid',
  }));
  const review = await Review.create({ product: product._id, user: req.user.id, rating, title, comment, verifiedPurchase });
  await refreshProductRating(product._id);
  await review.populate('user', 'name');
  res.status(201).json({ review });
});

const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.reviewId);
  if (!review) { res.status(404); throw new Error('Review not found'); }
  if (review.user.toString() !== req.user.id) { res.status(403); throw new Error('You can only edit your own review'); }
  const { rating, title, comment } = req.body;
  if (rating !== undefined) review.rating = rating;
  if (title !== undefined) review.title = title;
  if (comment !== undefined) review.comment = comment;
  await review.save();
  await refreshProductRating(review.product);
  await review.populate('user', 'name');
  res.json({ review });
});

const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.reviewId);
  if (!review) { res.status(404); throw new Error('Review not found'); }
  const actor = await User.findById(req.user.id);
  const isOwner = review.user.toString() === req.user.id;
  if (!isOwner && actor?.role !== 'admin') { res.status(403); throw new Error('Not allowed to delete this review'); }
  const productId = review.product;
  await review.deleteOne();
  await refreshProductRating(productId);
  res.json({ message: 'Review deleted' });
});

const getAdminReviews = asyncHandler(async (req, res) => {
  const q = req.query.q?.trim();
  const reviews = await Review.find().populate('user', 'name email').populate('product', 'name slug').sort({ createdAt: -1 }).limit(200);
  const filtered = q ? reviews.filter((r) => [r.title, r.comment, r.user?.name, r.user?.email, r.product?.name].some((v) => v?.toLowerCase().includes(q.toLowerCase()))) : reviews;
  res.json({ reviews: filtered });
});

module.exports = { getProductReviews, createReview, updateReview, deleteReview, getAdminReviews };
