const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// @route POST /api/auth/register
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide name, email, and password');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(409);
    throw new Error('An account with this email already exists');
  }

  const user = await User.create({ name, email, password });

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

  res.status(201).json({
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    accessToken,
  });
});

// @route POST /api/auth/login
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  // password field has select:false in schema, so explicitly request it
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

  res.status(200).json({
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    accessToken,
  });
});

// @route POST /api/auth/refresh
const refreshAccessToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    res.status(401);
    throw new Error('No refresh token provided');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    res.status(401);
    throw new Error('Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    res.status(401);
    throw new Error('User no longer exists');
  }

  const accessToken = generateAccessToken(user._id);
  res.status(200).json({ accessToken });
});

// @route POST /api/auth/logout
const logoutUser = asyncHandler(async (req, res) => {
  res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
  res.status(200).json({ message: 'Logged out successfully' });
});

// @route GET /api/auth/me
const getCurrentUser = asyncHandler(async (req, res) => {
  // req.user is attached by authMiddleware
  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.status(200).json({
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getCurrentUser,
};
