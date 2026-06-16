import { useState, useEffect, useCallback } from 'react';
import { sinistreService } from '../../services/sinistreService';
import toast from 'react-hot-toast';

export const useSinistres = () => {
  const [sinistres, setSinistres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSinistres = useCallback(async () => {
    setLoading(true);
    try {
      const response = await sinistreService.getMySinistres();
      setSinistres(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Erreur fetch sinistres:', err);
      setError(err);
      setSinistres([]);
      toast.error('Erreur lors du chargement des sinistres');
    } finally {
      setLoading(false);
    }
  }, []);

  const submitToValidator = useCallback(async (id) => {
    try {
      await sinistreService.submitToValidator(id);
      toast.success('Déclaration soumise au validateur');
      await fetchSinistres();
      return true;
    } catch (err) {
      console.error('Erreur soumission:', err);
      toast.error(err.response?.data?.error || 'Erreur lors de la soumission');
      return false;
    }
  }, [fetchSinistres]);

  const editDeclaration = useCallback(async (id, data) => {
    try {
      await sinistreService.editDeclaration(id, data);
      toast.success('Déclaration modifiée avec succès');
      await fetchSinistres();
      return true;
    } catch (err) {
      console.error('Erreur modification:', err);
      toast.error(err.response?.data?.error || 'Erreur lors de la modification');
      return false;
    }
  }, [fetchSinistres]);

  useEffect(() => {
    fetchSinistres();
  }, [fetchSinistres]);

  return {
    sinistres,
    loading,
    error,
    fetchSinistres,
    submitToValidator,
    editDeclaration
  };
};