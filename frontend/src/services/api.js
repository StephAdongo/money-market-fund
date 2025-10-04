import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: false
});

// Add auth token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  register: (email, password) => API.post('/auth/register', { email, password }),
  verifyOTP: (email, otp) => API.post('/auth/verify-otp', { email, otp }),
  resendOTP: (email) => API.post('/auth/resend-otp', { email })
};

export const userService = {
  getProfile: () => API.get('/user/profile')
};

export const transactionService = {
  getTransactions: () => API.get('/transactions'),
  initiateTransaction: (type, amount) => API.post('/transactions/initiate', { type, amount }),
  verifyTransaction: (transactionId, otp) => API.post('/transactions/verify', { transactionId, otp })
};