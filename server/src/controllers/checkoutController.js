const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');

// Server-side authoritative price calculation — never trust cart totals sent from the client
const calculateCartTotals = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).populate('items.product');

  if (!cart || cart.items.length === 0) {
    const err = new Error('Cart is empty');
    err.statusCode = 400;
    throw err;
  }

  let subtotal = 0;
  const validatedItems = [];

  for (const item of cart.items) {
    const product = item.product;

    if (!product || !product.isActive) {
      const err = new Error('A product in your cart is no longer available');
      err.statusCode = 400;
      throw err;
    }

    if (product.stock < item.quantity) {
      const err = new Error(`Only ${product.stock} units of "${product.name}" available`);
      err.statusCode = 400;
      throw err;
    }

    const lineTotal = product.price * item.quantity; // always current price, not priceAtAdd
    subtotal += lineTotal;

    validatedItems.push({
      product: product._id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
    });
  }

  const tax = Math.round(subtotal * 0.08 * 100) / 100; // flat 8% placeholder — swap for real GST logic later
  const shippingCost = subtotal > 100 ? 0 : 9.99; // free shipping over 100, placeholder logic
  const total = Math.round((subtotal + tax + shippingCost) * 100) / 100;

  return { items: validatedItems, subtotal, tax, shippingCost, total };
};

// @route POST /api/checkout/create-order
// @desc  Creates a Razorpay Order from the current cart. The returned order id is what
//        the frontend passes to Razorpay Checkout to open the payment widget.
// @access Auth
const createOrder = asyncHandler(async (req, res) => {
  const { subtotal, tax, shippingCost, total } = await calculateCartTotals(req.user.id);

  // Razorpay expects amount in the smallest currency unit (paise for INR)
  const amountInPaise = Math.round(total * 100);

  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: `rcpt_${Date.now()}`,
    notes: { userId: req.user.id.toString() },
  });

  res.status(200).json({
    orderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID, // safe to expose, it's the public key
    subtotal,
    tax,
    shippingCost,
    total,
  });
});

// @route POST /api/checkout/verify-payment
// @desc  Called by the frontend after Razorpay Checkout completes. Verifies the payment
//        signature server-side, then creates the real Order, decrements stock, clears cart.
// @body  { razorpay_order_id, razorpay_payment_id, razorpay_signature }
// @access Auth
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400);
    throw new Error('Missing Razorpay payment verification fields');
  }

  // Recreate the expected signature and compare — this is what proves the payment is genuine
  // and wasn't tampered with in transit.
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    res.status(400);
    throw new Error('Payment verification failed — signature mismatch');
  }

  // Guard against duplicate calls creating duplicate orders
  const existingOrder = await Order.findOne({ paymentIntentId: razorpay_payment_id });
  if (existingOrder) {
    return res.status(200).json({ order: existingOrder, note: 'Order already exists' });
  }

  const { items, subtotal, tax, shippingCost, total } = await calculateCartTotals(req.user.id);

  const order = await Order.create({
    user: req.user.id,
    items,
    paymentIntentId: razorpay_payment_id, // reusing this field name from the schema for the Razorpay payment id
    paymentStatus: 'paid',
    orderStatus: 'processing',
    subtotal,
    tax,
    shippingCost,
    total,
  });

  await Promise.all(
    items.map((item) => Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } }))
  );

  await Cart.findOneAndUpdate({ user: req.user.id }, { items: [] });

  res.status(201).json({ order });
});

module.exports = { createOrder, verifyPayment, calculateCartTotals };
