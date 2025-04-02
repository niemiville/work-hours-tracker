import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi, logout as logoutApi, getUser } from '../api/authApi';

type User = {
    id: number;
    name: string;
    displayname: string;
    token: string;
};

type AuthContextType = {
    user: User | null;
    login: (name: string, password: string) => Promise<void>;
    logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // Verify token and get user data on mount
            getUser().then(userData => {
                setUser({ ...userData, token });
            }).catch(() => {
                // If token is invalid, clear it
                localStorage.removeItem('token');
            });
        }
    }, []);

    const login = async (name: string, password: string) => {
        const data = await loginApi(name, password);
        setUser({ ...data.user, token: data.token });
        localStorage.setItem('token', data.token);
    };

    const logout = () => {
        logoutApi();
        setUser(null);
    };

    return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
