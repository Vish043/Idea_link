import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Construct a file URL from a stored URL
 * Handles both relative paths and full URLs, preventing double /api/api/ issues
 */
export function getFileUrl(storedUrl: string | undefined | null): string {
  if (!storedUrl) return '';
  
  // If it's already a full URL (cloud storage), return as is
  if (storedUrl.startsWith('http://') || storedUrl.startsWith('https://')) {
    return storedUrl;
  }
  
  // Remove any leading /api if present to prevent double /api/api/
  let cleanUrl = storedUrl;
  if (cleanUrl.startsWith('/api/')) {
    cleanUrl = cleanUrl.substring(4); // Remove '/api' but keep the leading '/'
  }
  
  // Ensure it starts with /
  if (!cleanUrl.startsWith('/')) {
    cleanUrl = '/' + cleanUrl;
  }
  
  // Construct full URL
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  
  return `${baseUrl}${cleanUrl}`;
}

export default api;

