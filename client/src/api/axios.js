// src/api/axios.js
import axios from 'axios';

// 🚀 FIXED: Dynamic Environment Hostname Resolver 
// Detects if you are accessing via a mobile device/hotspot network or your local laptop browser.
const activeHostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

// Bulletproof fallback routing configuration
const computedBaseURL = (activeHostname === 'localhost' || activeHostname === '127.0.0.1')
  ? 'http://localhost:5000'
  : `http://${activeHostname}:5000`; // Dynamically grabs your laptop's current network IP on your phone

const api = axios.create({
  baseURL: computedBaseURL,
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
