import axios from 'axios';

// API base URL configured with seamless normalization for local & production (Vercel + Render)
const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_BASE_URL = rawBase.endsWith('/api') ? rawBase : `${rawBase.replace(/\/$/, '')}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 75000 // 75s timeout to survive Render free-tier container cold start
});

// Server status state tracking
let pendingRequestsCount = 0;
let wakeUpTimer = null;
let wakeUpStartTime = null;

const serverStatus = {
  isWakingUp: false,
  lastLatencyMs: null,
  isOnline: null,
  wakeUpStartedAt: null,
  activeRequests: 0
};

// Clean event emitter for broadcasting server status updates
class ServerStatusEmitter {
  constructor() {
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    // Immediately emit current snapshot to newly connected listener
    listener({ ...serverStatus });
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify(data) {
    this.listeners.forEach((listener) => {
      try {
        listener(data);
      } catch (err) {
        console.error('[ServerStatusEmitter] Notification error:', err);
      }
    });
  }
}

export const serverStatusEmitter = new ServerStatusEmitter();
export const getServerStatus = () => ({ ...serverStatus });
export const subscribeServerStatus = (fn) => serverStatusEmitter.subscribe(fn);

const emitStatus = () => {
  serverStatusEmitter.notify({ ...serverStatus });
};

let reqIdCounter = 0;

// Attach JWT token from localStorage if present & track start time
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nagarpulse_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Assign unique request ID and record precise start timestamp
  config._requestId = ++reqIdCounter;
  config._startTime = performance.now();

  pendingRequestsCount++;
  serverStatus.activeRequests = pendingRequestsCount;

  // Track the timestamp of when this burst of requests began pending
  if (!wakeUpStartTime) {
    wakeUpStartTime = Date.now();
  }

  // Start 2500ms wake-up detection timer if not already active
  if (!wakeUpTimer) {
    wakeUpTimer = setTimeout(() => {
      if (pendingRequestsCount > 0) {
        serverStatus.isWakingUp = true;
        serverStatus.wakeUpStartedAt = wakeUpStartTime || Date.now();
        emitStatus();
      }
    }, 2500);
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptors to measure latency and reset waking state
api.interceptors.response.use(
  (response) => {
    const end = performance.now();
    const start = response.config?._startTime ?? end;
    const latency = Math.round(end - start);

    pendingRequestsCount = Math.max(0, pendingRequestsCount - 1);
    serverStatus.activeRequests = pendingRequestsCount;
    serverStatus.lastLatencyMs = latency;
    serverStatus.isOnline = true;
    serverStatus.isWakingUp = false; // Reset as soon as a response arrives

    if (wakeUpTimer) {
      clearTimeout(wakeUpTimer);
      wakeUpTimer = null;
    }

    if (pendingRequestsCount === 0) {
      wakeUpStartTime = null;
      serverStatus.wakeUpStartedAt = null;
    }

    emitStatus();
    return response;
  },
  (error) => {
    const end = performance.now();
    const start = error.config?._startTime ?? end;
    const latency = Math.round(end - start);

    pendingRequestsCount = Math.max(0, pendingRequestsCount - 1);
    serverStatus.activeRequests = pendingRequestsCount;

    if (error.response) {
      // Backend container responded (HTTP 4xx / 5xx) - it is awake and online
      serverStatus.lastLatencyMs = latency;
      serverStatus.isOnline = true;
      serverStatus.isWakingUp = false;
    } else if (pendingRequestsCount === 0) {
      // Network error or timeout with no active requests left
      serverStatus.isOnline = false;
      serverStatus.isWakingUp = false;
    }

    if (wakeUpTimer) {
      clearTimeout(wakeUpTimer);
      wakeUpTimer = null;
    }

    if (pendingRequestsCount === 0) {
      wakeUpStartTime = null;
      serverStatus.wakeUpStartedAt = null;
    }

    emitStatus();
    return Promise.reject(error);
  }
);

// Backward compatibility helpers for grievance endpoints
export const getGrievances = (params) => api.get('/grievances', { params }).then((r) => r.data);
export const createGrievance = (data) => api.post('/grievances', data).then((r) => r.data);
export const resolveGrievance = (id, data) => api.patch(`/grievances/${id}/resolve`, data).then((r) => r.data);
export const upvoteGrievance = (id) => api.post(`/grievances/${id}/upvote`).then((r) => r.data);

export default api;
