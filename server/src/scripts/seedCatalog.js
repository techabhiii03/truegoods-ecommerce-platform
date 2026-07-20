require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { categoryDefinitions, products } = require('../data/catalogData');

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const append = args.has('--append');

const seed = async () => {
  if (dryRun) {
    const uniqueSkus = new Set(products.map((product) => product.sku));
    const uniqueSlugs = new Set(products.map((product) => product.slug));
    console.log(`Catalog validation complete: ${products.length} products across ${categoryDefinitions.length} categories.`);
    console.log(`Unique SKUs: ${uniqueSkus.size}; unique slugs: ${uniqueSlugs.size}.`);
    process.exit(uniqueSkus.size === products.length && uniqueSlugs.size === products.length ? 0 : 1);
  }

  await connectDB();

  if (!append) {
    await Product.deleteMany({});
    await Category.deleteMany({});
    console.log('Existing products and categories removed.');
  }

  const categoryMap = {};
  for (const definition of categoryDefinitions) {
    const category = await Category.findOneAndUpdate(
      { slug: definition.slug },
      definition,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    categoryMap[definition.slug] = category._id;
  }

  const operations = products.map(({ categorySlug, ...product }) => ({
    updateOne: {
      filter: { sku: product.sku },
      update: { $set: { ...product, category: categoryMap[categorySlug] } },
      upsert: true,
    },
  }));

  const result = await Product.bulkWrite(operations, { ordered: false });
  console.log(`Catalog ready: ${products.length} products across ${categoryDefinitions.length} categories.`);
  console.log(`Inserted: ${result.upsertedCount || 0}; updated: ${result.modifiedCount || 0}; matched: ${result.matchedCount || 0}.`);
  await mongoose.connection.close();
};

seed().catch(async (error) => {
  console.error('Catalog seed failed:', error.message);
  if (mongoose.connection.readyState !== 0) await mongoose.connection.close();
  process.exit(1);
});
