// src/components/Messages/MessageBubble.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiDownload, FiCornerUpLeft, FiFile, FiImage, FiVideo, FiMusic, 
  FiFileText, FiCheck, FiLoader, FiPlay, FiPause
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useMessages } from '../../contexts/MessageContext';

const MessageBubble = ({ message, onReplyClick }) => {
  const { user } = useAuth();
  const { replyToMessage } = useMessages();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [audioProgress, setAudioProgress] = useState({});
  const [audioDuration, setAudioDuration] = useState({});
  const audioRefs = useRef({});
  
  const isOwn = message.sender_id === user?.id;
  const isTemp = message.is_temp;
  
  // Fonction pour obtenir l'icône du fichier
  const getFileIcon = (fileType) => {
    if (!fileType) return <FiFile className="text-gray-500" />;
    if (fileType.startsWith('image/')) return <FiImage className="text-green-500" />;
    if (fileType.startsWith('video/')) return <FiVideo className="text-blue-500" />;
    if (fileType.startsWith('audio/')) return <FiMusic className="text-purple-500" />;
    if (fileType.includes('pdf')) return <FiFileText className="text-red-500" />;
    return <FiFile className="text-gray-500" />;
  };
  
  // Gérer la réponse à un message
  const handleReply = async () => {
    if (!replyContent.trim()) return;
    setIsReplying(true);
    try {
      await replyToMessage(message.id, replyContent, message);
      setReplyContent('');
      setShowReplyInput(false);
      if (onReplyClick) onReplyClick();
    } catch (error) {
      console.error('Erreur réponse:', error);
    } finally {
      setIsReplying(false);
    }
  };
  
  // Télécharger un fichier
  const handleDownload = (fileUrl, fileName) => {
    const link = document.createElement('a');
    const url = fileUrl.startsWith('http') ? fileUrl : `http://localhost:8000${fileUrl}`;
    link.href = url;
    link.download = fileName || 'fichier';
    link.click();
  };
  
  // Lire un message audio
  const handlePlayAudio = (mediaId, fileUrl) => {
    const audio = audioRefs.current[mediaId];
    if (audio) {
      if (playingAudioId === mediaId) {
        audio.pause();
        setPlayingAudioId(null);
      } else {
        if (playingAudioId) {
          const prevAudio = audioRefs.current[playingAudioId];
          if (prevAudio) prevAudio.pause();
        }
        audio.play();
        setPlayingAudioId(mediaId);
      }
    } else if (fileUrl) {
      const audioUrl = fileUrl.startsWith('http') ? fileUrl : `http://localhost:8000${fileUrl}`;
      const tempAudio = new Audio(audioUrl);
      tempAudio.play();
      tempAudio.onended = () => {
        setPlayingAudioId(null);
        setAudioProgress(prev => ({ ...prev, [mediaId]: 0 }));
      };
      tempAudio.ontimeupdate = () => {
        if (tempAudio.duration) {
          const progress = (tempAudio.currentTime / tempAudio.duration) * 100;
          setAudioProgress(prev => ({ ...prev, [mediaId]: progress }));
        }
      };
      tempAudio.onloadedmetadata = () => {
        setAudioDuration(prev => ({ ...prev, [mediaId]: tempAudio.duration }));
      };
      setPlayingAudioId(mediaId);
      audioRefs.current[mediaId] = tempAudio;
    }
  };
  
  // Arrêter l'audio
  const handleAudioEnded = (mediaId) => {
    setPlayingAudioId(null);
    setAudioProgress(prev => ({ ...prev, [mediaId]: 0 }));
  };
  
  // Mettre à jour la progression de l'audio
  const handleTimeUpdate = (mediaId, e) => {
    const audio = e.target;
    if (audio && audio.duration) {
      const progress = (audio.currentTime / audio.duration) * 100;
      setAudioProgress(prev => ({ ...prev, [mediaId]: progress }));
    }
  };
  
  // Charger les métadonnées audio
  const handleLoadedMetadata = (mediaId, e) => {
    const audio = e.target;
    if (audio && audio.duration) {
      setAudioDuration(prev => ({ ...prev, [mediaId]: audio.duration }));
    }
  };
  
  // Formater le temps
  const formatTime = (seconds) => {
    if (isNaN(seconds) || !isFinite(seconds) || seconds === 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Nettoyage des audios au démontage
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
    };
  }, []);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}
    >
      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-1' : 'order-2'}`}>
        {/* Indicateur de réponse à un message */}
        {message.reply_to && message.reply_to_content && (
          <div className={`text-xs p-2 mb-1 rounded-t-lg ${isOwn ? 'bg-mutas-400 text-white/80' : 'bg-gray-200 dark:bg-gray-600 text-gray-500'}`}>
            <p className="font-medium flex items-center gap-1">
              <FiCornerUpLeft size={12} /> Réponse à:
            </p>
            <p className="truncate italic">{message.reply_to_content}...</p>
          </div>
        )}
        
        {/* Contenu principal du message */}
        <div className={`relative p-3 rounded-lg ${isOwn ? 'bg-mutas-500 text-white rounded-br-none' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-none'} ${isTemp ? 'opacity-70' : ''}`}>
          
          {/* Indicateur de chargement temporaire */}
          {isTemp && (
            <div className="absolute top-1 right-1">
              <FiLoader className="animate-spin" size={12} />
            </div>
          )}
          
          {/* Médias (images, audios, fichiers) */}
          {message.medias && message.medias.length > 0 && message.medias.map((media, idx) => {
            const mediaId = `${message.id}_${idx}`;
            const isAudioMedia = media.file_type?.startsWith('audio/');
            const isImageMedia = media.file_type?.startsWith('image/');
            
            return (
              <div key={idx} className="space-y-2 mb-2">
                {/* Lecteur audio */}
                {isAudioMedia && (
                  <div className="w-full">
                    {media.file_url && !media.is_uploading ? (
                      <>
                        <audio
                          ref={el => audioRefs.current[mediaId] = el}
                          src={media.file_url.startsWith('http') ? media.file_url : `http://localhost:8000${media.file_url}`}
                          onTimeUpdate={(e) => handleTimeUpdate(mediaId, e)}
                          onEnded={() => handleAudioEnded(mediaId)}
                          onLoadedMetadata={(e) => handleLoadedMetadata(mediaId, e)}
                          className="hidden"
                        />
                        <div className="flex items-center gap-3 bg-gray-200 dark:bg-gray-600 rounded-lg p-2">
                          <button
                            onClick={() => handlePlayAudio(mediaId, media.file_url)}
                            className="w-8 h-8 rounded-full bg-mutas-500 text-white flex items-center justify-center hover:bg-mutas-600 transition-colors"
                          >
                            {playingAudioId === mediaId ? <FiPause size={14} /> : <FiPlay size={14} />}
                          </button>
                          <div className="flex-1">
                            <div className="h-1.5 bg-gray-300 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-mutas-500 transition-all duration-100"
                                style={{ width: `${audioProgress[mediaId] || 0}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs font-mono">
                            {audioDuration[mediaId] ? formatTime(audioDuration[mediaId]) : '0:00'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 truncate">{media.file_name || 'Message audio'}</p>
                      </>
                    ) : media.is_uploading ? (
                      <div className="flex items-center gap-2 text-sm opacity-70">
                        <FiLoader className="animate-spin" size={14} />
                        <span>Envoi du message audio...</span>
                      </div>
                    ) : null}
                  </div>
                )}
                
                {/* Aperçu image */}
                {isImageMedia && media.file_url && (
                  <div>
                    <img
                      src={media.file_url.startsWith('http') ? media.file_url : `http://localhost:8000${media.file_url}`}
                      alt={media.file_name || 'Image'}
                      className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(media.file_url.startsWith('http') ? media.file_url : `http://localhost:8000${media.file_url}`, '_blank')}
                    />
                    <p className="text-xs text-gray-500 mt-1 truncate">{media.file_name || 'Image'}</p>
                  </div>
                )}
                
                {/* Autres fichiers (PDF, DOC, etc.) */}
                {!isAudioMedia && !isImageMedia && media.file_url && (
                  <div className="flex items-center gap-2 p-2 bg-gray-200 dark:bg-gray-600 rounded-lg">
                    {getFileIcon(media.file_type)}
                    <span className="text-sm truncate flex-1">{media.file_name || 'Fichier'}</span>
                    {!media.is_uploading && (
                      <button 
                        onClick={() => handleDownload(media.file_url, media.file_name)} 
                        className="hover:opacity-70 text-mutas-500"
                        title="Télécharger"
                      >
                        <FiDownload size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Contenu texte du message */}
          {message.content && 
           message.content !== '[Message audio]' && 
           !message.content.startsWith('[Fichier:') && (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          )}
          
          {/* Métadonnées du message (heure, statut) */}
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs opacity-70">
              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <div className="flex items-center gap-2">
              {!isOwn && !isTemp && (
                <button
                  onClick={() => setShowReplyInput(!showReplyInput)}
                  className="text-xs opacity-70 hover:opacity-100 flex items-center gap-1 transition-opacity"
                >
                  <FiCornerUpLeft size={12} /> Répondre
                </button>
              )}
              {isOwn && !isTemp && (
                <span className="text-xs opacity-70" title={message.is_read ? "Lu" : "Non lu"}>
                  <FiCheck size={12} />
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Input de réponse (affiché uniquement pour les messages non propres) */}
        {showReplyInput && !isOwn && !isTemp && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Votre réponse..."
              className="flex-1 px-3 py-1 text-sm border rounded-lg focus:ring-mutas-500 focus:border-mutas-500 dark:bg-gray-800"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && handleReply()}
            />
            <button
              onClick={handleReply}
              disabled={isReplying}
              className="px-3 py-1 bg-mutas-500 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-mutas-600 transition-colors"
            >
              Envoyer
            </button>
            <button
              onClick={() => setShowReplyInput(false)}
              className="px-3 py-1 border text-sm rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MessageBubble;