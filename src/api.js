// File Path: src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000', // Apne backend ka URL yahan daalna
});

// 1. Request interceptor: Har request ke sath token automatic attach karega
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// 2. Response interceptor: Agar kachra token hua, toh storage automatic clear karega
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Agar backend ne mana kiya, toh kachra clean karo aur login page par phek do
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;