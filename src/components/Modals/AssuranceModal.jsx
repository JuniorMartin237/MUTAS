import React, { useState } from 'react';
import { FiX, FiShield } from 'react-icons/fi';
import { authApi } from '../../api/client';
import toast from 'react-hot-toast';

function AssuranceModal({ isOpen, onClose, onSuccess, assurance = null }) {
  const [submitting, setSubmitting] = useState(false);
  const isEditing = !!assurance;

  const [formData, setFormData] = useState({
    name: assurance?.name || '',
    type_assurance: assurance?.type_assurance || 'SANTE',
    couverture: assurance?.couverture || 'SOLO',
    description: assurance?.description || '',
    is_active: assurance?.is_active !== undefined ? assurance.is_active : true
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditing) {
        await authApi.put(`/accounts/assurances/${assurance.id}/update/`, formData);
        toast.success('Assurance modifiée avec succès');
      } else {
        await authApi.post('/accounts/assurances/create/', formData);
        toast.success('Assurance créée avec succès');
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'opération');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex justify-between items-center p-5 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <FiShield className="text-blue-500 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{isEditing ? 'Modifier' : 'Nouvelle'} assurance</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <FiX size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nom *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={formData.type_assurance}
                onChange={(e) => setFormData({...formData, type_assurance: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="SANTE">Santé</option>
                <option value="AUTO">Automobile</option>
                <option value="HABITATION">Habitation</option>
                <option value="VOYAGE">Voyage</option>
                <option value="TRANSPORT">Transport</option>
                <option value="VIE">Vie</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Couverture</label>
              <select
                value={formData.couverture}
                onChange={(e) => setFormData({...formData, couverture: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="SOLO">SOLO</option>
                <option value="FAMILLE">FAMILLE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
              className="w-4 h-4"
            />
            <label>Active</label>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={submitting} className="flex-1 bg-blue-500 text-white py-2 rounded-lg">
              {submitting ? 'En cours...' : (isEditing ? 'Modifier' : 'Créer')}
            </button>
            <button type="button" onClick={onClose} className="flex-1 border py-2 rounded-lg">Annuler</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AssuranceModal;