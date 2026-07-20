import axiosClient from './axiosClient';
export const getWishlist = () => axiosClient.get('/auth/wishlist').then((r) => r.data);
export const toggleWishlist = (productId) => axiosClient.patch(`/auth/wishlist/${productId}`).then((r) => r.data);
