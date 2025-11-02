import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// api instance already configured to use REACT_APP_API_URL and withCredentials
// keep backward compatibility by referencing api
const axiosInstance = api;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    checkAuth();
  }, [token]);

  const checkAuth = async () => {
    try {
  const response = await axiosInstance.get('/auth/me');
      const user = response.data.user;
      // Ensure both id and _id are available for compatibility
      const userWithId = { ...user, _id: user.id || user._id, id: user.id || user._id };
      setUser(userWithId);
    } catch (error) {
      setUser(null);
      localStorage.removeItem('token');
      delete axiosInstance.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
  const response = await axiosInstance.post('/auth/login', { email, password });
      const { user, token } = response.data;
      // Ensure both id and _id are available for compatibility
      const userWithId = { ...user, _id: user.id || user._id, id: user.id || user._id };
      setUser(userWithId);
      setToken(token);
      localStorage.setItem('token', token);
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (username, email, password) => {
    try {
  const response = await axiosInstance.post('/auth/register', {
        username,
        email,
        password,
      });
      const { user, token } = response.data;
      // Ensure both id and _id are available for compatibility
      const userWithId = { ...user, _id: user.id || user._id, id: user.id || user._id };
      setUser(userWithId);
      setToken(token);
      localStorage.setItem('token', token);
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
  await axiosInstance.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      delete axiosInstance.defaults.headers.common['Authorization'];
      toast.info('Logged out successfully');
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

