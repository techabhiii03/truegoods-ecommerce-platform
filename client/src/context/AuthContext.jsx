import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setAccessToken } from '../api/axiosClient';
import { loginUser, registerUser, logoutUser, getCurrentUser } from '../api/authApi';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while we check for an existing session

  // On mount, try to silently refresh using the httpOnly cookie.
  // This lets a logged-in user stay logged in after a page refresh.
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data } = await axiosClient.post('/auth/refresh');
        setAccessToken(data.accessToken);
        const meResponse = await getCurrentUser();
        setUser(meResponse.user);
      } catch {
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await loginUser({ email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const data = await registerUser({ name, email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await logoutUser().catch(() => {}); // clear client state even if the request fails
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
