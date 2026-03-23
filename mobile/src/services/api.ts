import axios from 'axios';

const getBaseURL = () => {
  const stored = localStorage.getItem('odp_api_url');
  if (stored) return stored;
  // Default to public IP or current origin if not set
  return window.location.origin;
};

const api = axios.create({
  baseURL: getBaseURL(),
});

// Update baseURL dynamically
export const updateApiBaseURL = (url: string) => {
  localStorage.setItem('odp_api_url', url);
  api.defaults.baseURL = url;
};

export default api;
