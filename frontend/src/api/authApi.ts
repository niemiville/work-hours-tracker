import axios from 'axios';
import { API_ENDPOINTS } from "./config";

const API_URL = API_ENDPOINTS.AUTH;

// Add axios interceptor to handle auth headers
axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const signUp = async (name: string, password: string, displayname: string) => {
    const response = await axios.post(`${API_URL}/signup`, { name, password, displayname });
    return response.data;
};

export const login = async (name: string, password: string, rememberMe: boolean = false) => {
    const response = await axios.post(`${API_URL}/login`, { name, password, rememberMe });
    return response.data;
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export const getUser = async () => {
    try {
        const response = await axios.get(`${API_URL}/user`);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            localStorage.removeItem('token');
        }
        throw error;
    }
};
