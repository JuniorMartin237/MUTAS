// src/components/Messages/NewConversationModal.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, FiUsers, FiFileText, FiUser, FiSearch, FiCheck, 
  FiMessageSquare, FiBriefcase, FiChevronRight, FiUserPlus
} from 'react-icons/fi';
import { useMessages } from '../../contexts/MessageContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';
import toast from 'react-hot-toast';

const NewConversationModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { 
    createDirectConversation, 
    createConversationFromSinistre, 
    createConversationWithManager,
    allUsers,
    fetchConversations 
  } = useMessages();
  
  const [step, setStep] = useState(1);
  const [conversationType, setConversationType] = useState(null);
  const [sinistres, setSinistres] = useState([]);
  const [managers, setManagers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedSinistre, setSelectedSinistre] = useState(null);
  const [selectedManager, setSelectedManager] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isOpen && step === 2) {
      if (conversationType === 'sinistre') {
        fetchSinistres();
      } else if (conversationType === 'manager') {
        fetchManagers();
      }
    }
  }, [isOpen, step, conversationType]);

  const fetchSinistres = async () => {
    setLoading(true);
    try {
      const response = await api.get('/sinistres/my/');
      // Filtrer les sinistres où l'utilisateur est impliqué et qui ne sont pas clôturés
      const relevantSinistres = response.data.filter(s => 
        s.status !== 'CLOSED' && (
          s.sinistre?.id === user?.id || 
          s.declarant?.id === user?.id ||
          s.validateur?.id === user?.id ||
          s.expert?.id === user?.id ||
          s.directeur?.id === user?.id
        )
      );
      setSinistres(relevantSinistres);
    } catch (error) {
      console.error('Erreur chargement sinistres:', error);
      toast.error('Erreur lors du chargement des sinistres');
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    setLoading(true);
    try {
      // Récupérer les utilisateurs avec les rôles de gestion (VALIDATEUR, EXPERT, DIRECTEUR, ADMIN)
      const response = await api.get('/accounts/all-users/');
      const managerRoles = ['VALIDATEUR', 'EXPERT', 'DIRECTEUR', 'ADMIN'];
      const managersList = response.data.filter(u => 
        managerRoles.includes(u.user_type) && u.id !== user?.id
      );
      setManagers(managersList);
    } catch (error) {
      console.error('Erreur chargement gestionnaires:', error);
      toast.error('Erreur lors du chargement des gestionnaires');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConversation = async () => {
    setCreating(true);
    try {
      let response;
      if (conversationType === 'direct' && selectedUser) {
        response = await createDirectConversation(selectedUser.id);
      } else if (conversationType === 'sinistre' && selectedSinistre) {
        response = await createConversationFromSinistre(selectedSinistre.id);
      } else if (conversationType === 'manager' && selectedManager) {
        response = await createConversationWithManager(selectedManager.id);
      }
      
      if (response) {
        toast.success('Conversation créée avec succès');
        await fetchConversations();
        onSuccess?.(response);
        onClose();
        resetForm();
      }
    } catch (error) {
      console.error('Erreur création conversation:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setConversationType(null);
    setSelectedUser(null);
    setSelectedSinistre(null);
    setSelectedManager(null);
    setSearchTerm('');
  };

  const getRoleLabel = (userType) => {
    const roles = {
      'SINISTRE': 'Sinistré',
      'DECLARANT': 'Déclarant',
      'VALIDATEUR': 'Validateur',
      'EXPERT': 'Expert',
      'DIRECTEUR': 'Directeur',
      'ADMIN': 'Administrateur',
      'AUDITEUR': 'Auditeur',
      'EMPLOYE': 'Employé',
      'SOUSCRIPTEUR': 'Souscripteur',
      'MEMBRE': 'Membre'
    };
    return roles[userType] || userType;
  };

  const getStatusLabel = (status) => {
    const labels = {
      'PARTIAL': 'Déclaration partielle',
      'FINALIZED': 'Finalisée',
      'SUBMITTED': 'Soumise',
      'VALIDATION': 'En validation',
      'EXPERTISE': 'En expertise',
      'APPROVED': 'Approuvé',
      'REJECTED': 'Rejeté',
      'INDEMNISE': 'Indemnisé'
    };
    return labels[status] || status;
  };

  const filteredUsers = allUsers.filter(u =>
    u.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSinistres = sinistres.filter(s =>
    s.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredManagers = managers.filter(m =>
    m.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg"
          >
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Nouvelle conversation</h2>
              <button onClick={() => { resetForm(); onClose(); }} className="hover:bg-gray-100 p-1 rounded-full">
                <FiX size={24} />
              </button>
            </div>
            
            <div className="p-6">
              {step === 1 ? (
                <div className="space-y-4">
                  <button
                    onClick={() => { setConversationType('direct'); setStep(2); }}
                    className="w-full p-4 border rounded-xl hover:border-mutas-500 hover:bg-mutas-50 transition-all text-left flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <FiUserPlus className="text-purple-500" />
                      </div>
                      <div>
                        <p className="font-medium">Avec un autre utilisateur</p>
                        <p className="text-sm text-gray-500">Discuter avec n'importe quel utilisateur de la plateforme</p>
                      </div>
                    </div>
                    <FiChevronRight className="text-gray-400" />
                  </button>
                  
                  <button
                    onClick={() => { setConversationType('sinistre'); setStep(2); }}
                    className="w-full p-4 border rounded-xl hover:border-mutas-500 hover:bg-mutas-50 transition-all text-left flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FiFileText className="text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium">À partir d'une déclaration</p>
                        <p className="text-sm text-gray-500">Discuter avec tous les acteurs d'un sinistre</p>
                      </div>
                    </div>
                    <FiChevronRight className="text-gray-400" />
                  </button>
                  
                  <button
                    onClick={() => { setConversationType('manager'); setStep(2); }}
                    className="w-full p-4 border rounded-xl hover:border-mutas-500 hover:bg-mutas-50 transition-all text-left flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <FiBriefcase className="text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium">Avec mon gestionnaire</p>
                        <p className="text-sm text-gray-500">Échanger avec un validateur, expert ou directeur</p>
                      </div>
                    </div>
                    <FiChevronRight className="text-gray-400" />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={() => setStep(1)}
                    className="text-mutas-500 text-sm flex items-center gap-1 hover:underline mb-2"
                  >
                    ← Retour
                  </button>
                  
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-800"
                    />
                  </div>
                  
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="w-8 h-8 border-4 border-mutas-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : conversationType === 'direct' ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredUsers.map(u => (
                        <button
                          key={u.id}
                          onClick={() => setSelectedUser(u)}
                          className={`w-full p-3 border rounded-lg text-left transition-all ${
                            selectedUser?.id === u.id 
                              ? 'border-mutas-500 bg-mutas-50' 
                              : 'hover:border-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                <FiUser className="text-gray-500" />
                              </div>
                              <div>
                                <p className="font-medium">{u.first_name} {u.last_name}</p>
                                <p className="text-sm text-gray-500">@{u.username}</p>
                                <p className="text-xs text-gray-400">{getRoleLabel(u.user_type)}</p>
                              </div>
                            </div>
                            {selectedUser?.id === u.id && <FiCheck className="text-mutas-500" />}
                          </div>
                        </button>
                      ))}
                      {filteredUsers.length === 0 && (
                        <p className="text-center py-8 text-gray-500">Aucun utilisateur trouvé</p>
                      )}
                    </div>
                  ) : conversationType === 'sinistre' ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredSinistres.map(s => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedSinistre(s)}
                          className={`w-full p-3 border rounded-lg text-left transition-all ${
                            selectedSinistre?.id === s.id 
                              ? 'border-mutas-500 bg-mutas-50' 
                              : 'hover:border-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-mono font-medium">{s.reference}</p>
                              <p className="text-sm text-gray-500">{s.get_type_sinistre_display || s.type_sinistre}</p>
                              <p className="text-xs text-gray-400">Statut: {getStatusLabel(s.status)}</p>
                            </div>
                            {selectedSinistre?.id === s.id && <FiCheck className="text-mutas-500" />}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {s.sinistre?.username && `Sinistré: ${s.sinistre.username}`}
                            {s.declarant?.username && ` - Déclarant: ${s.declarant.username}`}
                            {s.validateur?.username && ` - Validateur: ${s.validateur.username}`}
                            {s.expert?.username && ` - Expert: ${s.expert.username}`}
                          </p>
                        </button>
                      ))}
                      {filteredSinistres.length === 0 && (
                        <p className="text-center py-8 text-gray-500">Aucun sinistre trouvé</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredManagers.map(m => (
                        <button
                          key={m.id}
                          onClick={() => setSelectedManager(m)}
                          className={`w-full p-3 border rounded-lg text-left transition-all ${
                            selectedManager?.id === m.id 
                              ? 'border-mutas-500 bg-mutas-50' 
                              : 'hover:border-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                <FiUser className="text-gray-500" />
                              </div>
                              <div>
                                <p className="font-medium">{m.first_name} {m.last_name}</p>
                                <p className="text-sm text-gray-500">@{m.username}</p>
                                <p className="text-xs text-gray-400">{getRoleLabel(m.user_type)}</p>
                              </div>
                            </div>
                            {selectedManager?.id === m.id && <FiCheck className="text-mutas-500" />}
                          </div>
                        </button>
                      ))}
                      {filteredManagers.length === 0 && (
                        <p className="text-center py-8 text-gray-500">Aucun gestionnaire trouvé</p>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleCreateConversation}
                      disabled={creating || (!selectedUser && !selectedSinistre && !selectedManager)}
                      className="flex-1 bg-mutas-500 text-white py-2 rounded-lg disabled:opacity-50"
                    >
                      {creating ? 'Création...' : 'Créer la conversation'}
                    </button>
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 border py-2 rounded-lg"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NewConversationModal;