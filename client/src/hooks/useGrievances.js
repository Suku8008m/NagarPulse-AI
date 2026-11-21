import { useState, useEffect, useCallback } from 'react';
import grievanceService from '../services/grievanceService';

export const useGrievances = (initialFilters = {}) => {
  const [grievances, setGrievances] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    search: '',
    sort: 'newest',
    ...initialFilters
  });

  const fetchGrievances = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [grievancesRes, statsRes] = await Promise.all([
        grievanceService.getGrievances(filters),
        grievanceService.getStatsSummary()
      ]);

      const list = Array.isArray(grievancesRes?.data)
        ? grievancesRes.data
        : Array.isArray(grievancesRes)
        ? grievancesRes
        : [];
      setGrievances(list);
      setStats(statsRes?.stats || null);
    } catch (err) {
      console.error('[useGrievances fetch error]:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch grievances');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchGrievances();
  }, [fetchGrievances]);

  const updateFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const upvote = async (id) => {
    try {
      const res = await grievanceService.upvoteGrievance(id);
      if (res?.data) {
        setGrievances((prev) =>
          prev.map((g) => (g._id === id ? { ...g, upvotes: res.data.upvotes } : g))
        );
      }
      return res;
    } catch (err) {
      console.error('[Upvote error]:', err);
      throw err;
    }
  };

  const updateGrievanceLocally = (item) => {
    if (!item) return;
    setGrievances((prev) => {
      const idx = prev.findIndex((g) => g._id === item._id || g.trackingId === item.trackingId);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...item };
        return next;
      }
      return [item, ...prev];
    });
  };

  return {
    grievances,
    stats,
    isLoading,
    error,
    filters,
    updateFilters,
    refetch: fetchGrievances,
    upvote,
    updateGrievanceLocally
  };
};

export default useGrievances;
