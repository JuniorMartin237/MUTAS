// src/pages/Messages/MessagesPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FiMessageSquare, FiInfo, FiRefreshCw } from 'react-icons/fi';
import { MessageProvider, useMessages } from '../../contexts/MessageContext';
import ConversationList from '../../components/Messages/ConversationList';
import MessageBubble from '../../components/Messages/MessageBubble';
import MessageInput from '../../components/Messages/MessageInput';
import ConversationDetailModal from '../../components/Messages/ConversationDetailModal';
import NewConversationModal from '../../components/Messages/NewConversationModal';

function MessagesContent() {
  const { 
    messages, 
    currentConversation, 
    loading, 
    fetchConversations,
    fetchArchivedConversations,
    selectConversation,
    fetchMessages
  } = useMessages();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showNewConvModal, setShowNewConvModal] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleRefresh = async () => {
    setError(null);
    try {
      await Promise.all([fetchConversations(), fetchArchivedConversations()]);
      if (currentConversation) {
        await fetchMessages(currentConversation.id);
      }
    } catch (err) {
      setError('Erreur lors du rafraîchissement');
      console.error(err);
    }
  };

  const handleReplyClick = (message) => {
    setReplyTo(message);
  };

  const handleCancelReply = () => {
    setReplyTo(null);
  };

  const handleSelectConversation = async (conversation) => {
    setError(null);
    try {
      await selectConversation(conversation);
    } catch (err) {
      setError('Impossible de charger les messages');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-mutas-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)]">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden h-full flex">
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <ConversationList 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm}
            onNewConversation={() => setShowNewConvModal(true)}
          />
        </div>

        <div className="flex-1 flex flex-col">
          {currentConversation ? (
            <>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">
                    {currentConversation.participant_name || currentConversation.title || 'Conversation'}
                  </h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleRefresh}
                    className="p-2 text-gray-500 hover:text-mutas-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Rafraîchir"
                  >
                    <FiRefreshCw size={18} />
                  </button>
                  <button
                    onClick={() => setShowDetailModal(true)}
                    className="p-2 text-gray-500 hover:text-mutas-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Détails"
                  >
                    <FiInfo size={18} />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-center">
                    {error}
                    <button onClick={handleRefresh} className="ml-2 underline">Réessayer</button>
                  </div>
                )}
                
                {messages.length === 0 && !error ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <FiMessageSquare className="text-4xl mb-2" />
                    <p>Aucun message</p>
                    <p className="text-sm">Soyez le premier à envoyer un message</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <MessageBubble 
                      key={msg.id} 
                      message={msg} 
                      onReplyClick={() => handleReplyClick(msg)}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <MessageInput 
                replyTo={replyTo}
                onCancelReply={handleCancelReply}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <FiMessageSquare className="text-5xl mb-4 opacity-50" />
              <p className="text-lg">Sélectionnez une conversation</p>
              <p className="text-sm">ou créez-en une nouvelle</p>
              <button
                onClick={() => setShowNewConvModal(true)}
                className="mt-4 px-4 py-2 bg-mutas-500 text-white rounded-lg hover:bg-mutas-600"
              >
                Nouvelle conversation
              </button>
            </div>
          )}
        </div>
      </div>
      
      <ConversationDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        conversation={currentConversation}
        onUpdate={handleRefresh}
      />
      
      <NewConversationModal
        isOpen={showNewConvModal}
        onClose={() => setShowNewConvModal(false)}
        onSuccess={(newConv) => {
          if (newConv) {
            handleSelectConversation(newConv);
          }
          handleRefresh();
        }}
      />
    </div>
  );
}

function MessagesPage() {
  return (
    <MessageProvider>
      <MessagesContent />
    </MessageProvider>
  );
}

export default MessagesPage;