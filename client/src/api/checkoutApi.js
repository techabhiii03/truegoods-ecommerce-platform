import axiosClient from './axiosClient';

export const createRazorpayOrder = () => axiosClient.post('/checkout/create-order').then((r) => r.data);

export const verifyPayment = (payload) =>
  axiosClient.post('/checkout/verify-payment', payload).then((r) => r.data);

export const getMyOrders = () => axiosClient.get('/orders').then((r) => r.data);

export const getOrderById = (id) => axiosClient.get(`/orders/${id}`).then((r) => r.data);
