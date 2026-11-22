import api from './api';

// Login with credentials or instant 1-click Judge Demo login
export const login = async ({ email, password, demoRole }) => {
  const res = await api.post('/auth/login', { email, password, demoRole });
  if (res.data?.token) {
    localStorage.setItem('nagarpulse_token', res.data.token);
  }
  return res.data;
};

// Send 6-digit OTP verification code to citizen email
export const sendVerificationOtp = async ({ email, name, password }) => {
  const res = await api.post('/auth/send-verification-otp', { email, name, password });
  return res.data;
};

// Verify 6-digit Email OTP code
export const verifyOtp = async ({ email, otp }) => {
  const res = await api.post('/auth/verify-otp', { email, otp });
  if (res.data?.token) {
    localStorage.setItem('nagarpulse_token', res.data.token);
  }
  return res.data;
};

// Register citizen with verified email
export const register = async ({ name, email, password, otp, verificationToken }) => {
  const res = await api.post('/auth/register', { name, email, password, otp, verificationToken });
  if (res.data?.token) {
    localStorage.setItem('nagarpulse_token', res.data.token);
  }
  return res.data;
};

// Get current user profile
export const getMe = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};

// Logout session
export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } finally {
    localStorage.removeItem('nagarpulse_token');
  }
};

// Get real-time login audit ledger (Admin only)
export const getLoginLogs = async (limit = 50) => {
  const res = await api.get('/auth/login-logs', { params: { limit } });
  return {
    ...res.data,
    data: res.data
  };
};

// Request 6-digit OTP code to reset password
export const forgotPassword = async ({ email }) => {
  const res = await api.post('/auth/forgot-password', { email });
  return res.data;
};

// Reset password with 6-digit OTP
export const resetPassword = async ({ email, otp, newPassword }) => {
  const res = await api.post('/auth/reset-password', { email, otp, newPassword });
  return res.data;
};

export const authService = {
  sendVerificationOtp,
  verifyOtp,
  login,
  register,
  getMe,
  logout,
  getLoginLogs,
  forgotPassword,
  resetPassword
};

export default authService;
