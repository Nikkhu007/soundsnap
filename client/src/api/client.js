import axios from 'axios';

// In production (Vercel), VITE_API_URL points to the Render backend.
// In development, Vite proxy forwards /api → localhost:5000.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('soundsnap_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
