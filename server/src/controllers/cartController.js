const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');

// Helper: find or create a cart for the current user
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};

// @route GET /api/cart
// @access Auth
const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id }).populate(
    'items.product',
    'name slug price images stock isActive'
  );

  res.status(200).json({ cart: cart || { user: req.user.id, items: [] } });
});

// @route POST /api/cart/items
// @body { productId, quantity }
// @access Auth
const addItemToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    res.status(400);
    throw new Error('productId is required');
  }

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (product.stock < quantity) {
    res.status(400);
    throw new Error(`Only ${product.stock} units of "${product.name}" available`);
  }

  const cart = await getOrCreateCart(req.user.id);

  const existingItem = cart.items.find((item) => item.product.toString() === productId);

  if (existingItem) {
    existingItem.quantity += Number(quantity);
  } else {
    cart.items.push({ product: productId, quantity, priceAtAdd: product.price });
  }

  await cart.save();
  const populated = await cart.populate('items.product', 'name slug price images stock isActive');

  res.status(200).json({ cart: populated });
});

// @route PATCH /api/cart/items/:productId
// @body { quantity }
// @access Auth
const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const { productId } = req.params;

  if (!quantity || quantity < 1) {
    res.status(400);
    throw new Error('A valid quantity (>= 1) is required');
  }

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }

  const item = cart.items.find((i) => i.product.toString() === productId);
  if (!item) {
    res.status(404);
    throw new Error('Item not found in cart');
  }

  item.quantity = quantity;
  await cart.save();
  const populated = await cart.populate('items.product', 'name slug price images stock isActive');

  res.status(200).json({ cart: populated });
});

// @route DELETE /api/cart/items/:productId
// @access Auth
const removeCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }

  cart.items = cart.items.filter((i) => i.product.toString() !== productId);
  await cart.save();
  const populated = await cart.populate('items.product', 'name slug price images stock isActive');

  res.status(200).json({ cart: populated });
});

// @route DELETE /api/cart
// @desc  Clear the entire cart (used after successful checkout)
// @access Auth
const clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user.id }, { items: [] });
  res.status(200).json({ message: 'Cart cleared' });
});

module.exports = { getCart, addItemToCart, updateCartItem, removeCartItem, clearCart, getOrCreateCart };
