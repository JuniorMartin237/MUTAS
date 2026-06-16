import React from 'react';
import { FiFile, FiImage, FiVideo, FiMusic, FiFileText, FiDownload, FiX } from 'react-icons/fi';

const FilePreview = ({ file, onRemove, onDownload }) => {
  const getFileIcon = () => {
    if (file.type?.startsWith('image/')) return <FiImage className="text-green-500 text-2xl" />;
    if (file.type?.startsWith('video/')) return <FiVideo className="text-blue-500 text-2xl" />;
    if (file.type?.startsWith('audio/')) return <FiMusic className="text-purple-500 text-2xl" />;
    if (file.type?.includes('pdf')) return <FiFileText className="text-red-500 text-2xl" />;
    return <FiFile className="text-gray-500 text-2xl" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div className="flex items-center gap-3">
        {getFileIcon()}
        <div>
          <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
        </div>
      </div>
      <div className="flex gap-2">
        {onDownload && (
          <button onClick={() => onDownload(file)} className="text-mutas-500 hover:text-mutas-700">
            <FiDownload size={16} />
          </button>
        )}
        {onRemove && (
          <button onClick={() => onRemove(file)} className="text-red-500 hover:text-red-700">
            <FiX size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default FilePreview;