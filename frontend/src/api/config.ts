// We're using nginx proxy so we can use relative URLs
const API_BASE_URL = '/api';

// Define API endpoints
export const API_ENDPOINTS = {
  AUTH: `${API_BASE_URL}/auth`,
  TIME_ENTRIES: `${API_BASE_URL}/time-entries`,
  STATS: `${API_BASE_URL}/stats`,
};

export default API_BASE_URL; 