const Product = require('../models/Product');
const Category = require('../models/Category');
const asyncHandler = require('../utils/asyncHandler');
const slugify = require('../utils/slugify');

// @route GET /api/products
// @desc  List products with search, filter, sort, pagination
// @query q, category, minPrice, maxPrice, sort, page, limit
// @access Public
const getProducts = asyncHandler(async (req, res) => {
  const { q, category, minPrice, maxPrice, sort, page = 1, limit = 20 } = req.query;

  const filter = { isActive: true };

  if (q) {
    filter.$text = { $search: q };
  }

  if (category) {
    // accept either a category ObjectId or a category slug
    const categoryDoc = category.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: category }
      : { slug: category };
    const foundCategory = await Category.findOne(categoryDoc);
    if (foundCategory) {
      filter.category = foundCategory._id;
    } else {
      // category filter given but doesn't exist -> no results, not an error
      return res.status(200).json({ products: [], page: Number(page), totalPages: 0, totalResults: 0 });
    }
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const sortOptions = {
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    newest: { createdAt: -1 },
    rating: { ratingAvg: -1 },
  };
  const sortBy = sortOptions[sort] || { createdAt: -1 };

  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.min(Number(limit), 100); // cap to prevent abuse
  const skip = (pageNum - 1) * limitNum;

  const [products, totalResults] = await Promise.all([
    Product.find(filter).populate('category', 'name slug').sort(sortBy).skip(skip).limit(limitNum),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({
    products,
    page: pageNum,
    totalPages: Math.ceil(totalResults / limitNum),
    totalResults,
  });
});


const getAdminProducts = asyncHandler(async (req, res) => {
  const { q = '', status = '', category = '', page = 1, limit = 50 } = req.query;
  const filter = {};
  if (q) filter.$or = [{ name: { $regex: q, $options: 'i' } }, { sku: { $regex: q, $options: 'i' } }];
  if (status === 'active') filter.isActive = true;
  if (status === 'inactive') filter.isActive = false;
  if (category) filter.category = category;
  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.min(Number(limit), 100);
  const skip = (pageNum - 1) * limitNum;
  const [products, totalResults] = await Promise.all([
    Product.find(filter).populate('category', 'name slug').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Product.countDocuments(filter),
  ]);
  res.json({ products, page: pageNum, totalPages: Math.ceil(totalResults / limitNum), totalResults });
});

const reactivateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
  if (!product) { res.status(404); throw new Error('Product not found'); }
  res.json({ message: 'Product reactivated', product });
});

// @route GET /api/products/:slug
// @access Public
const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true }).populate(
    'category',
    'name slug'
  );

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  res.status(200).json({ product });
});

// @route POST /api/products
// @access Admin
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, category, tags, images, stock, sku, attributes, compareAtPrice } =
    req.body;

  if (!name || !description || price === undefined || !category) {
    res.status(400);
    throw new Error('name, description, price, and category are required');
  }

  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    res.status(400);
    throw new Error('Invalid category ID');
  }

  let slug = slugify(name);
  // ensure slug uniqueness by appending a short suffix if it already exists
  const existingSlug = await Product.findOne({ slug });
  if (existingSlug) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const product = await Product.create({
    name,
    slug,
    description,
    price,
    compareAtPrice,
    category,
    tags,
    images,
    stock,
    sku,
    attributes,
  });

  res.status(201).json({ product });
});

// @route PUT /api/products/:id
// @access Admin
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const updatableFields = [
    'name',
    'description',
    'price',
    'compareAtPrice',
    'category',
    'tags',
    'images',
    'stock',
    'sku',
    'attributes',
    'isActive',
  ];

  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  });

  // regenerate slug if name changed
  if (req.body.name && req.body.name !== product.name) {
    product.slug = slugify(req.body.name);
  }

  const updated = await product.save();
  res.status(200).json({ product: updated });
});

// @route PATCH /api/products/:id/stock
// @desc  Quick stock-only update, handy for inventory management UI
// @access Admin
const updateStock = asyncHandler(async (req, res) => {
  const { stock } = req.body;

  if (stock === undefined || stock < 0) {
    res.status(400);
    throw new Error('A valid non-negative stock value is required');
  }

  const product = await Product.findByIdAndUpdate(req.params.id, { stock }, { new: true });

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  res.status(200).json({ product });
});

// @route DELETE /api/products/:id
// @desc  Soft delete (isActive = false) rather than removing the document,
//        so historical orders referencing this product still resolve correctly
// @access Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  res.status(200).json({ message: 'Product deactivated', product });
});

module.exports = {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  updateStock,
  deleteProduct,
  getAdminProducts,
  reactivateProduct,
};
