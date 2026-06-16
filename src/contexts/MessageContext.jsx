// src/contexts/MessageContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

export const MessageContext = createContext();

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within MessageProvider');
  }
  return context;
};

export const MessageProvider = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [archivedConversations, setArchivedConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [allUsers, setAllUsers] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);

  const fetchAllUsers = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await api.get('/accounts/all-users/');
      const otherUsers = response.data.filter(u => u.id !== user?.id);
      setAllUsers(otherUsers);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    }
  }, [user]);

  const fetchConversations = useCallback(async () => {
    try {
      const response = await api.get('/messages/conversations/');
      setConversations(response.data || []);
    } catch (error) {
      console.error('Erreur chargement conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchArchivedConversations = useCallback(async () => {
    try {
      const response = await api.get('/messages/conversations/archived/');
      setArchivedConversations(response.data || []);
    } catch (error) {
      console.error('Erreur chargement conversations archivées:', error);
      setArchivedConversations([]);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId) => {
    if (!conversationId) return [];
    
    try {
      const response = await api.get(`/messages/conversations/${conversationId}/`);
      if (response.data && Array.isArray(response.data)) {
        setMessages(response.data);
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Erreur chargement messages:', error);
      toast.error('Erreur lors du chargement des messages');
      return [];
    }
  }, []);

  const selectConversation = useCallback(async (conversation) => {
    if (!conversation?.id) return;
    
    setCurrentConversation(conversation);
    await fetchMessages(conversation.id);
    
    if (conversation.unread_count > 0) {
      await api.post(`/messages/conversations/${conversation.id}/read/`);
      fetchConversations();
      fetchArchivedConversations();
    }
  }, [fetchMessages, fetchConversations, fetchArchivedConversations]);

  const sendMessage = useCallback(async (content, replyTo = null) => {
    if (!content.trim() || !currentConversation) return false;
    
    setSending(true);
    
    const tempId = `temp_${Date.now()}`;
    const tempMessage = {
      id: tempId,
      sender_id: user?.id,
      sender_name: user?.username,
      content: content.trim(),
      is_read: false,
      created_at: new Date().toISOString(),
      is_temp: true,
      reply_to: replyTo?.id || null,
      reply_to_content: replyTo?.content?.substring(0, 100) || null,
      medias: []
    };
    setMessages(prev => [...prev, tempMessage]);
    
    try {
      const payload = { content: content.trim() };
      if (replyTo) payload.reply_to = replyTo.id;
      
      const response = await api.post(`/messages/conversations/${currentConversation.id}/send/`, payload);
      setMessages(prev => prev.map(msg => msg.id === tempId ? response.data : msg));
      await fetchMessages(currentConversation.id);
      await fetchConversations();
      await fetchArchivedConversations();
      return true;
    } catch (error) {
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      toast.error('Erreur lors de l\'envoi du message');
      return false;
    } finally {
      setSending(false);
    }
  }, [currentConversation, user, fetchMessages, fetchConversations, fetchArchivedConversations]);

  const sendFile = useCallback(async (file, textContent = '', replyTo = null) => {
    if (!currentConversation) return false;
    
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Le fichier ne doit pas dépasser 50MB');
      return false;
    }
    
    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);
    if (textContent) formData.append('content', textContent);
    if (replyTo) formData.append('reply_to', replyTo.id);
    
    const tempId = `temp_${Date.now()}`;
    const tempMessage = {
      id: tempId,
      sender_id: user?.id,
      sender_name: user?.username,
      content: textContent || `[Fichier: ${file.name}]`,
      is_read: false,
      created_at: new Date().toISOString(),
      is_temp: true,
      reply_to: replyTo?.id || null,
      reply_to_content: replyTo?.content?.substring(0, 100) || null,
      medias: [{ file_name: file.name, is_uploading: true }]
    };
    setMessages(prev => [...prev, tempMessage]);
    
    try {
      const response = await api.post(`/messages/conversations/${currentConversation.id}/send-file/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessages(prev => prev.map(msg => msg.id === tempId ? response.data : msg));
      await fetchMessages(currentConversation.id);
      await fetchConversations();
      await fetchArchivedConversations();
      toast.success('Fichier envoyé');
      return true;
    } catch (error) {
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      toast.error('Erreur lors de l\'envoi du fichier');
      return false;
    } finally {
      setUploadingFile(false);
    }
  }, [currentConversation, user, fetchMessages, fetchConversations, fetchArchivedConversations]);

  const sendAudioMessage = useCallback(async (audioBlob, replyTo = null) => {
    if (!currentConversation) return false;
    
    setUploadingFile(true);
    
    const tempId = `temp_audio_${Date.now()}`;
    const tempAudioUrl = URL.createObjectURL(audioBlob);
    
    const tempMessage = {
      id: tempId,
      sender_id: user?.id,
      sender_name: user?.username,
      content: '[Message audio]',
      is_read: false,
      created_at: new Date().toISOString(),
      is_temp: true,
      is_audio: true,
      reply_to: replyTo?.id || null,
      reply_to_content: replyTo?.content?.substring(0, 100) || null,
      medias: [{
        id: tempId,
        file_url: tempAudioUrl,
        file_name: `audio_${Date.now()}.webm`,
        file_type: 'audio/webm',
        is_uploading: true,
        is_audio: true
      }]
    };
    
    setMessages(prev => [...prev, tempMessage]);
    
    const formData = new FormData();
    const audioFile = new File([audioBlob], `audio_${Date.now()}.webm`, { type: 'audio/webm' });
    formData.append('file', audioFile);
    formData.append('content', '[Message audio]');
    if (replyTo) formData.append('reply_to', replyTo.id);
    
    try {
      const response = await api.post(`/messages/conversations/${currentConversation.id}/send-file/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const finalMessage = { ...response.data, is_audio: true };
      setMessages(prev => prev.map(msg => msg.id === tempId ? finalMessage : msg));
      
      await fetchMessages(currentConversation.id);
      await fetchConversations();
      await fetchArchivedConversations();
      
      URL.revokeObjectURL(tempAudioUrl);
      toast.success('Message audio envoyé');
      return true;
    } catch (error) {
      console.error('Erreur envoi audio:', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      URL.revokeObjectURL(tempAudioUrl);
      toast.error('Erreur lors de l\'envoi du message audio');
      return false;
    } finally {
      setUploadingFile(false);
    }
  }, [currentConversation, user, fetchMessages, fetchConversations, fetchArchivedConversations]);

  const createDirectConversation = useCallback(async (userId) => {
    try {
      const response = await api.post('/messages/conversations/direct/', { user_id: userId });
      toast.success('Conversation créée');
      await fetchConversations();
      await fetchArchivedConversations();
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la création');
      throw error;
    }
  }, [fetchConversations, fetchArchivedConversations]);

  const createConversationFromSinistre = useCallback(async (sinistreId) => {
    try {
      const response = await api.post('/messages/conversations/from-sinistre/', { sinistre_id: sinistreId });
      toast.success('Conversation créée');
      await fetchConversations();
      await fetchArchivedConversations();
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la création');
      throw error;
    }
  }, [fetchConversations, fetchArchivedConversations]);

  const createConversationWithManager = useCallback(async (managerId) => {
    try {
      const response = await api.post('/messages/conversations/with-manager/', { manager_id: managerId });
      toast.success('Conversation créée');
      await fetchConversations();
      await fetchArchivedConversations();
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la création');
      throw error;
    }
  }, [fetchConversations, fetchArchivedConversations]);

  const addParticipants = useCallback(async (conversationId, userIds) => {
    try {
      await api.post(`/messages/conversations/${conversationId}/add-participants/`, { user_ids: userIds });
      toast.success('Participants ajoutés');
      await fetchConversations();
      await fetchArchivedConversations();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout des participants');
    }
  }, [fetchConversations, fetchArchivedConversations]);

  const archiveConversation = useCallback(async (conversationId) => {
    try {
      await api.post(`/messages/conversations/${conversationId}/archive/`);
      toast.success('Conversation archivée');
      await fetchConversations();
      await fetchArchivedConversations();
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (error) {
      toast.error('Erreur lors de l\'archivage');
    }
  }, [fetchConversations, fetchArchivedConversations, currentConversation]);

  const restoreConversation = useCallback(async (conversationId) => {
    try {
      await api.post(`/messages/conversations/${conversationId}/restore/`);
      toast.success('Conversation restaurée');
      await fetchConversations();
      await fetchArchivedConversations();
    } catch (error) {
      toast.error('Erreur lors de la restauration');
    }
  }, [fetchConversations, fetchArchivedConversations]);

  const replyToMessage = useCallback(async (messageId, content, originalMessage) => {
    if (!currentConversation) return false;
    
    setSending(true);
    
    const tempId = `temp_${Date.now()}`;
    const tempMessage = {
      id: tempId,
      sender_id: user?.id,
      sender_name: user?.username,
      content: content.trim(),
      is_read: false,
      created_at: new Date().toISOString(),
      is_temp: true,
      reply_to: messageId,
      reply_to_content: originalMessage?.content?.substring(0, 100),
      medias: []
    };
    setMessages(prev => [...prev, tempMessage]);
    
    try {
      const response = await api.post(`/messages/${messageId}/reply/`, { content: content.trim() });
      setMessages(prev => prev.map(msg => msg.id === tempId ? response.data : msg));
      await fetchMessages(currentConversation.id);
      await fetchConversations();
      await fetchArchivedConversations();
      return true;
    } catch (error) {
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      toast.error('Erreur lors de l\'envoi de la réponse');
      return false;
    } finally {
      setSending(false);
    }
  }, [currentConversation, user, fetchMessages, fetchConversations, fetchArchivedConversations]);

  const getConversationDetails = useCallback(async (conversationId) => {
    try {
      const response = await api.get(`/messages/conversations/${conversationId}/details/`);
      return response.data;
    } catch (error) {
      console.error('Erreur chargement détails:', error);
      return null;
    }
  }, []);

  const sendTyping = useCallback((isTyping) => {
    console.log('Typing:', isTyping);
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchConversations();
      fetchArchivedConversations();
      fetchAllUsers();
    }
  }, [user, fetchConversations, fetchArchivedConversations, fetchAllUsers]);

  useEffect(() => {
    if (pollingInterval) clearInterval(pollingInterval);
    
    const interval = setInterval(async () => {
      if (currentConversation?.id) {
        try {
          const response = await api.get(`/messages/conversations/${currentConversation.id}/`);
          const newMessages = response.data;
          if (JSON.stringify(messages) !== JSON.stringify(newMessages)) {
            setMessages(newMessages);
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }
      await fetchConversations();
      await fetchArchivedConversations();
    }, 3000);
    
    setPollingInterval(interval);
    return () => { if (interval) clearInterval(interval); };
  }, [currentConversation?.id, messages, fetchConversations, fetchArchivedConversations]);

  const value = {
    conversations,
    archivedConversations,
    currentConversation,
    messages,
    loading,
    sending,
    uploadingFile,
    onlineUsers,
    typingUsers,
    allUsers,
    showArchived,
    setShowArchived,
    fetchConversations,
    fetchArchivedConversations,
    fetchMessages,
    selectConversation,
    sendMessage,
    sendFile,
    sendAudioMessage,
    createDirectConversation,
    createConversationFromSinistre,
    createConversationWithManager,
    addParticipants,
    archiveConversation,
    restoreConversation,
    replyToMessage,
    sendTyping,
    getConversationDetails,
    setCurrentConversation
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};

export default MessageProvider;