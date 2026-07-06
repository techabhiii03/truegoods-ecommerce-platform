import axiosClient from './axiosClient';

// params: { q, category, minPrice, maxPrice, sort, page, limit }
export const getProducts = (params = {}) => axiosClient.get('/products', { params }).then((r) => r.data);

export const getProductBySlug = (slug) => axiosClient.get(`/products/${slug}`).then((r) => r.data);

export const getCategories = () => axiosClient.get('/categories').then((r) => r.data);
