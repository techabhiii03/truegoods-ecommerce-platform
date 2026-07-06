const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// Must run AFTER `protect` middleware, since it relies on req.user.id
const requireAdmin = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user || user.role !== 'admin') {
    res.status(403);
    throw new Error('Admin access required');
  }

  next();
});

module.exports = { requireAdmin };
