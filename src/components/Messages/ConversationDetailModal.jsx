// src/components/Messages/ConversationDetailModal.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, FiUsers, FiUserPlus, FiArchive, FiInfo, FiMail, 
  FiCalendar, FiCheck, FiSearch, FiUser
} from 'react-icons/fi';
import { useMessages } from '../../contexts/MessageContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';
import toast from 'react-hot-toast';

const ConversationDetailModal = ({ isOpen, onClose, conversation, onUpdate }) => {
  const { user } = useAuth();
  const { addParticipants, archiveConversation, getConversationDetails, allUsers } = useMessages();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAddParticipants, setShowAddParticipants] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [addingUsers, setAddingUsers] = useState(false);

  useEffect(() => {
    if (isOpen && conversation) {
      loadDetails();
    }
  }, [isOpen, conversation]);

  const loadDetails = async () => {
    setLoading(true);
    const data = await getConversationDetails(conversation.id);
    setDetails(data);
    setLoading(false);
  };

  const searchAvailableUsers = (query) => {
    if (!query.trim()) {
      setAvailableUsers([]);
      return;
    }
    const filtered = allUsers.filter(u => 
      (u.first_name?.toLowerCase().includes(query.toLowerCase()) ||
       u.last_name?.toLowerCase().includes(query.toLowerCase()) ||
       u.username?.toLowerCase().includes(query.toLowerCase())) &&
      !details?.participants?.some(p => p.id === u.id)
    );
    setAvailableUsers(filtered);
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      searchAvailableUsers(searchUser);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchUser, allUsers, details]);

  const handleAddParticipants = async () => {
    if (selectedUsers.length === 0) return;
    setAddingUsers(true);
    await addParticipants(conversation.id, selectedUsers);
    setSelectedUsers([]);
    setShowAddParticipants(false);
    setSearchUser('');
    loadDetails();
    onUpdate?.();
    setAddingUsers(false);
  };

  const handleArchive = async () => {
    if (window.confirm('Archiver cette conversation ?')) {
      await archiveConversation(conversation.id);
      onClose();
      onUpdate?.();
    }
  };

  const canAddParticipants = details?.participants?.some(p => 
    p.id === user?.id && (details.created_by === user?.id || user.user_type === 'ADMIN')
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
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          >
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-5 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FiInfo /> Détails de la conversation
              </h2>
              <button onClick={onClose} className="hover:bg-gray-100 p-1 rounded-full">
                <FiX size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-mutas-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : details ? (
                <div className="space-y-6">
                  {/* Informations générales */}
                  <div className="border-b pb-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <FiMail /> Informations générales
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-500">Titre:</span> {details.title || 'Conversation'}</p>
                      <p><span className="text-gray-500">Type:</span> {details.is_group ? 'Groupe' : 'Conversation privée'}</p>
                      <p><span className="text-gray-500">Créé le:</span> {new Date(details.created_at).toLocaleString()}</p>
                      {details.sinistre && (
                        <p><span className="text-gray-500">Sinistre lié:</span> {details.sinistre.reference}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Participants */}
                  <div className="border-b pb-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold flex items-center gap-2">
                        <FiUsers /> Participants ({details.participants?.length || 0})
                      </h3>
                      {canAddParticipants && !showAddParticipants && (
                        <button
                          onClick={() => setShowAddParticipants(true)}
                          className="text-mutas-500 text-sm flex items-center gap-1 hover:underline"
                        >
                          <FiUserPlus size={14} /> Ajouter
                        </button>
                      )}
                    </div>
                    
                    {showAddParticipants && (
                      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="relative mb-3">
                          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Rechercher des utilisateurs..."
                            value={searchUser}
                            onChange={(e) => setSearchUser(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-800"
                          />
                        </div>
                        
                        {availableUsers.length > 0 && (
                          <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                            {availableUsers.map(u => (
                              <label key={u.id} className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedUsers.includes(u.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedUsers([...selectedUsers, u.id]);
                                    } else {
                                      setSelectedUsers(selectedUsers.filter(id => id !== u.id));
                                    }
                                  }}
                                  className="w-4 h-4 text-mutas-500 rounded"
                                />
                                <div>
                                  <p className="text-sm font-medium">{u.first_name} {u.last_name}</p>
                                  <p className="text-xs text-gray-500">@{u.username}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <button
                            onClick={handleAddParticipants}
                            disabled={addingUsers || selectedUsers.length === 0}
                            className="flex-1 bg-mutas-500 text-white py-2 rounded-lg text-sm disabled:opacity-50"
                          >
                            {addingUsers ? 'Ajout...' : `Ajouter (${selectedUsers.length})`}
                          </button>
                          <button
                            onClick={() => {
                              setShowAddParticipants(false);
                              setSelectedUsers([]);
                              setSearchUser('');
                            }}
                            className="px-4 py-2 border rounded-lg text-sm"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      {details.participants?.map(p => (
                        <div key={p.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                          <div className="w-8 h-8 bg-mutas-100 rounded-full flex items-center justify-center">
                            <FiUser className="text-mutas-500" size={14} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{p.first_name} {p.last_name}</p>
                            <p className="text-xs text-gray-500">@{p.username}</p>
                          </div>
                          {p.id === user?.id && (
                            <span className="text-xs text-mutas-500">Vous</span>
                          )}
                          {details.created_by === p.id && (
                            <span className="text-xs text-gray-400">Créateur</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="pt-2">
                    <button
                      onClick={handleArchive}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <FiArchive /> Archiver la conversation
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">Impossible de charger les détails</div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConversationDetailModal;