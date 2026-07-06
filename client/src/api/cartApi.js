import axiosClient from './axiosClient';

export const getCart = () => axiosClient.get('/cart').then((r) => r.data);

export const addCartItem = (productId, quantity = 1) =>
  axiosClient.post('/cart/items', { productId, quantity }).then((r) => r.data);

export const updateCartItem = (productId, quantity) =>
  axiosClient.patch(`/cart/items/${productId}`, { quantity }).then((r) => r.data);

export const removeCartItem = (productId) =>
  axiosClient.delete(`/cart/items/${productId}`).then((r) => r.data);

export const clearCart = () => axiosClient.delete('/cart').then((r) => r.data);
