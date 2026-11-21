import axios from 'axios';

// API base URL configured with seamless normalization for local & production (Vercel + Render)
const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_BASE_URL = rawBase.endsWith('/api') ? rawBase : `${rawBase.replace(/\/$/, '')}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 60000 // 60s timeout for Gemini vision and audio inference
});

// Attach JWT token from localStorage if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nagarpulse_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
