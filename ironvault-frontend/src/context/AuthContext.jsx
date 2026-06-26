import { createContext, useState, useEffect, useCallback } from 'react';
import client from '../api/client';

export const AuthContext = createContext(null);

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

// Maps backend / network errors to clear, friendly messages.
const toFriendlyMessage = (error, fallback) => {
  if (error.response) {
    const backendMessage = error.response.data?.error;
    if (backendMessage) {
      return backendMessage;
    }
    if (error.response.status === 401 || error.response.status === 403) {
      return 'Invalid email or password. Please try again.';
    }
    return fallback;
  }
  if (error.request) {
    return 'Unable to reach the server. Please check your connection and try again.';
  }
  return fallback;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (savedUser && savedToken) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setRole(parsed.role ?? null);
        setToken(savedToken);
      } catch {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
      }
    }
    setLoading(false);
  }, []);

  const persistSession = useCallback((data) => {
    const { token: jwt, email, username, role: userRole } = data;
    const userData = { email, username, role: userRole };

    localStorage.setItem(TOKEN_KEY, jwt);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));

    setToken(jwt);
    setUser(userData);
    setRole(userRole ?? null);
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await client.post('/auth/login', { email, password });
      persistSession(response.data);
      return { success: true, role: response.data.role };
    } catch (error) {
      return {
        success: false,
        message: toFriendlyMessage(error, 'Login failed. Please try again.'),
      };
    }
  }, [persistSession]);

  const register = useCallback(async (email, password) => {
    try {
      const response = await client.post('/auth/register', { email, password });
      persistSession(response.data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: toFriendlyMessage(error, 'Registration failed. Please try again.'),
      };
    }
  }, [persistSession]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setRole(null);
  }, []);

  const value = {
    user,
    role,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
