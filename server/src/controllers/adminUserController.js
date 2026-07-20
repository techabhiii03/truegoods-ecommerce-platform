const User = require('../models/User');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');

const getUsers = asyncHandler(async (req, res) => {
  const { q = '', role = '', page = 1, limit = 20 } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (q) filter.$or = [
    { name: { $regex: q, $options: 'i' } },
    { email: { $regex: q, $options: 'i' } },
  ];
  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.min(Number(limit), 100);
  const skip = (pageNum - 1) * limitNum;
  const [users, totalResults] = await Promise.all([
    User.find(filter).select('name email role isBlocked createdAt').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    User.countDocuments(filter),
  ]);
  const ids = users.map((u) => u._id);
  const orderStats = await Order.aggregate([
    { $match: { user: { $in: ids } } },
    { $group: { _id: '$user', orders: { $sum: 1 }, spent: { $sum: '$total' } } },
  ]);
  const statsMap = new Map(orderStats.map((s) => [String(s._id), s]));
  res.json({
    users: users.map((u) => ({ ...u.toObject(), orderCount: statsMap.get(String(u._id))?.orders || 0, totalSpent: statsMap.get(String(u._id))?.spent || 0 })),
    page: pageNum,
    totalPages: Math.ceil(totalResults / limitNum),
    totalResults,
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const { role, isBlocked } = req.body;
  if (String(req.params.id) === String(req.user.id) && (role === 'customer' || isBlocked === true)) {
    res.status(400);
    throw new Error('You cannot demote or block your own admin account');
  }
  const updates = {};
  if (role !== undefined) {
    if (!['customer', 'admin'].includes(role)) {
      res.status(400);
      throw new Error('Invalid role');
    }
    updates.role = role;
  }
  if (isBlocked !== undefined) updates.isBlocked = Boolean(isBlocked);
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('name email role isBlocked createdAt');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json({ user });
});

module.exports = { getUsers, updateUser };
