import axiosClient from './axiosClient';

// --- Products (admin) ---
export const createProduct = (payload) => axiosClient.post('/products', payload).then((r) => r.data);

export const updateProduct = (id, payload) =>
  axiosClient.put(`/products/${id}`, payload).then((r) => r.data);

export const updateProductStock = (id, stock) =>
  axiosClient.patch(`/products/${id}/stock`, { stock }).then((r) => r.data);

export const deactivateProduct = (id) => axiosClient.delete(`/products/${id}`).then((r) => r.data);

// --- Categories (admin) ---
export const createCategory = (name) => axiosClient.post('/categories', { name }).then((r) => r.data);

// --- Orders (admin) ---
export const getAllOrdersAdmin = (params = {}) =>
  axiosClient.get('/orders/admin/all', { params }).then((r) => r.data);

export const updateOrderStatusAdmin = (id, orderStatus) =>
  axiosClient.patch(`/orders/admin/${id}/status`, { orderStatus }).then((r) => r.data);
