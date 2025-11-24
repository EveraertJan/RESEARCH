import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            if (userData && userData.id && userData.email) {
              setUser(userData);
            } else {
              throw new Error('Invalid stored user data');
            }
          } catch (error) {
            console.warn('Failed to parse stored user data, fetching fresh:', error);
            localStorage.removeItem('user');
          }
        }

        if (!localStorage.getItem('user')) {
          try {
            const response = await authAPI.getProfile();
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
          } catch (error) {
            console.error('Failed to fetch user profile:', error);
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token]);

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      return response.data;
    } catch (error) {
      throw error.message || 'Registration failed';
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token: newToken, user: userData } = response.data;

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);

      return response.data;
    } catch (error) {
      throw error.message || 'Login failed';
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    updateUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};