import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../../api/client';
import toast from 'react-hot-toast';

function IndemnisationModal({ isOpen, onClose, sinistre, onSuccess }) {
  const [montant, setMontant] = useState('');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/sinistres/${sinistre.id}/status/`, {
        status: 'INDEMNISE',
        approved_amount: montant,
        comment: `Indemnisation n°${reference}`
      });
      toast.success('Sinistre indemnisé avec succès');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Erreur lors de l\'indemnisation');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !sinistre) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl animate-fadeIn">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Indemniser le sinistre</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row">
          {/* Formulaire */}
          <div className="flex-1 p-6 border-r">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Montant de l'indemnisation (FCFA)</label>
                <input
                  type="number"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Référence de l'indemnisation</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="IND-XXXXX"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
              >
                {loading ? 'Traitement...' : 'Valider l\'indemnisation'}
              </button>
            </form>
          </div>
          
          {/* Fiche sommaire */}
          <div className="w-80 p-6 bg-gray-50">
            <h3 className="font-semibold mb-4">Informations du sinistre</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Référence:</span> {sinistre.reference}</p>
              <p><span className="font-medium">Type:</span> {sinistre.type_sinistre}</p>
              <p><span className="font-medium">Déclarant:</span> {sinistre.declarant?.username}</p>
              <p><span className="font-medium">Date:</span> {new Date(sinistre.incident_date).toLocaleDateString()}</p>
              <p><span className="font-medium">Montant estimé:</span> {sinistre.estimated_amount?.toLocaleString()} FCFA</p>
              <p><span className="font-medium">Expert:</span> {sinistre.expert?.username || 'Non assigné'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IndemnisationModal;