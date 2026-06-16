import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiSearch, FiUser, FiLoader } from 'react-icons/fi';

export const ClientSelectionModal = ({ isOpen, onClose, clients, loading, onSelectClient }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = clients.filter(c =>
    c.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white p-5 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Sélectionner un sinistré</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <FiX size={22} />
          </button>
        </div>
        
        <div className="p-5">
          <div className="relative mb-4">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, email ou code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <FiLoader className="w-8 h-8 text-mutas-500 animate-spin" />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiUser size={48} className="mx-auto mb-3 text-gray-300" />
              <p>Aucun client trouvé</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredClients.map(client => (
                <div
                  key={client.id}
                  onClick={() => onSelectClient(client)}
                  className="border rounded-xl p-4 cursor-pointer hover:border-mutas-500 hover:shadow-lg transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-mutas-100 rounded-full flex items-center justify-center">
                      <FiUser className="text-mutas-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{client.user?.first_name} {client.user?.last_name}</p>
                      <p className="text-sm text-gray-500">@{client.user?.username}</p>
                      <div className="flex gap-2 mt-1 text-xs text-gray-400">
                        <span>{client.user?.email}</span>
                        <span>{client.user?.phone}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Code: {client.code || client.id}</p>
                    </div>
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

export default ClientSelectionModal;