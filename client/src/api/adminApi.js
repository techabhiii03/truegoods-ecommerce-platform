import axiosClient from './axiosClient';

// --- Products (admin) ---
export const createProduct = (payload) => axiosClient.post('/products', payload).then((r) => r.data);

export const updateProduct = (id, payload) =>
  axiosClient.put(`/products/${id}`, payload).then((r) => r.data);

export const updateProductStock = (id, stock) =>
  axiosClient.patch(`/products/${id}/stock`, { stock }).then((r) => r.data);

export const deactivateProduct = (id) => axiosClient.delete(`/products/${id}`).then((r) => r.data);

// --- Categories (admin) ---
export const createCategory = (payload) => axiosClient.post('/categories', payload).then((r) => r.data);

// --- Orders (admin) ---
export const getAllOrdersAdmin = (params = {}) =>
  axiosClient.get('/orders/admin/all', { params }).then((r) => r.data);

export const updateOrderStatusAdmin = (id, orderStatus) =>
  axiosClient.patch(`/orders/admin/${id}/status`, { orderStatus }).then((r) => r.data);

export const getAdminDashboard = () =>
  axiosClient.get('/orders/admin/dashboard').then((r) => r.data);

export const getAdminProducts = (params = {}) =>
  axiosClient.get('/products/admin/all', { params }).then((r) => r.data);
export const reactivateProduct = (id) =>
  axiosClient.patch(`/products/${id}/reactivate`).then((r) => r.data);
export const updateCategory = (id, payload) =>
  axiosClient.put(`/categories/${id}`, payload).then((r) => r.data);
export const deleteCategory = (id) =>
  axiosClient.delete(`/categories/${id}`).then((r) => r.data);
export const getAdminUsers = (params = {}) =>
  axiosClient.get('/admin/users', { params }).then((r) => r.data);
export const updateAdminUser = (id, payload) =>
  axiosClient.patch(`/admin/users/${id}`, payload).then((r) => r.data);
