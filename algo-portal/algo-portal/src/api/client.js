import axios from 'axios';

// In production (deployed on Vercel), the API lives at the same domain under /api,
// since vercel.json rewrites /api/* to the serverless function. In local dev, it
// points at the local Express server via VITE_API_URL.
const API_URL = import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:4000/api');

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('algo_portal_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('algo_portal_token');
      localStorage.removeItem('algo_portal_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
