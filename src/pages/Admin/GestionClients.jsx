import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, FiEye, FiEdit2, FiSearch, FiRefreshCw, FiUserPlus, 
  FiShield, FiChevronLeft, FiChevronRight, FiPrinter, FiPower 
} from 'react-icons/fi';
import { authApi } from '../../api/client';
import toast from 'react-hot-toast';
import ClientModal from '../../components/Modals/ClientModal';
import AssuranceModal from '../../components/Modals/AssuranceModal';
import ClientAdminPanel from '../../components/ClientAdminPanel';

function GestionClients() {
  const [clients, setClients] = useState([]);
  const [assurances, setAssurances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssuranceModal, setShowAssuranceModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [clientsRes, assurancesRes] = await Promise.all([
        authApi.get('/accounts/clients/'),
        authApi.get('/accounts/assurances/')
      ]);
      setClients(clientsRes.data || []);
      setAssurances(assurancesRes.data || []);
    } catch (error) {
      console.error('Erreur chargement:', error);
      toast.error('Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleClientStatus = async (clientId, e) => {
    e.stopPropagation();
    try {
      await authApi.post(`/accounts/clients/${clientId}/toggle-status/`);
      toast.success('Statut modifié avec succès');
      fetchData();
    } catch (error) {
      toast.error('Erreur lors du changement de statut');
    }
  };

  const handleEditClient = (client, e) => {
    e.stopPropagation();
    setSelectedClient(client);
    setShowEditModal(true);
  };

  const handlePrintClient = (client, e) => {
    e.stopPropagation();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Fiche client - ${client.user?.first_name || ''} ${client.user?.last_name || ''}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #0EA5E9; border-bottom: 2px solid #0EA5E9; padding-bottom: 10px; }
            .info { margin: 10px 0; }
            .label { font-weight: bold; width: 150px; display: inline-block; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; border-top: 1px solid #ccc; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>Fiche client</h1>
          <div class="info"><span class="label">Code client:</span> ${client.code || '-'}</div>
          <div class="info"><span class="label">Nom complet:</span> ${client.user?.first_name || ''} ${client.user?.last_name || ''}</div>
          <div class="info"><span class="label">Nom d'utilisateur:</span> ${client.user?.username || '-'}</div>
          <div class="info"><span class="label">Email:</span> ${client.user?.email || '-'}</div>
          <div class="info"><span class="label">Téléphone:</span> ${client.user?.phone || '-'}</div>
          <div class="info"><span class="label">Genre:</span> ${client.genre === 'M' ? 'Masculin' : 'Féminin'}</div>
          <div class="info"><span class="label">Date naissance:</span> ${client.date_naissance ? new Date(client.date_naissance).toLocaleDateString() : '-'}</div>
          <div class="info"><span class="label">Lieu naissance:</span> ${client.lieu_naissance || '-'}</div>
          <div class="info"><span class="label">Profession:</span> ${client.profession || '-'}</div>
          <div class="info"><span class="label">Entreprise:</span> ${client.entreprise || '-'}</div>
          <div class="info"><span class="label">Statut:</span> ${client.user?.is_active ? 'Actif' : 'Inactif'}</div>
          <div class="footer">
            <p>Document généré le ${new Date().toLocaleString()}</p>
            <p>MUTAS - Gestion des sinistres</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredClients = clients.filter(c =>
    `${c.user?.first_name || ''} ${c.user?.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500">Chargement des clients...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            Gestion des clients
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gérez vos clients et leurs assurances</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchData} 
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
          >
            <FiRefreshCw size={16} /> Actualiser
          </button>
          <button 
            onClick={() => setShowAssuranceModal(true)} 
            className="flex items-center gap-2 border border-blue-500 text-blue-500 px-4 py-2 rounded-lg hover:bg-blue-50 transition-all"
          >
            <FiShield size={16} /> Nouvelle assurance
          </button>
          <button 
            onClick={() => setShowCreateModal(true)} 
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all"
          >
            <FiUserPlus size={16} /> Nouveau client
          </button>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Rechercher par nom, email ou code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
          <select 
            value={itemsPerPage} 
            onChange={(e) => setItemsPerPage(Number(e.target.value))} 
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value={12}>12 par page</option>
            <option value={24}>24 par page</option>
            <option value={48}>48 par page</option>
          </select>
        </div>
      </div>

      {/* Grille des cartes clients */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {currentClients.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            Aucun client trouvé
          </div>
        ) : (
          currentClients.map(client => (
            <motion.div
              key={client.id}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl shadow-md border overflow-hidden cursor-pointer hover:shadow-lg transition-all"
              onClick={() => { setSelectedClient(client); setShowAdminPanel(true); }}
            >
              {/* En-tête de la carte avec dégradé */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                <div className="flex justify-between items-start">
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                    {client.code}
                  </span>
                  <button 
                    onClick={(e) => handlePrintClient(client, e)} 
                    className="text-white/80 hover:text-white transition-colors"
                    title="Imprimer"
                  >
                    <FiPrinter size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-lg font-bold">
                    {client.user?.first_name?.charAt(0) || client.user?.username?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <h3 className="font-bold">{client.user?.first_name} {client.user?.last_name}</h3>
                    <p className="text-xs opacity-80">@{client.user?.username}</p>
                  </div>
                </div>
              </div>

              {/* Corps de la carte */}
              <div className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Email:</span>
                  <span className="truncate ml-2">{client.user?.email || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Téléphone:</span>
                  <span>{client.user?.phone || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Statut:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    client.user?.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {client.user?.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>

              {/* Actions de la carte */}
              <div className="border-t p-3 flex justify-end gap-2">
                <button 
                  onClick={(e) => handleEditClient(client, e)} 
                  className="p-2 text-yellow-500 hover:bg-yellow-50 rounded-lg transition-all"
                  title="Modifier"
                >
                  <FiEdit2 size={16} />
                </button>
                <button 
                  onClick={(e) => handleToggleClientStatus(client.id, e)} 
                  className={`p-2 rounded-lg transition-all ${
                    client.user?.is_active 
                      ? 'text-red-500 hover:bg-red-50' 
                      : 'text-green-500 hover:bg-green-50'
                  }`}
                  title={client.user?.is_active ? 'Désactiver' : 'Activer'}
                >
                  <FiPower size={16} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedClient(client); setShowAdminPanel(true); }} 
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                  title="Voir détails"
                >
                  <FiEye size={16} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      {filteredClients.length > 0 && (
        <div className="flex justify-between items-center pt-4">
          <p className="text-sm text-gray-500">
            {indexOfFirstItem + 1} – {Math.min(indexOfLastItem, filteredClients.length)} sur {filteredClients.length} clients
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
            >
              <FiChevronLeft size={18} />
            </button>
            <span className="px-4 py-2 bg-blue-500 text-white rounded-lg">{currentPage}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
            >
              <FiChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ClientModal 
        isOpen={showCreateModal} 
        onClose={() => { setShowCreateModal(false); fetchData(); }} 
        onSuccess={fetchData} 
      />
      <ClientModal 
        isOpen={showEditModal} 
        onClose={() => { setShowEditModal(false); setSelectedClient(null); fetchData(); }} 
        onSuccess={fetchData} 
        initialData={selectedClient} 
      />
      <AssuranceModal 
        isOpen={showAssuranceModal} 
        onClose={() => { setShowAssuranceModal(false); fetchData(); }} 
        onSuccess={fetchData} 
      />
      <ClientAdminPanel 
        isOpen={showAdminPanel} 
        onClose={() => { setShowAdminPanel(false); setSelectedClient(null); }} 
        client={selectedClient} 
        onRefresh={fetchData} 
      />
    </div>
  );
}

export default GestionClients;