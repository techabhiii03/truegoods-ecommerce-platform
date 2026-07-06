import axiosClient from './axiosClient';

export const registerUser = (payload) => axiosClient.post('/auth/register', payload).then((r) => r.data);

export const loginUser = (payload) => axiosClient.post('/auth/login', payload).then((r) => r.data);

export const logoutUser = () => axiosClient.post('/auth/logout').then((r) => r.data);

export const getCurrentUser = () => axiosClient.get('/auth/me').then((r) => r.data);
