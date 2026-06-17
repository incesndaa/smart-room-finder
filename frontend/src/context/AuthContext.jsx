// import React, { createContext, useState, useContext, useEffect } from 'react';
// import api from '../services/api';

// const AuthContext = createContext();

// export const useAuth = () => useContext(AuthContext);

// export const AuthProvider = ({ children }) => {
//     const [user, setUser] = useState(null);
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         const token = localStorage.getItem('token');
//         if (token) {
//             api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//             loadUser();
//         } else {
//             setLoading(false);
//         }
//     }, []);

//     const loadUser = async () => {
//         try {
//             const response = await api.get('/auth/profile');
//             console.log('Load user response:', response.data);
//             if (response.data.success) {
//                 setUser(response.data.data);
//             }
//         } catch (error) {
//             console.error('Load user error:', error);
//             localStorage.removeItem('token');
//             delete api.defaults.headers.common['Authorization'];
//         } finally {
//             setLoading(false);
//         }
//     };

//     const login = async (username, password) => {
//         try {
//             console.log('Login attempt:', username);
//             const response = await api.post('/auth/login', { username, password });
//             console.log('Login response:', response.data);
            
//             if (response.data.success) {
//                 const { token, user } = response.data;
//                 localStorage.setItem('token', token);
//                 api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//                 setUser(user);
//                 return { success: true };
//             } else {
//                 return { success: false, message: response.data.message };
//             }
//         } catch (error) {
//             console.error('Login error:', error);
//             return { 
//                 success: false, 
//                 message: error.response?.data?.message || 'Network error. Pastikan backend berjalan.'
//             };
//         }
//     };

//     const register = async (userData) => {
//         try {
//             const response = await api.post('/auth/register', userData);
//             return response.data;
//         } catch (error) {
//             console.error('Register error:', error);
//             return { 
//                 success: false, 
//                 message: error.response?.data?.message || 'Registrasi gagal'
//             };
//         }
//     };

//     const logout = () => {
//         localStorage.removeItem('token');
//         delete api.defaults.headers.common['Authorization'];
//         setUser(null);
//     };

//     return (
//         <AuthContext.Provider value={{ user, loading, login, register, logout }}>
//             {children}
//         </AuthContext.Provider>
//     );
// };

import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fungsi untuk mengecek sesi user yang sedang login saat halaman web di-refresh
  useEffect(() => {
    const storedUser = localStorage.getItem('user_session');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // 1. FUNGSI LOGIN (Langsung membaca tabel `users` di Supabase)
  const login = async (usernameOrEmail, password) => {
    try {
      // Cari user berdasarkan username ATAU email di database Supabase
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .or(`email.eq.${usernameOrEmail},username.eq.${usernameOrEmail}`);

      if (error) throw error;

      if (!users || users.length === 0) {
        return { success: false, message: 'User tidak ditemukan' };
      }

      const foundUser = users[0];

      // COCOKAN PASSWORD
      // Catatan: Karena password di sql dump kamu berupa Bcrypt hash ($2b$12$...),
      // jika nanti gagal login, silakan ubah password milik user tersebut di Supabase Table Editor 
      // menjadi teks biasa terlebih dahulu (misalnya diubah jadi 'bsp123' atau 'admin123').
      if (foundUser.password !== password) {
        return { success: false, message: 'Password salah' };
      }

      // Siapkan data sesi user jika login berhasil
      const sessionData = {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email,
        full_name: foundUser.full_name,
        role: foundUser.role
      };

      localStorage.setItem('user_session', JSON.stringify(sessionData));
      setUser(sessionData);
      return { success: true };

    } catch (err) {
      console.error('Login error:', err);
      return { success: false, message: err.message || 'Terjadi kesalahan jaringan' };
    }
  };

  // 2. FUNGSI LOGOUT
  const logout = () => {
    localStorage.removeItem('user_session');
    setUser(null);
  };

  // 3. FUNGSI REGISTER
  const register = async (userData) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            username: userData.username,
            email: userData.email,
            password: userData.password, // Teks biasa untuk sementara tanpa enkripsi backend
            full_name: userData.full_name,
            role: 'user'
          }
        ])
        .select();

      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);