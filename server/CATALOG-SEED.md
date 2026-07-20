# TrueGoods catalog seed

The catalog seed creates **120 products across 10 categories**. Each product includes:

- a detailed description
- price and compare-at price
- four gallery image URLs
- brand and category tags
- realistic stock, ratings and review counts
- SKU and product specifications

## Validate without connecting to MongoDB

```bash
npm run seed:check
```

## Replace the existing catalog

```bash
npm run seed
```

This removes existing products and categories before inserting the curated catalog.

## Keep existing catalog and upsert the new products

```bash
npm run seed:append
```

Catalog images use local SVG assets stored under `client/public/products/`, so they do not depend on third-party image URLs.
