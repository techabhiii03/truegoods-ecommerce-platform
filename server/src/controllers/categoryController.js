const Category = require('../models/Category');
const asyncHandler = require('../utils/asyncHandler');
const slugify = require('../utils/slugify');

// @route GET /api/categories
// @access Public
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.status(200).json({ categories });
});

// @route POST /api/categories
// @access Admin
const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('Category name is required');
  }

  const slug = slugify(name);

  const existing = await Category.findOne({ slug });
  if (existing) {
    res.status(409);
    throw new Error('A category with this name already exists');
  }

  const category = await Category.create({ name, slug, description });
  res.status(201).json({ category });
});

module.exports = { getCategories, createCategory };
