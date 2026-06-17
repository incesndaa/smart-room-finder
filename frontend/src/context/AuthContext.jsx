import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            loadUser();
        } else {
            setLoading(false);
        }
    }, []);

    const loadUser = async () => {
        try {
            const response = await api.get('/auth/profile');
            console.log('Load user response:', response.data);
            if (response.data.success) {
                setUser(response.data.data);
            }
        } catch (error) {
            console.error('Load user error:', error);
            localStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        try {
            console.log('Login attempt:', username);
            const response = await api.post('/auth/login', { username, password });
            console.log('Login response:', response.data);
            
            if (response.data.success) {
                const { token, user } = response.data;
                localStorage.setItem('token', token);
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                setUser(user);
                return { success: true };
            } else {
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { 
                success: false, 
                message: error.response?.data?.message || 'Network error. Pastikan backend berjalan.'
            };
        }
    };

    const register = async (userData) => {
        try {
            const response = await api.post('/auth/register', userData);
            return response.data;
        } catch (error) {
            console.error('Register error:', error);
            return { 
                success: false, 
                message: error.response?.data?.message || 'Registrasi gagal'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};