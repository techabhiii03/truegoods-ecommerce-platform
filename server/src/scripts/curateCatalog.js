require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');
const Category = require('../models/Category');

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');

// Premium lifestyle mix. The limits keep the store balanced rather than
// allowing one imported category to dominate the catalogue.
const CATEGORY_PLAN = [
  { slugs: ['smartphones'], label: 'Smartphones', limit: 8 },
  { slugs: ['laptops'], label: 'Laptops', limit: 8 },
  { slugs: ['tablets'], label: 'Tablets', limit: 5 },
  { slugs: ['mobile-accessories'], label: 'Mobile Accessories', limit: 8 },
  { slugs: ['mens-watches', 'womens-watches'], label: 'Watches', limit: 8 },
  { slugs: ['mens-shoes', 'womens-shoes'], label: 'Footwear', limit: 10 },
  { slugs: ['womens-bags'], label: 'Bags', limit: 6 },
  { slugs: ['sunglasses'], label: 'Sunglasses', limit: 5 },
  { slugs: ['furniture', 'home-decoration'], label: 'Home', limit: 8 },
  { slugs: ['kitchen-accessories'], label: 'Kitchen', limit: 5 },
  { slugs: ['sports-accessories'], label: 'Fitness', limit: 6 },
  { slugs: ['beauty', 'fragrances'], label: 'Beauty', limit: 5 },
];

const BLOCKED_TERMS = [
  'water', 'ice cream', 'milk', 'eggs', 'rice', 'flour', 'oil', 'meat',
  'cat food', 'dog food', 'motorcycle', 'vehicle', 'car', 'tractor',
];

const normalized = (value) => String(value || '').toLowerCase().trim();

const productQualityScore = (product) => {
  const title = normalized(product.name);
  const description = normalized(product.description);
  const images = Array.isArray(product.images) ? product.images.filter(Boolean) : [];

  let score = 0;
  score += Math.min(Number(product.ratingAvg || 0), 5) * 20;
  score += Math.min(Number(product.ratingCount || 0), 500) / 20;
  score += images.length * 8;
  score += description.length >= 90 ? 12 : description.length >= 45 ? 6 : 0;
  score += Number(product.stock || 0) > 0 ? 8 : -30;
  score += Number(product.price || 0) >= 500 ? 5 : 0;
  score -= BLOCKED_TERMS.some((term) => title.includes(term)) ? 1000 : 0;
  return score;
};

const run = async () => {
  await connectDB();

  const categories = await Category.find({}).lean();
  const categoryById = new Map(categories.map((category) => [String(category._id), category]));
  const products = await Product.find({ isActive: { $ne: false } }).lean();

  const selectedIds = new Set();
  const summary = [];

  for (const plan of CATEGORY_PLAN) {
    const candidates = products
      .filter((product) => {
        const category = categoryById.get(String(product.category));
        return category && plan.slugs.includes(normalized(category.slug));
      })
      .filter((product) => !BLOCKED_TERMS.some((term) => normalized(product.name).includes(term)))
      .sort((a, b) => productQualityScore(b) - productQualityScore(a))
      .slice(0, plan.limit);

    candidates.forEach((product) => selectedIds.add(String(product._id)));
    summary.push({ category: plan.label, selected: candidates.length, target: plan.limit });
  }

  const selectedProducts = products.filter((product) => selectedIds.has(String(product._id)));
  const removableProducts = products.filter((product) => !selectedIds.has(String(product._id)));
  const selectedCategoryIds = new Set(selectedProducts.map((product) => String(product.category)));
  const removableCategoryIds = categories
    .filter((category) => !selectedCategoryIds.has(String(category._id)))
    .map((category) => category._id);

  console.log('\nTrueGoods premium catalogue plan');
  console.table(summary);
  console.log(`Current active products: ${products.length}`);
  console.log(`Products to keep: ${selectedProducts.length}`);
  console.log(`Products to remove: ${removableProducts.length}`);
  console.log(`Unused categories to remove: ${removableCategoryIds.length}`);

  if (selectedProducts.length < 40) {
    throw new Error(
      'Fewer than 40 suitable products were found. Run npm run setup:catalog first, then try again.'
    );
  }

  if (dryRun) {
    console.log('\nAudit only: no database records were changed.');
    await mongoose.connection.close();
    return;
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      if (removableProducts.length) {
        await Product.deleteMany(
          { _id: { $in: removableProducts.map((product) => product._id) } },
          { session }
        );
      }
      if (removableCategoryIds.length) {
        await Category.deleteMany({ _id: { $in: removableCategoryIds } }, { session });
      }
    });
  } finally {
    await session.endSession();
  }

  console.log(`\nCatalogue curated successfully. ${selectedProducts.length} premium products remain.`);
  console.log('Existing local photographs and product descriptions were preserved.');
  await mongoose.connection.close();
};

run().catch(async (error) => {
  console.error(`Catalogue curation failed: ${error.message}`);
  if (mongoose.connection.readyState !== 0) await mongoose.connection.close();
  process.exit(1);
});
