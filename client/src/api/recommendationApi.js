import axiosClient from './axiosClient';

export const getSimilarProducts = (productId) =>
  axiosClient.get(`/recommendations/similar/${productId}`).then((r) => r.data);

export const getFrequentlyBoughtTogether = (productId) =>
  axiosClient.get(`/recommendations/frequently-bought/${productId}`).then((r) => r.data);

export const getForYouRecommendations = () =>
  axiosClient.get('/recommendations/for-you').then((r) => r.data);
