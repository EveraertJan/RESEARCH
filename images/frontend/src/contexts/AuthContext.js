import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

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
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Try to get stored user data first
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            // Validate that stored user has required fields
            if (userData && userData.id && userData.email) {
              setUser(userData);
            } else {
              // Invalid stored user data, fetch fresh
              throw new Error('Invalid stored user data');
            }
          } catch (error) {
            // Failed to parse stored user, fetch fresh
            console.warn('Failed to parse stored user data, fetching fresh:', error);
            localStorage.removeItem('user');
            // Fall through to fetch fresh data
          }
        }
        
        // If no valid stored user data, fetch it from API
        if (!localStorage.getItem('user')) {
          try {
            const response = await axios.get(process.env.REACT_APP_API_URL + '/users/profile');
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
          } catch (error) {
            console.error('Failed to fetch user profile:', error);
            // If token is invalid, clear it
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          }
        }
      } else {
        // No token, ensure user is null
        setUser(null);
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token]);

  const register = async (userData) => {
    try {
      const response = await axios.post(process.env.REACT_APP_API_URL + '/users/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Registration failed';
    }
  };

  const login = async (credentials) => {
    try {
      const response = await axios.post(process.env.REACT_APP_API_URL + '/users/login', credentials);
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      setToken(newToken);
      setUser(userData);
      
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Login failed';
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
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