require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');
const { products } = require('../data/catalogData');

const run = async () => {
  await connectDB();

  const operations = products.map((product) => ({
    updateOne: {
      filter: { $or: [{ sku: product.sku }, { slug: product.slug }] },
      update: {
        $set: {
          images: product.images,
          slug: product.slug,
        },
      },
      upsert: false,
    },
  }));

  const result = await Product.bulkWrite(operations, { ordered: false });

  const staleResult = await Product.updateMany(
    { images: { $elemMatch: { $regex: 'loremflick(?:er|r)', $options: 'i' } } },
    { $set: { images: ['/products/fallback-product.svg'] } }
  );

  console.log(`Image migration finished.`);
  console.log(`Matched catalog products: ${result.matchedCount || 0}`);
  console.log(`Updated catalog products: ${result.modifiedCount || 0}`);
  console.log(`Remaining stale products moved to fallback: ${staleResult.modifiedCount || 0}`);

  await mongoose.connection.close();
};

run().catch(async (error) => {
  console.error('Image migration failed:', error.message);
  if (mongoose.connection.readyState !== 0) await mongoose.connection.close();
  process.exit(1);
});
