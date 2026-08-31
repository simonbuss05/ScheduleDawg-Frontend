// src/context/AuthContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import { registerUser, loginUser, getCurrentUser } from '../api/authApi';
import { AUTH_TOKEN_KEY } from '../api/axiosConfig';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    getCurrentUser()
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem(AUTH_TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const applySession = (data) => {
    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    setUser({ id: data.userId, email: data.email });
  };

  const login = (email, password) => loginUser(email, password).then((res) => applySession(res.data));
  const register = (email, password) => registerUser(email, password).then((res) => applySession(res.data));

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
