// src/api/axios.js
import axios from 'axios';
import { API_BASE_URL } from './config';

// 🚀 FIXED: Dynamic Environment Hostname Resolver 
// Detects if you are accessing via a mobile device/hotspot network or your local laptop browser.
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Automatically inject the token into every request header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
