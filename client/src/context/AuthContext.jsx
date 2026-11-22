import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('nagarpulse_token') || null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [targetPortal, setTargetPortal] = useState(null);

  // Initialize and restore session on mount
  useEffect(() => {
    const initSession = async () => {
      const storedToken = localStorage.getItem('nagarpulse_token');
      if (storedToken) {
        try {
          const res = await authService.getMe();
          if (res?.user) {
            setUser(res.user);
            setToken(storedToken);
          } else {
            localStorage.removeItem('nagarpulse_token');
            setUser(null);
            setToken(null);
          }
        } catch (err) {
          console.warn('[Session Restore]:', err.message);
          localStorage.removeItem('nagarpulse_token');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initSession();
  }, []);

  const login = async ({ email, password, demoRole }) => {
    const res = await authService.login({ email, password, demoRole });
    if (res?.user && res?.token) {
      setUser(res.user);
      setToken(res.token);
      setIsLoginModalOpen(false);
      return res;
    }
    throw new Error(res?.message || 'Login failed.');
  };

  const register = async (registerData) => {
    const res = await authService.register(registerData);
    if (res?.user && res?.token) {
      setUser(res.user);
      setToken(res.token);
      setIsLoginModalOpen(false);
      return res;
    }
    throw new Error(res?.message || 'Registration failed.');
  };

  const sendVerificationOtp = async ({ email, name, password }) => {
    return authService.sendVerificationOtp({ email, name, password });
  };

  const verifyOtp = async ({ email, otp }) => {
    return authService.verifyOtp({ email, otp });
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('nagarpulse_token');
    }
  };

  const openLoginModal = (target = null) => {
    setTargetPortal(target);
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
    setTargetPortal(null);
  };

  const loginAsDemo = async (demoRole) => {
    return login({ demoRole });
  };

  const forgotPassword = async ({ email }) => {
    return authService.forgotPassword({ email });
  };

  const resetPassword = async ({ email, otp, newPassword }) => {
    return authService.resetPassword({ email, otp, newPassword });
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user),
    isLoading,
    isLoginModalOpen,
    targetPortal,
    login,
    loginAsDemo,
    sendVerificationOtp,
    verifyOtp,
    register,
    logout,
    openLoginModal,
    closeLoginModal,
    forgotPassword,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
