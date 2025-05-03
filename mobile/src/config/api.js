import axios from 'axios';

// Replace with your server IP address when testing on physical device
const API_URL = 'http://10.0.2.2:5000/api';  // Default for Android emulator
// const API_URL = 'http://localhost:5000/api';  // For iOS simulator

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor for authentication
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api; 