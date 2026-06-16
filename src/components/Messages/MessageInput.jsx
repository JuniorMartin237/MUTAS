// src/components/Messages/MessageInput.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiPaperclip, FiX, FiImage, FiFile, FiMic, FiStopCircle, FiCornerUpLeft } from 'react-icons/fi';
import { useMessages } from '../../contexts/MessageContext';
import toast from 'react-hot-toast';

const MessageInput = ({ replyTo, onCancelReply }) => {
  const { sendMessage, sendFile, sendAudioMessage, uploadingFile, sending } = useMessages();
  const [message, setMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const fileInputRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  
  const handleSend = async () => {
    if (selectedFiles.length > 0) {
      for (const file of selectedFiles) {
        await sendFile(file, message, replyTo);
      }
      setSelectedFiles([]);
      setMessage('');
      if (onCancelReply) onCancelReply();
    } 
    else if (message.trim()) {
      const success = await sendMessage(message, replyTo);
      if (success) {
        setMessage('');
        if (onCancelReply) onCancelReply();
      }
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles([...selectedFiles, ...files]);
  };
  
  const handleRemoveFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      
      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        setIsRecording(false);
        await sendAudioMessage(audioBlob, replyTo);
        stream.getTracks().forEach(track => track.stop());
        setRecordingTime(0);
        setAudioChunks([]);
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
        }
        if (onCancelReply && replyTo) {
          onCancelReply();
        }
      };
      
      recorder.start(100);
      setMediaRecorder(recorder);
      setIsRecording(true);
      setAudioChunks(chunks);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Erreur microphone:', error);
      toast.error('Impossible d\'accéder au microphone');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };
  
  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getFileIcon = (file) => {
    if (file.type?.startsWith('image/')) return <FiImage className="text-green-500" />;
    return <FiFile className="text-blue-500" />;
  };
  
  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
      {replyTo && (
        <div className="mb-3 p-2 bg-mutas-50 dark:bg-mutas-900/20 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiCornerUpLeft size={14} className="text-mutas-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Réponse à: <span className="italic">{replyTo.content?.substring(0, 50)}...</span>
            </span>
          </div>
          <button onClick={onCancelReply} className="text-gray-400 hover:text-gray-600">
            <FiX size={16} />
          </button>
        </div>
      )}
      
      {selectedFiles.length > 0 && (
        <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm font-medium mb-2">Fichiers sélectionnés ({selectedFiles.length})</p>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {getFileIcon(file)}
                  <span className="truncate max-w-[200px]">{file.name}</span>
                  <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <button onClick={() => handleRemoveFile(idx)} className="text-red-500 hover:text-red-700">
                  <FiX size={16} />
                </button>
              </div>
            ))}
          </div>
          {message && (
            <div className="text-xs text-gray-400 mt-2">
              Message associé: "{message.substring(0, 50)}"
            </div>
          )}
        </div>
      )}
      
      {isRecording && (
        <div className="mb-3 p-3 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-4 h-4 bg-red-500 rounded-full animate-ping opacity-75" />
            </div>
            <span className="text-sm text-red-600 font-medium">Enregistrement...</span>
            <span className="text-sm font-mono text-red-600 bg-red-200 dark:bg-red-800 px-2 py-0.5 rounded">
              {formatRecordingTime(recordingTime)}
            </span>
          </div>
          <button 
            onClick={stopRecording} 
            className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors flex items-center gap-2"
          >
            <FiStopCircle size={14} /> Envoyer
          </button>
        </div>
      )}
      
      <div className="flex gap-2 items-end">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-mutas-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            disabled={isRecording}
          >
            <FiPaperclip size={20} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple
            accept="image/*,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,video/*,audio/*"
          />
          
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={uploadingFile}
            className={`p-2 rounded-full transition-colors ${
              isRecording 
                ? 'text-red-500 bg-red-100 dark:bg-red-900/20 animate-pulse' 
                : 'text-gray-500 hover:text-mutas-500 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {isRecording ? <FiStopCircle size={20} /> : <FiMic size={20} />}
          </button>
        </div>
        
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={selectedFiles.length > 0 ? "Ajoutez un message optionnel..." : "Écrivez votre message..."}
            className="w-full px-4 py-2 border rounded-lg focus:ring-mutas-500 focus:border-mutas-500 resize-none dark:bg-gray-800"
            rows={1}
            style={{ minHeight: '42px', maxHeight: '120px' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            disabled={isRecording}
          />
        </div>
        
        <button
          onClick={handleSend}
          disabled={sending || uploadingFile || isRecording || (!message.trim() && selectedFiles.length === 0)}
          className="p-2 bg-mutas-500 text-white rounded-lg hover:bg-mutas-600 disabled:opacity-50 transition-colors"
        >
          <FiSend size={20} />
        </button>
      </div>
      
      {(sending || uploadingFile) && (
        <div className="mt-2 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-gray-400">
            <div className="w-3 h-3 border-2 border-mutas-500 border-t-transparent rounded-full animate-spin" />
            Envoi en cours...
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageInput;