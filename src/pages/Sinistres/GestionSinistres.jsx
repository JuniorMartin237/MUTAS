// src/pages/Sinistres/GestionSinistres.jsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiUser, FiUserPlus, FiSearch, FiEye, FiEdit2, 
  FiMail, FiPhone, FiHeart, FiRefreshCw, FiX,
  FiShield, FiLoader, FiCalendar, FiMapPin, FiBriefcase,
  FiToggleLeft, FiToggleRight
} from 'react-icons/fi';
import { clientService } from '../../services/sinistreService';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import ClientModal from '../../components/Clients/ClientModal';
import SouscriptionModal from '../../components/Clients/SouscriptionModal';
import ClientViewModal from '../../components/Clients/ClientViewModal';  // Nouvel import

export default function GestionSinistres() {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showClientModal, setShowClientModal] = useState(false);
  const [showSouscriptionModal, setShowSouscriptionModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);  // Nouvel état
  const [selectedClient, setSelectedClient] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await clientService.getClients();
      setClients(response.data || []);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
      toast.error('Erreur lors du chargement des clients');
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleToggleStatus = async (client) => {
    try {
      await clientService.toggleClientStatus(client.id);
      toast.success(`Compte ${client.user?.is_active ? 'désactivé' : 'activé'} avec succès`);
      fetchClients();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du changement de statut');
    }
  };

  const filteredClients = (clients || []).filter(c =>
    c.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.code && c.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <FiLoader className="w-12 h-12 text-mutas-500 animate-spin" />
        <p className="mt-4 text-gray-500">Chargement des clients...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FiUser className="text-mutas-500" /> Gestion des sinistrés
          </h1>
          <p className="text-gray-500 mt-1">Gestion des clients, souscriptions et contrats</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchClients} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
            <FiRefreshCw /> Actualiser
          </button>
          <button 
            onClick={() => { setSelectedClient(null); setShowClientModal(true); }} 
            className="flex items-center gap-2 bg-mutas-500 text-white px-4 py-2 rounded-lg hover:bg-mutas-600"
          >
            <FiUserPlus /> Nouveau sinistré
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Rechercher par nom, email ou code..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-mutas-500 focus:border-mutas-500" 
          />
        </div>
      </div>

      {/* Tableau clients */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom complet</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {currentClients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    Aucun client trouvé
                  </td>
                </tr>
              ) : (
                currentClients.map(client => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-sm">{client.code || client.id}</td>
                    <td className="px-6 py-4 font-medium">{client.user?.first_name} {client.user?.last_name}</td>
                    <td className="px-6 py-4">{client.user?.email}</td>
                    <td className="px-6 py-4">{client.user?.phone || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${client.user?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {client.user?.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {/* Nouveau bouton Voir */}
                        <button 
                          onClick={() => { setSelectedClient(client); setShowViewModal(true); }} 
                          className="text-blue-500 hover:text-blue-700"
                          title="Voir la fiche client"
                        >
                          <FiEye size={18} />
                        </button>
                        <button 
                          onClick={() => { setSelectedClient(client); setShowSouscriptionModal(true); }} 
                          className="text-mutas-500 hover:text-mutas-700"
                          title="Souscrire une assurance"
                        >
                          <FiHeart size={18} />
                        </button>
                        <button 
                          onClick={() => { setSelectedClient(client); setShowClientModal(true); }} 
                          className="text-yellow-500 hover:text-yellow-700"
                          title="Modifier"
                        >
                          <FiEdit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(client)} 
                          className={client.user?.is_active ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'}
                          title={client.user?.is_active ? 'Désactiver' : 'Activer'}
                        >
                          {client.user?.is_active ? <FiToggleLeft size={18} /> : <FiToggleRight size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {filteredClients.length > 0 && (
          <div className="px-6 py-4 border-t flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, filteredClients.length)} sur {filteredClients.length}
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1} 
                className="px-3 py-1 border rounded-lg disabled:opacity-50"
              >
                Précédent
              </button>
              <span className="px-3 py-1 bg-mutas-500 text-white rounded-lg">{currentPage}</span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages} 
                className="px-3 py-1 border rounded-lg disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ClientModal 
        isOpen={showClientModal} 
        onClose={() => { setShowClientModal(false); setSelectedClient(null); }} 
        onSuccess={fetchClients} 
        client={selectedClient} 
      />
      
      <SouscriptionModal 
        isOpen={showSouscriptionModal} 
        onClose={() => { setShowSouscriptionModal(false); setSelectedClient(null); }} 
        onSuccess={fetchClients} 
        client={selectedClient} 
      />
      
      <ClientViewModal 
        isOpen={showViewModal} 
        onClose={() => { setShowViewModal(false); setSelectedClient(null); }} 
        client={selectedClient}
        onRefresh={fetchClients}
      />
    </div>
  );
}