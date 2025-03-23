// Get the API base URL from environment variables, or use default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Define API endpoints
export const API_ENDPOINTS = {
  AUTH: `${API_BASE_URL}/auth`,
  TIME_ENTRIES: `${API_BASE_URL}/time-entries`,
};

export default API_BASE_URL; 