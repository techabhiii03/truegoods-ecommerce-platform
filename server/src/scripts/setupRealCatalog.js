require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Category = require('../models/Category');
const Product = require('../models/Product');

const API_URL = 'https://dummyjson.com/products?limit=0';
const CLIENT_PUBLIC = path.resolve(__dirname, '../../../client/public');
const IMAGE_ROOT = path.join(CLIENT_PUBLIC, 'products', 'catalog');

const slugify = (value) => String(value)
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

const titleCase = (value) => String(value)
  .split('-')
  .filter(Boolean)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');

const ensureDirectory = (directory) => {
  fs.mkdirSync(directory, { recursive: true });
};

const extensionFrom = (url, contentType) => {
  const pathname = new URL(url).pathname;
  const fromPath = path.extname(pathname).toLowerCase();
  if (/^\.(png|jpe?g|webp|avif)$/.test(fromPath)) return fromPath === '.jpeg' ? '.jpg' : fromPath;
  if (contentType?.includes('png')) return '.png';
  if (contentType?.includes('webp')) return '.webp';
  if (contentType?.includes('avif')) return '.avif';
  return '.jpg';
};

const fetchJson = async (url) => {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'TrueGoods-Catalog-Setup/1.0' },
  });
  if (!response.ok) throw new Error(`Catalog API returned HTTP ${response.status}`);
  return response.json();
};

const downloadImage = async (url, destinationWithoutExtension) => {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'TrueGoods-Catalog-Setup/1.0' },
  });
  if (!response.ok) throw new Error(`Image download failed (${response.status}): ${url}`);

  const extension = extensionFrom(url, response.headers.get('content-type'));
  const destination = `${destinationWithoutExtension}${extension}`;
  const bytes = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(destination, bytes);
  return destination;
};

const toInr = (usd) => {
  const raw = Number(usd || 0) * 83;
  return Math.max(99, Math.round(raw / 10) * 10);
};

const downloadProductImages = async (source, categorySlug, productSlug) => {
  const directory = path.join(IMAGE_ROOT, categorySlug, productSlug);
  ensureDirectory(directory);

  const candidates = [...new Set([source.thumbnail, ...(source.images || [])].filter(Boolean))].slice(0, 5);
  const localPaths = [];

  for (let index = 0; index < candidates.length; index += 1) {
    const targetBase = path.join(directory, String(index + 1));
    try {
      const savedPath = await downloadImage(candidates[index], targetBase);
      const relative = path.relative(CLIENT_PUBLIC, savedPath).split(path.sep).join('/');
      localPaths.push(`/${relative}`);
      process.stdout.write('.');
    } catch (error) {
      console.warn(`\nSkipped one image for ${source.title}: ${error.message}`);
    }
  }

  return localPaths;
};

const main = async () => {
  console.log('Fetching the real-photo product catalog...');
  const payload = await fetchJson(API_URL);
  const sourceProducts = Array.isArray(payload.products) ? payload.products : [];
  if (!sourceProducts.length) throw new Error('The catalog API returned no products.');

  ensureDirectory(IMAGE_ROOT);
  const prepared = [];

  console.log(`Downloading photographs for ${sourceProducts.length} products.`);
  for (let index = 0; index < sourceProducts.length; index += 1) {
    const source = sourceProducts[index];
    const categorySlug = slugify(source.category || 'general');
    const productSlug = `${slugify(source.title)}-${source.id}`;
    const images = await downloadProductImages(source, categorySlug, productSlug);

    if (!images.length) {
      console.warn(`\nNo usable photos downloaded for ${source.title}; product skipped.`);
      continue;
    }

    const price = toInr(source.price);
    const discount = Math.max(0, Math.min(70, Number(source.discountPercentage || 0)));
    const compareAtPrice = discount > 0
      ? Math.round((price / (1 - discount / 100)) / 10) * 10
      : Math.round(price * 1.15 / 10) * 10;

    prepared.push({
      categorySlug,
      categoryName: titleCase(categorySlug),
      product: {
        name: source.title,
        slug: productSlug,
        description: source.description || `${source.title} selected for the TrueGoods catalog.`,
        price,
        compareAtPrice: Math.max(compareAtPrice, price),
        tags: [...new Set([
          source.brand,
          source.category,
          ...(source.tags || []),
        ].filter(Boolean).map((item) => String(item).toLowerCase()))],
        images,
        stock: Math.max(0, Number(source.stock || 0)),
        sku: source.sku || `TG-REAL-${String(source.id).padStart(4, '0')}`,
        attributes: {
          Brand: source.brand || 'TrueGoods Select',
          Availability: source.availabilityStatus || (source.stock > 0 ? 'In Stock' : 'Out of Stock'),
          Warranty: source.warrantyInformation || 'Standard warranty',
          Shipping: source.shippingInformation || 'Standard delivery',
          ReturnPolicy: source.returnPolicy || '7-day returns',
          Weight: source.weight ? `${source.weight}` : 'Not specified',
        },
        ratingAvg: Math.max(0, Math.min(5, Number(source.rating || 0))),
        ratingCount: Array.isArray(source.reviews) ? source.reviews.length : 0,
        isActive: true,
      },
    });

    process.stdout.write(` ${index + 1}/${sourceProducts.length}\r`);
  }

  console.log(`\nDownloaded a usable local catalog of ${prepared.length} products.`);
  if (!prepared.length) throw new Error('No products could be prepared. Check your internet connection and retry.');

  await connectDB();
  await Product.deleteMany({});
  await Category.deleteMany({});

  const categoryMap = new Map();
  for (const item of prepared) {
    if (categoryMap.has(item.categorySlug)) continue;
    const category = await Category.create({
      name: item.categoryName,
      slug: item.categorySlug,
      description: `${item.categoryName} products with locally stored catalog photography.`,
    });
    categoryMap.set(item.categorySlug, category._id);
  }

  const operations = prepared.map(({ categorySlug, product }) => ({
    updateOne: {
      filter: { sku: product.sku },
      update: { $set: { ...product, category: categoryMap.get(categorySlug) } },
      upsert: true,
    },
  }));

  await Product.bulkWrite(operations, { ordered: false });
  await mongoose.connection.close();

  console.log('\nReal-photo catalog setup completed.');
  console.log(`Products: ${prepared.length}`);
  console.log(`Categories: ${categoryMap.size}`);
  console.log('Images: client/public/products/catalog/');
};

main().catch(async (error) => {
  console.error('\nCatalog setup failed:', error.message);
  if (error.cause?.message) console.error('Cause:', error.cause.message);
  console.error('Make sure your internet connection and MongoDB connection are active, then run the command again.');
  if (mongoose.connection.readyState !== 0) await mongoose.connection.close();
  process.exit(1);
});
