'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '@/lib/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('neofin_token');
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await getMe();
      setUser(res.data.user);
    } catch {
      localStorage.removeItem('neofin_token');
      localStorage.removeItem('neofin_user');
    } finally {
      setLoading(false);
    }
  };

  const loginUser = (userData, token) => {
    localStorage.setItem('neofin_token', token);
    localStorage.setItem('neofin_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('neofin_token');
    localStorage.removeItem('neofin_user');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
