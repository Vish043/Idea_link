/**
 * Utility functions for handling image URLs
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Get the full URL for an image (avatar, etc.)
 * Handles both full URLs (cloud storage) and relative URLs (local storage)
 */
export function getImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  
  // If it's already a full URL (cloud storage), return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If it's a relative URL (local storage), construct full URL
  // Remove /api from base URL if the path already starts with /api
  const baseUrl = url.startsWith('/api') 
    ? API_BASE_URL.replace('/api', '')
    : API_BASE_URL;
  
  return `${baseUrl}${url.startsWith('/') ? url : '/' + url}`;
}

