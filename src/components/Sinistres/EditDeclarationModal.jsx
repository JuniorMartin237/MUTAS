import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';

export const EditDeclarationModal = ({ isOpen, onClose, sinistre, onSave }) => {
  const [formData, setFormData] = useState({
    description: '',
    damages: '',
    estimated_amount: '',
    address: '',
    incident_date: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (sinistre) {
      setFormData({
        description: sinistre.description || '',
        damages: sinistre.damages || '',
        estimated_amount: sinistre.estimated_amount || '',
        address: sinistre.address || '',
        incident_date: sinistre.incident_date ? sinistre.incident_date.slice(0, 16) : ''
      });
    }
  }, [sinistre]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description) {
      toast.error('Veuillez décrire les circonstances du sinistre');
      return;
    }
    
    setSubmitting(true);
    try {
      await onSave(sinistre.id, formData);
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !sinistre) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white p-5 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Modifier la déclaration</h2>
            <p className="text-sm text-gray-500 font-moto">{sinistre.reference}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <FiX size={22} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Description des circonstances *</label>
            <textarea 
              rows={4} 
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Dégâts constatés</label>
            <textarea 
              rows={3} 
              value={formData.damages} 
              onChange={(e) => setFormData({...formData, damages: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Montant estimé (FCFA)</label>
              <input 
                type="number" 
                value={formData.estimated_amount} 
                onChange={(e) => setFormData({...formData, estimated_amount: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Adresse</label>
              <input 
                type="text" 
                value={formData.address} 
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Date de l'incident</label>
            <input 
              type="datetime-local" 
              value={formData.incident_date} 
              onChange={(e) => setFormData({...formData, incident_date: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button 
              type="submit" 
              disabled={submitting}
              className="flex-1 bg-mutas-500 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-mutas-600 disabled:opacity-50"
            >
              <FiSave /> {submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 border py-2 rounded-lg"
            >
              Annuler
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EditDeclarationModal;