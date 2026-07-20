const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
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


// @route GET /api/orders/admin/dashboard
// @desc  Store-wide analytics for the admin dashboard
// @access Admin
const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    totalOrders,
    currentMonthOrders,
    previousMonthOrders,
    customers,
    products,
    lowStockProducts,
    recentOrders,
    revenueRows,
    monthlyRows,
    statusRows,
    topProductRows,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: monthStart } }),
    Order.countDocuments({ createdAt: { $gte: previousMonthStart, $lt: monthStart } }),
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments({ isActive: true }),
    Product.find({ isActive: true, stock: { $lte: 10 } })
      .select('name slug stock images price')
      .sort({ stock: 1 })
      .limit(6),
    Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(6),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, revenue: { $sum: '$total' }, averageOrderValue: { $avg: '$total' } } },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
    Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          units: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { units: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const monthLabels = [];
  const monthMap = new Map(monthlyRows.map((row) => [`${row._id.year}-${row._id.month}`, row]));
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const row = monthMap.get(key);
    monthLabels.push({
      label: date.toLocaleString('en-IN', { month: 'short' }),
      revenue: row?.revenue || 0,
      orders: row?.orders || 0,
    });
  }

  const statusBreakdown = { processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
  statusRows.forEach((row) => {
    statusBreakdown[row._id] = row.count;
  });

  const currentRevenueRows = await Order.aggregate([
    { $match: { paymentStatus: 'paid', createdAt: { $gte: monthStart } } },
    { $group: { _id: null, revenue: { $sum: '$total' } } },
  ]);
  const previousRevenueRows = await Order.aggregate([
    { $match: { paymentStatus: 'paid', createdAt: { $gte: previousMonthStart, $lt: monthStart } } },
    { $group: { _id: null, revenue: { $sum: '$total' } } },
  ]);

  const percentChange = (current, previous) =>
    previous > 0 ? Number((((current - previous) / previous) * 100).toFixed(1)) : current > 0 ? 100 : 0;

  const totalRevenue = revenueRows[0]?.revenue || 0;
  const currentRevenue = currentRevenueRows[0]?.revenue || 0;
  const previousRevenue = previousRevenueRows[0]?.revenue || 0;

  res.status(200).json({
    summary: {
      revenue: totalRevenue,
      orders: totalOrders,
      customers,
      products,
      averageOrderValue: revenueRows[0]?.averageOrderValue || 0,
      lowStockCount: lowStockProducts.length,
      revenueChange: percentChange(currentRevenue, previousRevenue),
      orderChange: percentChange(currentMonthOrders, previousMonthOrders),
    },
    monthlyPerformance: monthLabels,
    statusBreakdown,
    topProducts: topProductRows,
    lowStockProducts,
    recentOrders,
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

module.exports = { getMyOrders, getOrderById, getAllOrders, getDashboardAnalytics, updateOrderStatus };
