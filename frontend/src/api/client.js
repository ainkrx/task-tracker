import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;
const PUBLIC_ENDPOINTS = ['/login', '/register'];

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  const isPublicEndpoint = PUBLIC_ENDPOINTS.includes(config.url);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.method !== 'get' && !isPublicEndpoint) {
    return Promise.reject(new Error('Guest write blocked'));
  }
  return config;
});

export default api;