import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// YOUR SERVER IP
const API_BASE_URL = 'https://little-watch-backend.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token'); // Changed from 'userToken' to 'token'
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
};

// User APIs
export const userAPI = {
  updateFCMToken: (fcmToken) => api.put('/user/fcm-token', { fcmToken }),
};

// Device APIs
export const deviceAPI = {
  register: (data) => api.post('/devices/register', data),
  getAll: () => api.get('/devices'),
  getDetails: (deviceId) => api.get(`/devices/${deviceId}`),
};

// Vitals APIs
export const vitalsAPI = {
  getLatest: (deviceId) => api.get(`/vitals/latest/${deviceId}`),
  getHistory: (deviceId, params) => api.get(`/vitals/history/${deviceId}`, { params }),
};

// Notifications APIs
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
};

export default api;