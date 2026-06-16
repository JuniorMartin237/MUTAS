// src/pages/Sinistres/ListeDeclarations.jsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, FiEye, FiSearch, FiX, FiUpload,
  FiFileText, FiCalendar, FiMapPin, FiUser, 
  FiCheckCircle, FiClock, FiRefreshCw,
  FiPaperclip, FiLoader, FiDollarSign, FiUserCheck,
  FiAlertCircle, FiTrash2, FiChevronLeft, FiChevronRight,
  FiCheck, FiXCircle
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { sinistreService, clientService, userService } from '../../services/sinistreService';
import toast from 'react-hot-toast';

// Composant Timeline de workflow
const WorkflowTimeline = ({ currentStep, progress }) => {
  const steps = [
    { key: 'PARTIAL', label: 'Partielle', color: 'bg-yellow-500' },
    { key: 'FINALIZED', label: 'Finalisée', color: 'bg-blue-500' },
    { key: 'SUBMITTED', label: 'Soumise', color: 'bg-purple-500' },
    { key: 'VALIDATION', label: 'Validation', color: 'bg-indigo-500' },
    { key: 'APPROVED', label: 'Approuvée', color: 'bg-green-500' },
    { key: 'INDEMNISE', label: 'Indemnisée', color: 'bg-teal-500' }
  ];
  
  const currentIndex = steps.findIndex(s => s.key === currentStep);
  const displayProgress = progress !== undefined ? progress : ((currentIndex + 1) / steps.length) * 100;
  
  return (
    <div className="w-full py-4">
      <div className="relative">
        <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 rounded-full">
          <div className="h-full bg-mutas-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, displayProgress))}%` }} />
        </div>
        <div className="relative flex justify-between">
          {steps.map((step, idx) => {
            const isCompleted = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            
            return (
              <div key={step.key} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all z-10 ${
                  isCompleted ? step.color : 'bg-gray-200'
                } ${isCurrent ? 'ring-4 ring-mutas-200 scale-110' : ''}`}>
                  {isCompleted ? (
                    <FiCheckCircle className="text-white text-sm" />
                  ) : (
                    <div className="w-2 h-2 bg-gray-400 rounded-full" />
                  )}
                </div>
                <span className={`text-xs mt-2 font-medium ${isCompleted ? 'text-gray-700' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Modal Validation par le validateur
const ValidationModal = ({ isOpen, onClose, sinistre, onValidate, experts = [] }) => {
  const [expertId, setExpertId] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  if (!isOpen || !sinistre) return null;

  const handleValidate = async () => {
    if (!expertId) {
      toast.error('Veuillez sélectionner un expert');
      return;
    }
    setIsApproving(true);
    try {
      await onValidate(sinistre.id, expertId);
      onClose();
    } catch (error) {
      console.error('Erreur validation:', error);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-5 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Validation du sinistre</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><FiX size={22} /></button>
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
          
          <div>
            <label className="block text-sm font-medium mb-1">Assigner à un expert *</label>
            <select 
              value={expertId} 
              onChange={(e) => setExpertId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-mutas-500 focus:border-mutas-500"
            >
              <option value="">Sélectionner un expert</option>
              {experts.map(expert => (
                <option key={expert.id} value={expert.id}>{expert.first_name} {expert.last_name} ({expert.username})</option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button 
              onClick={handleValidate}
              disabled={isApproving}
              className="flex-1 bg-green-500 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-600 disabled:opacity-50"
            >
              {isApproving ? <FiLoader className="animate-spin" /> : <FiCheck />}
              {isApproving ? 'Validation...' : 'Valider et transmettre à l\'expert'}
            </button>
            <button onClick={onClose} className="flex-1 border py-2 rounded-lg">Annuler</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Modal Rejet (pour validateur et expert)
const RejectionModal = ({ isOpen, onClose, sinistre, onConfirm, title = "Rejet du sinistre" }) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !sinistre) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error('Veuillez indiquer un motif de rejet');
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm(sinistre.id, reason);
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-5 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-red-600">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><FiX size={22} /></button>
        </div>
        
        <div className="p-5 space-y-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-500">Référence</p>
            <p className="font-mono font-medium">{sinistre.reference}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Motif du rejet *</label>
            <textarea 
              rows={4} 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-red-500 focus:border-red-500"
              placeholder="Expliquez la raison du rejet..."
              required
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button 
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-red-500 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-red-600 disabled:opacity-50"
            >
              {submitting ? <FiLoader className="animate-spin" /> : <FiXCircle />}
              {submitting ? 'Traitement...' : 'Confirmer le rejet'}
            </button>
            <button onClick={onClose} className="flex-1 border py-2 rounded-lg">Annuler</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Modal Détails Sinistre
const SinistreDetailModal = ({ isOpen, onClose, sinistre, documents, loadingDocuments }) => {
  if (!isOpen || !sinistre) return null;

  const getStatusBadge = (status) => {
    const badges = {
      'PARTIAL': 'bg-yellow-100 text-yellow-800',
      'FINALIZED': 'bg-blue-100 text-blue-800',
      'SUBMITTED': 'bg-purple-100 text-purple-800',
      'VALIDATION': 'bg-indigo-100 text-indigo-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'INDEMNISE': 'bg-teal-100 text-teal-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Détails du sinistre</h2>
            <p className="text-sm text-gray-500 font-mono">{sinistre.reference}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition"><FiX size={22} /></button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Progression</h3>
            <WorkflowTimeline currentStep={sinistre.status} progress={sinistre.workflow_progress || 0} />
            <div className="mt-4 flex justify-end">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(sinistre.status)}`}>
                {getStatusLabel(sinistre.status)}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2"><FiCalendar size={16} /><span className="text-xs uppercase">Date incident</span></div>
              <p className="font-medium">{new Date(sinistre.incident_date).toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2"><FiFileText size={16} /><span className="text-xs uppercase">Type</span></div>
              <p className="font-medium">{sinistre.type_sinistre}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2"><FiUser size={16} /><span className="text-xs uppercase">Sinistré</span></div>
              <p className="font-medium">{sinistre.sinistre_name || 'Non renseigné'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2"><FiUserCheck size={16} /><span className="text-xs uppercase">Déclarant</span></div>
              <p className="font-medium">{sinistre.declarant_name || 'Non renseigné'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2"><FiDollarSign size={16} /><span className="text-xs uppercase">Montant estimé</span></div>
              <p className="font-medium">{sinistre.estimated_amount ? `${sinistre.estimated_amount.toLocaleString()} FCFA` : 'Non renseigné'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2"><FiClock size={16} /><span className="text-xs uppercase">Date déclaration</span></div>
              <p className="font-medium">{new Date(sinistre.partial_declaration_date).toLocaleString()}</p>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-2"><FiMapPin size={16} /><span className="text-xs uppercase">Adresse</span></div>
            <p className="font-medium">{sinistre.address || 'Non renseignée'}</p>
          </div>
          
          {sinistre.description && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2"><FiAlertCircle size={16} /><span className="text-xs uppercase">Description</span></div>
              <p className="text-gray-700 whitespace-pre-wrap">{sinistre.description}</p>
            </div>
          )}
          
          {sinistre.rejection_reason && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center gap-2 text-red-600 mb-2"><FiXCircle size={16} /><span className="text-xs uppercase">Motif du rejet</span></div>
              <p className="text-red-700 whitespace-pre-wrap">{sinistre.rejection_reason}</p>
            </div>
          )}
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-2"><FiPaperclip size={16} /><span className="text-xs uppercase">Documents</span></div>
            {loadingDocuments ? (
              <div className="flex justify-center py-4"><FiLoader className="animate-spin text-mutas-500" /></div>
            ) : documents?.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucun document</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {documents?.map((doc, idx) => (
                  <a key={idx} href={doc.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1 bg-white rounded-lg text-sm text-mutas-500 hover:bg-gray-100 border">
                    <FiPaperclip size={12} /> {doc.file_name || 'Document'}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="sticky bottom-0 bg-white border-t px-6 py-4">
          <button onClick={onClose} className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 font-medium">Fermer</button>
        </div>
      </motion.div>
    </div>
  );
};

// Modal Sélection Client
const ClientSelectionModal = ({ isOpen, onClose, clients, loading, onSelectClient }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = (clients || []).filter(c =>
    c.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.code && c.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-5 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Sélectionner un sinistré</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><FiX size={22} /></button>
        </div>
        <div className="p-5">
          <div className="relative mb-4">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Rechercher par nom, email ou code..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><FiLoader className="w-8 h-8 text-mutas-500 animate-spin" /></div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8 text-gray-500"><FiUser size={48} className="mx-auto mb-3 text-gray-300" /><p>Aucun client trouvé</p></div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredClients.map(client => (
                <div key={client.id} onClick={() => onSelectClient(client)} className="border rounded-xl p-4 cursor-pointer hover:border-mutas-500 hover:shadow-lg transition">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-mutas-100 rounded-full flex items-center justify-center"><FiUser className="text-mutas-500" /></div>
                    <div className="flex-1">
                      <p className="font-semibold">{client.user?.first_name} {client.user?.last_name}</p>
                      <p className="text-sm text-gray-500">@{client.user?.username}</p>
                      <div className="flex gap-2 mt-1 text-xs text-gray-400"><span>{client.user?.email}</span><span>{client.user?.phone}</span></div>
                    </div>
                    <div className="text-right"><p className="text-xs text-gray-400">Code: {client.code || client.id}</p></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

function ListeDeclarations() {
  const { user } = useAuth();
  const [sinistres, setSinistres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedSinistre, setSelectedSinistre] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [sinistreDocuments, setSinistreDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  
  // Validation
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [submittedSinistres, setSubmittedSinistres] = useState([]);
  const [experts, setExperts] = useState([]);
  const [selectedValidationSinistre, setSelectedValidationSinistre] = useState(null);
  
  // Nouvelle déclaration
  const [showNewSinistreModal, setShowNewSinistreModal] = useState(false);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientSelectionModal, setShowClientSelectionModal] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [partialForm, setPartialForm] = useState({
    type_sinistre: 'AUTO',
    incident_date: new Date().toISOString().slice(0, 16),
    address: '',
    latitude: null,
    longitude: null
  });
  const [finalForm, setFinalForm] = useState({
    sinistre_id: null,
    description: '',
    damages: '',
    estimated_amount: '',
    media_ids: []
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const canValidate = ['VALIDATEUR', 'ADMIN'].includes(user?.user_type);

  // Fetch sinistres
  const fetchSinistres = async () => {
    setLoading(true);
    try {
      const response = await sinistreService.getMySinistres();
      console.log('Sinistres reçus:', response.data);
      setSinistres(response.data || []);
    } catch (error) {
      console.error('Erreur fetch sinistres:', error);
      toast.error('Erreur lors du chargement des sinistres');
      setSinistres([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch sinistres soumis à valider
  const fetchSubmittedSinistres = async () => {
    try {
      const response = await sinistreService.getSubmittedSinistres();
      setSubmittedSinistres(response.data || []);
    } catch (error) {
      console.error('Erreur fetch submitted:', error);
      setSubmittedSinistres([]);
    }
  };
  
  // Fetch experts
  const fetchExperts = async () => {
    try {
      const response = await userService.getExperts();
      setExperts(response.data || []);
    } catch (error) {
      console.error('Erreur fetch experts:', error);
      setExperts([]);
    }
  };
  
  const fetchDocuments = async (sinistreId) => {
    setLoadingDocuments(true);
    try {
      const response = await sinistreService.getMedia(sinistreId);
      setSinistreDocuments(response.data || []);
    } catch (error) {
      console.error('Erreur chargement documents:', error);
      setSinistreDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };
  
  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const response = await clientService.getClients();
      console.log('Clients reçus:', response.data);
      setClients(response.data || []);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
      toast.error('Erreur lors du chargement des clients');
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  };
  
  useEffect(() => {
    fetchSinistres();
    if (canValidate) {
      fetchSubmittedSinistres();
      fetchExperts();
    }
  }, []);
  
  // Valider une déclaration (validateur -> envoie à l'expert)
  const handleValidateDeclaration = async (sinistreId, expertId) => {
    try {
      await sinistreService.validateDeclaration({
        sinistre_id: sinistreId,
        decision: 'APPROVED',
        expert_id: expertId
      });
      toast.success('Sinistre approuvé et transmis à l\'expert');
      await fetchSinistres();
      await fetchSubmittedSinistres();
      setShowValidationModal(false);
      setSelectedValidationSinistre(null);
    } catch (error) {
      console.error('Erreur validation:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la validation');
      throw error;
    }
  };
  
  // Rejeter une déclaration (validateur)
  const handleRejectDeclaration = async (sinistreId, reason) => {
    try {
      await sinistreService.validateDeclaration({
        sinistre_id: sinistreId,
        decision: 'REJECTED',
        rejection_reason: reason
      });
      toast.success('Sinistre rejeté. Le déclarant peut le modifier.');
      await fetchSinistres();
      await fetchSubmittedSinistres();
      setShowRejectionModal(false);
      setSelectedValidationSinistre(null);
    } catch (error) {
      console.error('Erreur rejet:', error);
      toast.error(error.response?.data?.error || 'Erreur lors du rejet');
      throw error;
    }
  };
  
  const handleSubmitToValidator = async (sinistreId) => {
    try {
      await sinistreService.submitToValidator(sinistreId);
      toast.success('Déclaration soumise au validateur');
      await fetchSinistres();
    } catch (error) {
      console.error('Erreur soumission:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la soumission');
    }
  };
  
  const handleCreatePartial = async (e) => {
    e.preventDefault();
    if (!selectedClient) {
      toast.error('Veuillez sélectionner un client');
      return;
    }
    setSubmitting(true);
    
    const incidentDateTime = partialForm.incident_date;
    const incidentDate = incidentDateTime.split('T')[0];
    const incidentTime = incidentDateTime.split('T')[1] + ':00';
    
    const payload = {
      type_sinistre: partialForm.type_sinistre,
      incident_date: incidentDate,
      incident_time: incidentTime,
      address: partialForm.address,
      latitude: partialForm.latitude ? parseFloat(partialForm.latitude) : null,
      longitude: partialForm.longitude ? parseFloat(partialForm.longitude) : null,
      client_id: selectedClient?.id
    };
    
    console.log('Payload envoyé:', payload);
    
    try {
      const response = await sinistreService.createPartial(payload);
      toast.success('Déclaration partielle créée');
      setFinalForm({ ...finalForm, sinistre_id: response.data.id });
      setStep(2);
    } catch (error) {
      console.error('Erreur création:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleFinalize = async (e) => {
    e.preventDefault();
    if (!finalForm.description) {
      toast.error('Veuillez décrire les circonstances du sinistre');
      return;
    }
    
    setSubmitting(true);
    try {
      await sinistreService.finalizeDeclaration({
        sinistre_id: finalForm.sinistre_id,
        description: finalForm.description,
        damages: finalForm.damages || '',
        estimated_amount: finalForm.estimated_amount ? parseFloat(finalForm.estimated_amount) : null,
        media_ids: finalForm.media_ids
      });
      toast.success('Déclaration finalisée avec succès');
      resetForm();
      await fetchSinistres();
    } catch (error) {
      console.error('Erreur finalisation:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la finalisation');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!finalForm.sinistre_id) {
      toast.error('Aucun sinistre associé');
      return;
    }
    
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} dépasse 10MB`);
        continue;
      }
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('media_type', file.type.startsWith('image/') ? 'PHOTO' : 'DOCUMENT');
      
      try {
        const response = await sinistreService.uploadMedia(finalForm.sinistre_id, formData);
        setUploadedFiles(prev => [...prev, { id: response.data.id, name: file.name }]);
        setFinalForm(prev => ({ ...prev, media_ids: [...prev.media_ids, response.data.id] }));
        toast.success(`${file.name} uploadé`);
      } catch (error) {
        console.error('Erreur upload:', error);
        toast.error(`Erreur upload ${file.name}`);
      }
    }
  };
  
  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setFinalForm(prev => ({ ...prev, media_ids: prev.media_ids.filter((_, i) => i !== index) }));
  };
  
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPartialForm(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
          toast.success('Position géographique obtenue');
        },
        () => toast.error('Impossible d\'obtenir la position')
      );
    } else {
      toast.error('Géolocalisation non supportée');
    }
  };
  
  const resetForm = () => {
    setStep(1);
    setSelectedClient(null);
    setPartialForm({
      type_sinistre: 'AUTO',
      incident_date: new Date().toISOString().slice(0, 16),
      address: '',
      latitude: null,
      longitude: null
    });
    setFinalForm({
      sinistre_id: null,
      description: '',
      damages: '',
      estimated_amount: '',
      media_ids: []
    });
    setUploadedFiles([]);
    setShowNewSinistreModal(false);
    setShowClientSelectionModal(false);
  };
  
  const openValidationModal = (sinistre) => {
    setSelectedValidationSinistre(sinistre);
    setShowValidationModal(true);
  };
  
  const openRejectionModal = (sinistre) => {
    setSelectedValidationSinistre(sinistre);
    setShowRejectionModal(true);
  };
  
  const getStatusBadge = (status) => {
    const badges = {
      'PARTIAL': 'bg-yellow-100 text-yellow-800',
      'FINALIZED': 'bg-blue-100 text-blue-800',
      'SUBMITTED': 'bg-purple-100 text-purple-800',
      'VALIDATION': 'bg-indigo-100 text-indigo-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'INDEMNISE': 'bg-teal-100 text-teal-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };
  
  const getStatusLabel = (status) => {
    const labels = {
      'PARTIAL': 'Partielle',
      'FINALIZED': 'Finalisée',
      'SUBMITTED': 'Soumise',
      'VALIDATION': 'En validation',
      'APPROVED': 'Approuvé',
      'REJECTED': 'Rejeté',
      'INDEMNISE': 'Indemnisé',
    };
    return labels[status] || status;
  };
  
  const filteredSinistres = (sinistres || []).filter(s => {
    let match = true;
    if (searchTerm && !s.reference?.toLowerCase().includes(searchTerm.toLowerCase())) match = false;
    if (statusFilter && s.status !== statusFilter) match = false;
    if (typeFilter && s.type_sinistre !== typeFilter) match = false;
    return match;
  });
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSinistres = filteredSinistres.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSinistres.length / itemsPerPage);
  
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <FiLoader className="w-12 h-12 text-mutas-500 animate-spin" />
        <p className="mt-4 text-gray-500">Chargement des sinistres...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestion des sinistres</h1>
          <p className="text-gray-500 mt-1">Déclarations, suivi et capitalisation</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchSinistres} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
            <FiRefreshCw /> Actualiser
          </button>
          {canValidate && submittedSinistres.length > 0 && (
            <div className="relative">
              <button 
                onClick={() => document.getElementById('submitted-list')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
              >
                <FiUserCheck /> À valider ({submittedSinistres.length})
              </button>
            </div>
          )}
          <button onClick={() => { setShowClientSelectionModal(true); fetchClients(); }} className="flex items-center gap-2 bg-mutas-500 text-white px-4 py-2 rounded-lg hover:bg-mutas-600 transition">
            <FiPlus /> Nouvelle déclaration
          </button>
        </div>
      </div>
      
      {/* Liste des sinistres à valider */}
      {canValidate && submittedSinistres.length > 0 && (
        <div id="submitted-list" className="bg-orange-50 rounded-xl p-4 border border-orange-200">
          <h2 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
            <FiUserCheck /> Sinistres à valider ({submittedSinistres.length})
          </h2>
          <div className="space-y-2">
            {submittedSinistres.map(s => (
              <div key={s.id} className="bg-white rounded-lg p-3 flex justify-between items-center">
                <div>
                  <p className="font-mono font-medium">{s.reference}</p>
                  <p className="text-sm text-gray-500">{s.sinistre_name} - {s.type_sinistre}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { fetchDocuments(s.id); openValidationModal(s); }} 
                    className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                  >
                    Valider
                  </button>
                  <button 
                    onClick={() => openRejectionModal(s)} 
                    className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                  >
                    Rejeter
                  </button>
                  <button 
                    onClick={() => { setSelectedSinistre(s); fetchDocuments(s.id); setShowDetailModal(true); }} 
                    className="px-3 py-1 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600"
                  >
                    Voir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Rechercher par référence..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-mutas-500 focus:border-mutas-500" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
            <option value="">Tous les statuts</option>
            {['PARTIAL', 'FINALIZED', 'SUBMITTED', 'VALIDATION', 'APPROVED', 'REJECTED', 'INDEMNISE'].map(s => (
              <option key={s} value={s}>{getStatusLabel(s)}</option>
            ))}
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
            <option value="">Tous les types</option>
            {['AUTO', 'HAB', 'SAN', 'VOY', 'TRN', 'AUT'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="px-3 py-2 border rounded-lg">
            <option value={10}>10 par page</option>
            <option value={20}>20 par page</option>
            <option value={50}>50 par page</option>
          </select>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sinistré</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date incident</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {currentSinistres.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <FiFileText size={48} className="mx-auto mb-3 text-gray-300" />
                    <p>Aucun sinistre trouvé</p>
                    <button onClick={() => { setShowClientSelectionModal(true); fetchClients(); }} className="mt-2 text-mutas-500 hover:underline">Créer une déclaration</button>
                  </td>
                </tr>
              ) : (
                currentSinistres.map(sinistre => (
                  <tr key={sinistre.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-mono text-sm font-medium text-gray-900">{sinistre.reference}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-mutas-100 rounded-full flex items-center justify-center">
                          <FiUser className="text-mutas-500 text-sm" />
                        </div>
                        <span className="font-medium">{sinistre.sinistre_name || 'Non assigné'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{sinistre.type_sinistre}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(sinistre.status)}`}>
                        {getStatusLabel(sinistre.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{new Date(sinistre.incident_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {sinistre.estimated_amount ? `${sinistre.estimated_amount.toLocaleString()} FCFA` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setSelectedSinistre(sinistre); fetchDocuments(sinistre.id); setShowDetailModal(true); }} 
                          className="p-2 text-mutas-500 hover:bg-mutas-50 rounded-lg transition" 
                          title="Voir détails"
                        >
                          <FiEye size={18} />
                        </button>
                        {sinistre.status === 'FINALIZED' && (
                          <button 
                            onClick={() => handleSubmitToValidator(sinistre.id)} 
                            className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition" 
                            title="Soumettre au validateur"
                          >
                            <FiUpload size={18} />
                          </button>
                        )}
                        {sinistre.status === 'SUBMITTED' && canValidate && (
                          <>
                            <button 
                              onClick={() => openValidationModal(sinistre)} 
                              className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition" 
                              title="Valider"
                            >
                              <FiCheck size={18} />
                            </button>
                            <button 
                              onClick={() => openRejectionModal(sinistre)} 
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" 
                              title="Rejeter"
                            >
                              <FiXCircle size={18} />
                            </button>
                          </>
                        )}
                        {sinistre.status === 'REJECTED' && sinistre.declarant?.id === user?.id && (
                          <button 
                            onClick={() => {}} 
                            className="p-2 text-yellow-500 hover:bg-yellow-50 rounded-lg transition" 
                            title="Modifier (déclaration rejetée)"
                          >
                            <FiEdit2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {filteredSinistres.length > 0 && (
          <div className="px-6 py-4 border-t flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, filteredSinistres.length)} sur {filteredSinistres.length}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition flex items-center gap-1">
                <FiChevronLeft size={16} /> Précédent
              </button>
              <span className="px-3 py-1 bg-mutas-500 text-white rounded-lg">{currentPage}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition flex items-center gap-1">
                Suivant <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
      
      <ClientSelectionModal 
        isOpen={showClientSelectionModal} 
        onClose={() => setShowClientSelectionModal(false)} 
        clients={clients} 
        loading={loadingClients} 
        onSelectClient={(client) => { setSelectedClient(client); setShowClientSelectionModal(false); setShowNewSinistreModal(true); }} 
      />
      
      <AnimatePresence>
        {showNewSinistreModal && selectedClient && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-8">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4">
              <div className="sticky top-0 bg-white p-5 border-b flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <FiUser className="text-mutas-500" />
                  <div>
                    <p className="font-medium">Nouvelle déclaration</p>
                    <p className="text-sm text-gray-500">Client: {selectedClient.user?.first_name} {selectedClient.user?.last_name}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-mutas-500 text-white' : 'bg-gray-200'}`}>1</div>
                    <span className="text-sm">Partielle</span>
                    <div className="w-8 h-0.5 bg-gray-200"><div className={`h-full bg-mutas-500 transition-all ${step >= 2 ? 'w-full' : 'w-0'}`} /></div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-mutas-500 text-white' : 'bg-gray-200'}`}>2</div>
                    <span className="text-sm">Finale</span>
                  </div>
                </div>
                <button onClick={resetForm}><FiX size={24} /></button>
              </div>
              
              <div className="p-6">
                {step === 1 ? (
                  <form onSubmit={handleCreatePartial} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Type de sinistre *</label>
                      <select value={partialForm.type_sinistre} onChange={(e) => setPartialForm({...partialForm, type_sinistre: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                        <option value="AUTO">Automobile</option>
                        <option value="HAB">Habitation</option>
                        <option value="SAN">Santé</option>
                        <option value="VOY">Voyage</option>
                        <option value="TRN">Transport</option>
                        <option value="AUT">Autre</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Date et heure de l'incident *</label>
                      <input type="datetime-local" value={partialForm.incident_date} onChange={(e) => setPartialForm({...partialForm, incident_date: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Adresse du sinistre *</label>
                      <textarea rows={2} value={partialForm.address} onChange={(e) => setPartialForm({...partialForm, address: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
                    </div>
                    <div>
                      <button type="button" onClick={getCurrentLocation} className="flex items-center gap-2 text-mutas-500"><FiMapPin /> Obtenir ma position actuelle</button>
                      {partialForm.latitude && <p className="text-xs text-gray-500 mt-1">Lat: {partialForm.latitude}, Lng: {partialForm.longitude}</p>}
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button type="submit" disabled={submitting} className="flex-1 bg-mutas-500 text-white py-2 rounded-lg disabled:opacity-50">{submitting ? 'Création...' : 'Créer la déclaration partielle'}</button>
                      <button type="button" onClick={resetForm} className="flex-1 border py-2 rounded-lg">Annuler</button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleFinalize} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Description des circonstances *</label>
                      <textarea rows={3} value={finalForm.description} onChange={(e) => setFinalForm({...finalForm, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Dégâts constatés</label>
                      <textarea rows={2} value={finalForm.damages} onChange={(e) => setFinalForm({...finalForm, damages: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Montant estimé (FCFA)</label>
                      <input type="number" value={finalForm.estimated_amount} onChange={(e) => setFinalForm({...finalForm, estimated_amount: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Pièces jointes</label>
                      <label className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-gray-50"><FiUpload /> Upload fichiers<input type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*,application/pdf" /></label>
                      {uploadedFiles.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {uploadedFiles.map((file, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                              <span>{file.name}</span>
                              <button onClick={() => removeFile(idx)} className="text-red-500"><FiTrash2 size={14} /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button type="submit" disabled={submitting} className="flex-1 bg-mutas-500 text-white py-2 rounded-lg disabled:opacity-50">{submitting ? 'Finalisation...' : 'Finaliser la déclaration'}</button>
                      <button type="button" onClick={() => setStep(1)} className="flex-1 border py-2 rounded-lg">Retour</button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <SinistreDetailModal 
        isOpen={showDetailModal} 
        onClose={() => { setShowDetailModal(false); setSelectedSinistre(null); }} 
        sinistre={selectedSinistre} 
        documents={sinistreDocuments}
        loadingDocuments={loadingDocuments}
      />
      
      <ValidationModal 
        isOpen={showValidationModal}
        onClose={() => { setShowValidationModal(false); setSelectedValidationSinistre(null); }}
        sinistre={selectedValidationSinistre}
        onValidate={handleValidateDeclaration}
        experts={experts}
      />
      
      <RejectionModal 
        isOpen={showRejectionModal}
        onClose={() => { setShowRejectionModal(false); setSelectedValidationSinistre(null); }}
        sinistre={selectedValidationSinistre}
        onConfirm={handleRejectDeclaration}
        title="Rejet du sinistre (Validateur)"
      />
    </div>
  );
}

export default ListeDeclarations;