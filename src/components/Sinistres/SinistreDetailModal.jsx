import React from 'react';
import { motion } from 'framer-motion';
import { FiX, FiMapPin, FiCalendar, FiUser, FiFileText, FiDollarSign, FiClock } from 'react-icons/fi';
import WorkflowTimeline from './WorkflowTimeline';

export const SinistreDetailModal = ({ isOpen, onClose, sinistre }) => {
  if (!isOpen || !sinistre) return null;

  const getStatusColor = (status) => {
    const colors = {
      'PARTIAL': 'bg-yellow-100 text-yellow-800',
      'FINALIZED': 'bg-blue-100 text-blue-800',
      'SUBMITTED': 'bg-purple-100 text-purple-800',
      'VALIDATION': 'bg-indigo-100 text-indigo-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'INDEMNISE': 'bg-teal-100 text-teal-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'PARTIAL': 'Déclaration partielle',
      'FINALIZED': 'Finalisée',
      'SUBMITTED': 'Soumise au validateur',
      'VALIDATION': 'En validation expert',
      'APPROVED': 'Approuvé',
      'REJECTED': 'Rejeté',
      'INDEMNISE': 'Indemnisé',
    };
    return labels[status] || status;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white p-5 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Détails du sinistre</h2>
            <p className="text-sm text-gray-500 font-mono">{sinistre.reference}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <FiX size={22} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Workflow */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold mb-3">Progression du dossier</h3>
            <WorkflowTimeline 
              currentStep={sinistre.status} 
              progress={sinistre.workflow_progress} 
            />
            <div className="mt-3 text-right">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sinistre.status)}`}>
                {getStatusLabel(sinistre.status)}
              </span>
            </div>
          </div>
          
          {/* Informations générales */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <FiCalendar className="text-mutas-500" />
              <div>
                <p className="text-xs text-gray-400">Date de l'incident</p>
                <p className="font-medium">{new Date(sinistre.incident_date).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <FiUser className="text-mutas-500" />
              <div>
                <p className="text-xs text-gray-400">Sinistré</p>
                <p className="font-medium">{sinistre.sinistre_name || 'Non renseigné'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <FiFileText className="text-mutas-500" />
              <div>
                <p className="text-xs text-gray-400">Type de sinistre</p>
                <p className="font-medium">{sinistre.type_sinistre}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <FiDollarSign className="text-mutas-500" />
              <div>
                <p className="text-xs text-gray-400">Montant estimé</p>
                <p className="font-medium">{sinistre.estimated_amount ? `${sinistre.estimated_amount.toLocaleString()} FCFA` : 'Non renseigné'}</p>
              </div>
            </div>
          </div>
          
          {/* Adresse */}
          <div className="border-t pt-4">
            <div className="flex items-start gap-2">
              <FiMapPin className="text-mutas-500 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400">Adresse du sinistre</p>
                <p className="font-medium">{sinistre.address || 'Non renseignée'}</p>
                {sinistre.latitude && sinistre.longitude && (
                  <p className="text-xs text-gray-400 mt-1">
                    Coordonnées: {sinistre.latitude}, {sinistre.longitude}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Description */}
          {sinistre.description && (
            <div className="border-t pt-4">
              <p className="text-xs text-gray-400 mb-1">Description</p>
              <p className="text-gray-700">{sinistre.description}</p>
            </div>
          )}
          
          {/* Dégâts */}
          {sinistre.damages && (
            <div className="border-t pt-4">
              <p className="text-xs text-gray-400 mb-1">Dégâts constatés</p>
              <p className="text-gray-700">{sinistre.damages}</p>
            </div>
          )}
          
          {/* Historique des actions */}
          {sinistre.history && sinistre.history.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FiClock className="text-mutas-500" /> Historique
              </h3>
              <div className="space-y-2">
                {sinistre.history.slice(0, 5).map((h, idx) => (
                  <div key={idx} className="text-sm border-l-2 border-mutas-200 pl-3 py-1">
                    <p className="font-medium">{h.action}</p>
                    <p className="text-xs text-gray-400">{new Date(h.timestamp).toLocaleString()} - {h.user_name}</p>
                    {h.comment && <p className="text-xs text-gray-500 mt-1">{h.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="p-5 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200">
            Fermer
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SinistreDetailModal;