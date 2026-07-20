const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const slugify = require('../utils/slugify');

// @route GET /api/categories
// @access Public
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.aggregate([
    { $sort: { displayOrder: 1, name: 1 } },
    {
      $lookup: {
        from: 'products',
        let: { categoryId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$category', '$$categoryId'] },
              isActive: true,
            },
          },
          { $sort: { ratingAvg: -1, createdAt: -1 } },
          { $project: { images: 1 } },
        ],
        as: 'categoryProducts',
      },
    },
    {
      $addFields: {
        productCount: { $size: '$categoryProducts' },
        sampleImage: {
          $let: {
            vars: { firstProduct: { $arrayElemAt: ['$categoryProducts', 0] } },
            in: { $arrayElemAt: ['$$firstProduct.images', 0] },
          },
        },
      },
    },
    { $project: { categoryProducts: 0 } },
  ]);

  res.status(200).json({ categories });
});

// @route POST /api/categories
// @access Admin
const createCategory = asyncHandler(async (req, res) => {
  const { name, description = '', coverImage = '', featured = true, displayOrder = 0 } = req.body;

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

  const category = await Category.create({
    name,
    slug,
    description,
    coverImage,
    featured: Boolean(featured),
    displayOrder: Number(displayOrder) || 0,
  });

  res.status(201).json({ category });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  if (req.body.name && req.body.name.trim() !== category.name) {
    const nextSlug = slugify(req.body.name);
    const existing = await Category.findOne({ slug: nextSlug, _id: { $ne: category._id } });
    if (existing) {
      res.status(409);
      throw new Error('A category with this name already exists');
    }
    category.name = req.body.name.trim();
    category.slug = nextSlug;
  }

  if (req.body.description !== undefined) category.description = req.body.description;
  if (req.body.coverImage !== undefined) category.coverImage = req.body.coverImage;
  if (req.body.featured !== undefined) category.featured = Boolean(req.body.featured);
  if (req.body.displayOrder !== undefined) category.displayOrder = Math.max(Number(req.body.displayOrder) || 0, 0);

  await category.save();
  res.json({ category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error('Invalid category ID');
  }

  const count = await Product.countDocuments({ category: req.params.id, isActive: true });
  if (count > 0) {
    res.status(400);
    throw new Error(`Cannot delete category with ${count} active products`);
  }

  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  res.json({ message: 'Category deleted' });
});

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
