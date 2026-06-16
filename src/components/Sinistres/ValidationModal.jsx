import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiUser, FiCalendar, FiDollarSign, FiCheck, FiXCircle } from 'react-icons/fi';

export const ValidationModal = ({ isOpen, onClose, sinistre, onValidate, onReject, isExpert = false, experts = [] }) => {
  const [approvedAmount, setApprovedAmount] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [expertId, setExpertId] = useState('');
  const [decision, setDecision] = useState(null);

  if (!isOpen || !sinistre) return null;

  const handleValidate = () => {
    if (isExpert) {
      onValidate(sinistre.id, { 
        decision: 'APPROVED', 
        approved_amount: approvedAmount 
      });
    } else {
      onValidate(sinistre.id, 'APPROVED', approvedAmount, expertId);
    }
    onClose();
  };

  const handleReject = () => {
    onReject(sinistre.id, rejectionReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="p-5 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {isExpert ? 'Validation expert' : 'Validation du sinistre'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <FiX size={22} />
          </button>
        </div>
        
        <div className="p-5 space-y-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-500">Référence</p>
            <p className="font-mono font-medium">{sinistre.reference}</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-500">Sinistré</p>
            <p className="font-medium">{sinistre.sinistre_name || 'Non renseigné'}</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-500">Montant estimé</p>
            <p className="font-medium">{sinistre.estimated_amount ? `${sinistre.estimated_amount.toLocaleString()} FCFA` : 'Non renseigné'}</p>
          </div>
          
          {!isExpert && experts.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1">Assigner à un expert</label>
              <select 
                value={expertId} 
                onChange={(e) => setExpertId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Sélectionner un expert</option>
                {experts.map(expert => (
                  <option key={expert.id} value={expert.id}>{expert.username}</option>
                ))}
              </select>
            </div>
          )}
          
          {isExpert && (
            <div>
              <label className="block text-sm font-medium mb-1">Montant approuvé (FCFA)</label>
              <input 
                type="number" 
                value={approvedAmount} 
                onChange={(e) => setApprovedAmount(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Montant de l'indemnisation"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-1">Motif de rejet (si rejet)</label>
            <textarea 
              rows={3} 
              value={rejectionReason} 
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Indiquez le motif du rejet..."
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button 
              onClick={handleValidate}
              disabled={isExpert && !approvedAmount}
              className="flex-1 bg-green-500 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-600 disabled:opacity-50"
            >
              <FiCheck /> Approuver
            </button>
            <button 
              onClick={handleReject}
              className="flex-1 bg-red-500 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-red-600"
            >
              <FiXCircle /> Rejeter
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ValidationModal;