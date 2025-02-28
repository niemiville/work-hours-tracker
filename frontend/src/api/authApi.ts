import axios from 'axios';

const API_URL = 'http://localhost:3001/api/auth';

export const signUp = async (name: string, password: string) => {
    const response = await axios.post(`${API_URL}/signup`, { name, password });
    return response.data;
};

export const login = async (name: string, password: string) => {
    const response = await axios.post(`${API_URL}/login`, { name, password });
    return response.data;
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export const getUser = async () => {
  const response = await axios.get(`${API_URL}/user`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });
  return response.data;
};
