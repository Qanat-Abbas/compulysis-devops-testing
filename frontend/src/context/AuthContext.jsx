// frontend/src/context/AuthContext.jsx
import { useState } from 'react';
import { authService } from '../services/authService';
import { AuthContext } from './authContextStore';

export const AuthProvider = ({ children }) => {
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');

  const [user, setUser] = useState(() => {
    if (!token || !storedUser) return null;
    try {
      return JSON.parse(storedUser);
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(token && storedUser));
  const loading = false;

  // Login function
  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      if (response?.access_token) {
        const { access_token, user: userData } = response;
        
        // Store token and user data
        localStorage.setItem('token', access_token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true };
      }
      return { success: false, error: 'Invalid login response' };
    } catch (error) {
      return { 
        success: false, 
        error: error?.response?.data?.message || error?.response?.data?.detail || error.message || 'Login failed' 
      };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Register function
  const register = async (userData) => {
    try {
      await authService.register(userData);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error?.response?.data?.message || error?.response?.data?.detail || error.message || 'Registration failed' 
      };
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    register,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};