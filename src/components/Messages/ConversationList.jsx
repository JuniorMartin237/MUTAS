// src/components/Messages/ConversationList.jsx
import React, { useState } from 'react';
import { FiSearch, FiUser, FiArchive, FiUsers, FiMessageSquare, FiPlus, FiInbox, FiRefreshCw } from 'react-icons/fi';
import { useMessages } from '../../contexts/MessageContext';
import { useAuth } from '../../contexts/AuthContext';

const ConversationList = ({ onNewConversation, searchTerm, setSearchTerm }) => {
  const { 
    conversations, 
    archivedConversations,
    selectConversation, 
    currentConversation, 
    archiveConversation,
    restoreConversation,
    showArchived,
    setShowArchived,
    onlineUsers,
    fetchConversations,
    fetchArchivedConversations
  } = useMessages();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchConversations(), fetchArchivedConversations()]);
    setRefreshing(false);
  };

  const displayConversations = showArchived ? archivedConversations : conversations;

  const filteredConversations = displayConversations.filter(conv =>
    conv.participant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getParticipantInfo = (conv) => {
    if (conv.is_group) {
      return {
        name: conv.title || 'Groupe',
        icon: <FiUsers size={18} />,
        color: 'bg-purple-100 text-purple-500'
      };
    }
    const otherParticipant = conv.participants?.find(p => p.id !== user?.id);
    return {
      name: conv.participant_name || otherParticipant?.username || 'Utilisateur',
      role: otherParticipant?.user_type,
      icon: <FiUser size={18} />,
      color: 'bg-mutas-100 text-mutas-500'
    };
  };

  const getRoleLabel = (userType) => {
    const roles = {
      'SINISTRE': 'Sinistré',
      'DECLARANT': 'Déclarant',
      'VALIDATEUR': 'Validateur',
      'EXPERT': 'Expert',
      'DIRECTEUR': 'Directeur',
      'ADMIN': 'Admin'
    };
    return roles[userType] || '';
  };

  const isUserOnline = (conv) => {
    if (conv.is_group) return false;
    const otherParticipant = conv.participants?.find(p => p.id !== user?.id);
    return onlineUsers.includes(otherParticipant?.id);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative mb-3">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une conversation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-mutas-500 focus:border-mutas-500 dark:bg-gray-800"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onNewConversation}
            className="flex-1 flex items-center justify-center gap-2 bg-mutas-500 text-white py-2 rounded-lg hover:bg-mutas-600 transition-colors"
          >
            <FiPlus size={18} /> Nouvelle conversation
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Actualiser"
          >
            <FiRefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
        
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setShowArchived(false)}
            className={`flex-1 py-1.5 text-sm rounded-lg transition-colors ${
              !showArchived 
                ? 'bg-mutas-500 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Actives
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className={`flex-1 py-1.5 text-sm rounded-lg transition-colors flex items-center justify-center gap-1 ${
              showArchived 
                ? 'bg-gray-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <FiArchive size={14} /> Archives
            {archivedConversations.length > 0 && (
              <span className="ml-1 text-xs">{archivedConversations.length}</span>
            )}
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {showArchived ? (
              <>
                <FiArchive className="mx-auto text-3xl mb-2" />
                <p>Aucune conversation archivée</p>
              </>
            ) : (
              <>
                <FiMessageSquare className="mx-auto text-3xl mb-2" />
                <p>Aucune conversation active</p>
                <button onClick={onNewConversation} className="text-mutas-500 text-sm mt-2 hover:underline">
                  Créer une nouvelle conversation
                </button>
              </>
            )}
          </div>
        ) : (
          filteredConversations.map(conv => {
            const { name, role, icon, color } = getParticipantInfo(conv);
            const isOnline = isUserOnline(conv);
            
            return (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 ${
                  currentConversation?.id === conv.id ? 'bg-mutas-50 dark:bg-mutas-900/20' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${color} rounded-full flex items-center justify-center relative`}>
                    {icon}
                    {isOnline && !showArchived && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium truncate">{name}</p>
                        {role && <p className="text-xs text-gray-400">{getRoleLabel(role)}</p>}
                      </div>
                      {conv.last_message_date && !showArchived && (
                        <span className="text-xs text-gray-400">
                          {new Date(conv.last_message_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{conv.last_message || 'Aucun message'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {conv.unread_count > 0 && !showArchived && (
                      <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {conv.unread_count}
                      </span>
                    )}
                    {!showArchived ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          archiveConversation(conv.id);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                        title="Archiver"
                      >
                        <FiArchive size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          restoreConversation(conv.id);
                        }}
                        className="text-green-500 hover:text-green-600"
                        title="Restaurer"
                      >
                        <FiInbox size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationList;