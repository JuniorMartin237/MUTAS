import React from 'react';
import { motion } from 'framer-motion';
import { FiX, FiImage, FiFile, FiVideo, FiExternalLink, FiLoader } from 'react-icons/fi';

export const DocumentsModal = ({ isOpen, onClose, documents, loading, sinistre }) => {
  if (!isOpen) return null;

  const getFileIcon = (mediaType) => {
    if (mediaType === 'PHOTO') return <FiImage className="text-green-500" size={20} />;
    if (mediaType === 'VIDEO') return <FiVideo className="text-blue-500" size={20} />;
    return <FiFile className="text-gray-500" size={20} />;
  };

  const getFileUrl = (fileUrl) => {
    if (!fileUrl) return null;
    if (fileUrl.startsWith('http')) return fileUrl;
    return `http://localhost:8000${fileUrl}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white p-5 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Documents</h2>
            <p className="text-sm text-gray-500 font-mono">{sinistre?.reference}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <FiX size={22} />
          </button>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FiLoader className="w-8 h-8 text-mutas-500 animate-spin" />
              <p className="mt-2 text-gray-500">Chargement des documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FiFile size={48} className="mx-auto mb-3 text-gray-300" />
              <p>Aucun document soumis pour ce sinistre</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {documents.map((doc, idx) => (
                <div key={idx} className="border rounded-lg p-3 flex items-center justify-between hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3">
                    {getFileIcon(doc.media_type)}
                    <div>
                      <p className="font-medium text-sm truncate max-w-[200px]">{doc.file_name || 'Document'}</p>
                      <p className="text-xs text-gray-400">
                        {doc.media_type} • {new Date(doc.uploaded_at).toLocaleDateString()}
                        {doc.uploaded_by_name && ` • Par ${doc.uploaded_by_name}`}
                      </p>
                    </div>
                  </div>
                  {doc.file_url && (
                    <a 
                      href={getFileUrl(doc.file_url)} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-mutas-500 hover:text-mutas-700 p-2 rounded-lg hover:bg-gray-100"
                      title="Ouvrir"
                    >
                      <FiExternalLink size={18} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-5 border-t">
          <button onClick={onClose} className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200">
            Fermer
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default DocumentsModal;