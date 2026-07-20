import axiosClient from './axiosClient';
export const getProductReviews = async (productId, page = 1) => (await axiosClient.get(`/reviews/product/${productId}`, { params: { page, limit: 20 } })).data;
export const createReview = async (productId, payload) => (await axiosClient.post(`/reviews/product/${productId}`, payload)).data;
export const updateReview = async (reviewId, payload) => (await axiosClient.put(`/reviews/${reviewId}`, payload)).data;
export const deleteReview = async (reviewId) => (await axiosClient.delete(`/reviews/${reviewId}`)).data;
export const getAdminReviews = async (q = '') => (await axiosClient.get('/reviews/admin/all', { params: { q } })).data;
