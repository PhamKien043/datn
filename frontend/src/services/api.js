// src/services/api.js
import axios from 'axios';
import { getUserFromStorage } from './authService';

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
});

api.interceptors.request.use(
    (config) => {
        const user = getUserFromStorage();
        if (user && user.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;