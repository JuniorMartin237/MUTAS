import { useState, useEffect, useCallback } from 'react';
import { sinistreService, userService } from '../../services/sinistreService';
import toast from 'react-hot-toast';

export const useValidation = () => {
  const [submittedSinistres, setSubmittedSinistres] = useState([]);
  const [validationSinistres, setValidationSinistres] = useState([]);
  const [experts, setExperts] = useState([]);
  const [declarants, setDeclarants] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [submitted, validation, expertsRes, declarantsRes] = await Promise.all([
        sinistreService.getSubmittedSinistres().catch(() => ({ data: [] })),
        sinistreService.getValidationSinistres().catch(() => ({ data: [] })),
        userService.getExperts().catch(() => ({ data: [] })),
        userService.getDeclarants().catch(() => ({ data: [] }))
      ]);
      setSubmittedSinistres(submitted.data || []);
      setValidationSinistres(validation.data || []);
      setExperts(expertsRes.data || []);
      setDeclarants(declarantsRes.data || []);
    } catch (err) {
      console.error('Erreur chargement validation:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const validateDeclaration = useCallback(async (data) => {
    try {
      await sinistreService.validateDeclaration(data);
      toast.success(data.decision === 'APPROVED' ? 'Sinistre approuvé' : 'Sinistre rejeté');
      await fetchData();
      return true;
    } catch (err) {
      console.error('Erreur validation:', err);
      toast.error(err.response?.data?.error || 'Erreur lors de la validation');
      return false;
    }
  }, [fetchData]);

  const expertValidate = useCallback(async (id, data) => {
    try {
      await sinistreService.expertValidate(id, data);
      toast.success(data.decision === 'APPROVED' ? 'Sinistre approuvé pour indemnisation' : 'Sinistre rejeté');
      await fetchData();
      return true;
    } catch (err) {
      console.error('Erreur validation expert:', err);
      toast.error(err.response?.data?.error || 'Erreur lors de la validation');
      return false;
    }
  }, [fetchData]);

  const reassignDeclaration = useCallback(async (data) => {
    try {
      await sinistreService.reassignDeclaration(data);
      toast.success('Déclaration réassignée avec succès');
      await fetchData();
      return true;
    } catch (err) {
      console.error('Erreur réassignation:', err);
      toast.error(err.response?.data?.error || 'Erreur lors de la réassignation');
      return false;
    }
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    submittedSinistres,
    validationSinistres,
    experts,
    declarants,
    loading,
    validateDeclaration,
    expertValidate,
    reassignDeclaration,
    fetchData
  };
};