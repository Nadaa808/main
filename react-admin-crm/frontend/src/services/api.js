import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Users API
export const usersAPI = {
  getAll: () => api.get('/api/users'),
  getById: (id) => api.get(`/api/users/${id}`),
  create: (userData) => api.post('/api/users', userData),
  update: (id, userData) => api.put(`/api/users/${id}`, userData),
  delete: (id) => api.delete(`/api/users/${id}`),
};

// Admin API
export const adminAPI = {
  getUsersFull: () => api.get('/api/admin/users-full'),
  getKycStats: () => api.get('/api/admin/kyc-stats'),
  getWalletStats: () => api.get('/api/admin/wallet-stats'),
  getDidStats: () => api.get('/api/admin/did-stats'),
  getAssetStats: () => api.get('/api/admin/asset-stats'),
  getSystemHealth: () => api.get('/api/admin/system-health'),
  verifyUser: (id, data) => api.put(`/api/admin/verify-user/${id}`, data),
};

// Health check
export const healthCheck = () => api.get('/api/health');

export default api; 