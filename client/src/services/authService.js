import api from './api';

// Login with credentials or instant 1-click Judge Demo login
export const login = async ({ email, password, demoRole }) => {
  const res = await api.post('/auth/login', { email, password, demoRole });
  if (res.data?.token) {
    localStorage.setItem('nagarpulse_token', res.data.token);
  }
  return res.data;
};

// Send 6-digit OTP verification code to email & phone
export const sendVerificationOtp = async ({ email, phone }) => {
  const res = await api.post('/auth/send-verification-otp', { email, phone });
  return res.data;
};

// Verify 6-digit OTP code
export const verifyOtp = async ({ email, phone, otp }) => {
  const res = await api.post('/auth/verify-otp', { email, phone, otp });
  return res.data;
};

// Register citizen with verified email & phone
export const register = async ({ name, email, phone, password, otp, verificationToken }) => {
  const res = await api.post('/auth/register', { name, email, phone, password, otp, verificationToken });
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
  // Return an object that works whether accessed as res.data or directly
  return {
    ...res.data,
    data: res.data
  };
};

export const authService = {
  sendVerificationOtp,
  verifyOtp,
  login,
  register,
  getMe,
  logout,
  getLoginLogs
};

export default authService;
