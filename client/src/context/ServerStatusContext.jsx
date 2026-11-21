import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { getServerStatus, subscribeServerStatus } from '../services/api';

const ServerStatusContext = createContext(null);

export const ServerStatusProvider = ({ children }) => {
  const [status, setStatus] = useState(getServerStatus());

  useEffect(() => {
    // Subscribe to state updates broadcasted from Axios interceptors
    const unsubscribe = subscribeServerStatus((newStatus) => {
      setStatus({ ...newStatus });
    });

    // Proactive Wake-Up Ping on App Mount:
    // Immediately fires a lightweight GET /health ping on initial page load
    // so Render starts booting the container the instant a judge opens the Vercel URL.
    api.get('/health').catch((err) => {
      console.debug('[ServerStatus] Proactive health ping received response or status:', err?.message);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const pingHealth = useCallback(async () => {
    try {
      return await api.get('/health');
    } catch (err) {
      console.debug('[ServerStatus] Manual health ping error:', err?.message);
      throw err;
    }
  }, []);

  const value = {
    ...status,
    pingHealth
  };

  return (
    <ServerStatusContext.Provider value={value}>
      {children}
    </ServerStatusContext.Provider>
  );
};

export const useServerStatus = () => {
  const context = useContext(ServerStatusContext);
  if (!context) {
    throw new Error('useServerStatus must be used within a ServerStatusProvider');
  }
  return context;
};

export default ServerStatusContext;
