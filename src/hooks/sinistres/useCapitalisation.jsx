import { useState, useEffect, useCallback } from 'react';
import { sinistreService } from '../../services/sinistreService';
import toast from 'react-hot-toast';

export const useCapitalisation = () => {
  const [stats, setStats] = useState({
    total_sinistres: 0,
    total_approved: 0,
    total_indemnized: 0,
    total_rejected: 0,
    total_amount: 0,
    monthly_stats: [],
    success_rate: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await sinistreService.getCapitalizationStats();
      setStats({
        total_sinistres: response.data.total_sinistres || 0,
        total_approved: response.data.total_approved || 0,
        total_indemnized: response.data.total_indemnized || 0,
        total_rejected: response.data.total_rejected || 0,
        total_amount: response.data.total_amount || 0,
        monthly_stats: response.data.monthly_stats || [],
        success_rate: response.data.success_rate || 0
      });
    } catch (err) {
      console.error('Erreur chargement stats:', err);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, fetchStats };
};