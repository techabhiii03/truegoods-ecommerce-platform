const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');

// @route GET /api/orders
// @desc  Current user's order history
// @access Auth
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.status(200).json({ orders });
});

// @route GET /api/orders/:id
// @access Auth (must own the order)
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }

  res.status(200).json({ order });
});

// @route GET /api/admin/orders
// @access Admin
const getAllOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status) filter.orderStatus = status;

  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.min(Number(limit), 100);
  const skip = (pageNum - 1) * limitNum;

  const [orders, totalResults] = await Promise.all([
    Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    orders,
    page: pageNum,
    totalPages: Math.ceil(totalResults / limitNum),
    totalResults,
  });
});

// @route PATCH /api/admin/orders/:id/status
// @body { orderStatus }
// @access Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus } = req.body;
  const validStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];

  if (!validStatuses.includes(orderStatus)) {
    res.status(400);
    throw new Error(`orderStatus must be one of: ${validStatuses.join(', ')}`);
  }

  const order = await Order.findByIdAndUpdate(req.params.id, { orderStatus }, { new: true });

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  res.status(200).json({ order });
});

module.exports = { getMyOrders, getOrderById, getAllOrders, updateOrderStatus };
