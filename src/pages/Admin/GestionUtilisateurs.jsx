// src/pages/Admin/GestionUtilisateurs.jsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, FiEye, FiEdit2, FiPower, FiPrinter, FiSearch, 
  FiDownload, FiX, FiSave, FiUserPlus, FiShield, FiCheck, 
  FiUsers, FiTrash2, FiMail, FiPhone, FiMapPin, FiUser,
  FiInfo, FiLock, FiUnlock, FiClock, FiLoader
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function GestionUtilisateurs() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [userTypes, setUserTypes] = useState([]);
  const [permissionsList, setPermissionsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showViewUserModal, setShowViewUserModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showNewTypeModal, setShowNewTypeModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [typeFormData, setTypeFormData] = useState({ name: '', description: '' });
  
  const [formData, setFormData] = useState({
    username: '', email: '', first_name: '', last_name: '', 
    phone: '', address: '', user_type: 'DECLARANT', 
    password: '', confirm_password: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchUserTypes();
    fetchPermissions();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/accounts/all-users/');
      setUsers(response.data);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTypes = async () => {
    try {
      const response = await api.get('/accounts/user-types/');
      setUserTypes(response.data);
    } catch (error) {
      console.error('Erreur chargement types:', error);
      // Types par défaut
      setUserTypes([
        { id: 1, name: 'SINISTRE', description: 'Sinistré/client', is_active: true, permissions: [] },
        { id: 2, name: 'DECLARANT', description: 'Déclarant de sinistre', is_active: true, permissions: [] },
        { id: 3, name: 'VALIDATEUR', description: 'Validateur de sinistres', is_active: true, permissions: [] },
        { id: 4, name: 'EXPERT', description: 'Expert en sinistres', is_active: true, permissions: [] },
        { id: 5, name: 'DIRECTEUR', description: 'Directeur', is_active: true, permissions: [] },
        { id: 6, name: 'ADMIN', description: 'Administrateur', is_active: true, permissions: [] },
      ]);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await api.get('/accounts/permissions/');
      setPermissionsList(response.data);
    } catch (error) {
      console.error('Erreur chargement permissions:', error);
      // Permissions par défaut
      setPermissionsList([
        { id: 1, name: 'Créer un sinistre', codename: 'create_claim' },
        { id: 2, name: 'Valider un sinistre', codename: 'validate_claim' },
        { id: 3, name: 'Expertiser un sinistre', codename: 'expertise_claim' },
        { id: 4, name: 'Indemniser un sinistre', codename: 'indemnize_claim' },
        { id: 5, name: 'Gérer les utilisateurs', codename: 'manage_users' },
        { id: 6, name: 'Voir les logs', codename: 'view_logs' },
        { id: 7, name: 'Gérer les assurances', codename: 'manage_insurance' },
        { id: 8, name: 'Gérer les clients', codename: 'manage_clients' },
      ]);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (!isEditing && formData.password !== formData.confirm_password) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (!formData.username || !formData.email) {
      toast.error('Nom d\'utilisateur et email requis');
      return;
    }
    
    setSubmitting(true);
    try {
      if (isEditing && selectedUser) {
        const updateData = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          user_type: formData.user_type
        };
        await api.patch(`/accounts/users/${selectedUser.id}/edit/`, updateData);
        toast.success('Utilisateur modifié avec succès');
      } else {
        const createData = {
          username: formData.username,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          address: formData.address,
          user_type: formData.user_type,
          password: formData.password
        };
        await api.post('/accounts/users/create/', createData);
        toast.success('Utilisateur créé avec succès');
      }
      setShowUserModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de l\'opération');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${username}" ?`)) {
      try {
        await api.delete(`/accounts/users/${userId}/delete/`);
        toast.success('Utilisateur supprimé avec succès');
        fetchUsers();
      } catch (error) {
        console.error('Erreur:', error);
        toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
      }
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.post(`/accounts/users/${userId}/toggle-status/`, {});
      toast.success(`Compte ${currentStatus ? 'désactivé' : 'activé'} avec succès`);
      fetchUsers();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du changement de statut');
    }
  };

  const handleUpdateUserType = async (userId, newUserType) => {
    try {
      await api.post(`/accounts/users/${userId}/update-type/`, { user_type: newUserType });
      toast.success('Type d\'utilisateur mis à jour');
      fetchUsers();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la mise à jour du type');
    }
  };

  const handleCreateUserType = async () => {
    if (!typeFormData.name) {
      toast.error('Nom du type requis');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/accounts/user-types/create/', typeFormData);
      toast.success('Type d\'utilisateur créé avec succès');
      setShowNewTypeModal(false);
      setTypeFormData({ name: '', description: '' });
      fetchUserTypes();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUserTypeStatus = async (typeId, currentStatus) => {
    try {
      await api.patch(`/accounts/user-types/${typeId}/toggle-status/`, { is_active: !currentStatus });
      toast.success(`Type ${currentStatus ? 'désactivé' : 'activé'} avec succès`);
      fetchUserTypes();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du changement de statut');
    }
  };

  const handleDeleteUserType = async (typeId, typeName) => {
    if (window.confirm(`Supprimer le type "${typeName}" ?`)) {
      try {
        await api.delete(`/accounts/user-types/${typeId}/delete/`);
        toast.success('Type supprimé avec succès');
        fetchUserTypes();
      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleUpdatePermissions = async (typeId, permissions) => {
    try {
      await api.post(`/accounts/user-types/${typeId}/permissions/`, { permissions });
      toast.success('Permissions mises à jour avec succès');
      setShowTypeModal(false);
      fetchUserTypes();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la mise à jour des permissions');
    }
  };

  const resetForm = () => {
    setFormData({
      username: '', email: '', first_name: '', last_name: '', 
      phone: '', address: '', user_type: 'DECLARANT', 
      password: '', confirm_password: ''
    });
    setSelectedUser(null);
    setIsEditing(false);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      address: user.address || '',
      user_type: user.user_type,
      password: '',
      confirm_password: ''
    });
    setIsEditing(true);
    setShowUserModal(true);
  };

  const handlePrintUser = (user) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head>
        <title>Fiche utilisateur - ${user.username}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          h1 { color: #0EA5E9; border-bottom: 2px solid #0EA5E9; padding-bottom: 10px; }
          .info { margin: 10px 0; }
          .label { font-weight: bold; width: 150px; display: inline-block; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 12px; }
          .active { background: #10B981; color: white; }
          .inactive { background: #EF4444; color: white; }
        </style>
      </head><body>
        <h1>Fiche utilisateur</h1>
        <hr/>
        <div class="info"><span class="label">Username:</span> ${user.username}</div>
        <div class="info"><span class="label">Nom complet:</span> ${user.first_name || ''} ${user.last_name || ''}</div>
        <div class="info"><span class="label">Email:</span> ${user.email || '-'}</div>
        <div class="info"><span class="label">Téléphone:</span> ${user.phone || '-'}</div>
        <div class="info"><span class="label">Adresse:</span> ${user.address || '-'}</div>
        <div class="info"><span class="label">Type:</span> ${user.user_type}</div>
        <div class="info"><span class="label">Statut:</span> <span class="badge ${user.is_active ? 'active' : 'inactive'}">${user.is_active ? 'Actif' : 'Inactif'}</span></div>
        <div class="info"><span class="label">MFA:</span> ${user.mfa_enabled ? 'Activé' : 'Désactivé'}</div>
        <div class="info"><span class="label">Date création:</span> ${new Date(user.date_joined).toLocaleString()}</div>
        <hr/>
        <p style="font-size:12px; color:#6B7280;">Document généré le ${new Date().toLocaleString()}</p>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const exportCSV = () => {
    const headers = ['Username', 'Email', 'Nom', 'Prénom', 'Type', 'Statut', 'MFA', 'Date création'];
    const rows = users.map(u => [
      u.username, u.email || '', u.last_name || '', u.first_name || '', 
      u.user_type, u.is_active ? 'Actif' : 'Inactif', u.mfa_enabled ? 'Oui' : 'Non', 
      new Date(u.date_joined).toLocaleDateString()
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export CSV réussi');
  };

  const exportExcel = () => {
    const wsData = users.map(u => ({
      Username: u.username,
      Email: u.email || '',
      Nom: u.last_name || '',
      Prénom: u.first_name || '',
      Type: u.user_type,
      Statut: u.is_active ? 'Actif' : 'Inactif',
      MFA: u.mfa_enabled ? 'Oui' : 'Non',
      'Date création': new Date(u.date_joined).toLocaleDateString()
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Utilisateurs');
    XLSX.writeFile(wb, `utilisateurs_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Export Excel réussi');
  };

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text('Liste des utilisateurs', 14, 15);
    doc.setFontSize(10);
    doc.text(`Généré le: ${new Date().toLocaleString()}`, 14, 25);
    
    doc.autoTable({
      startY: 30,
      head: [['Username', 'Email', 'Nom', 'Prénom', 'Type', 'Statut', 'MFA']],
      body: users.map(u => [
        u.username, u.email || '', u.last_name || '', u.first_name || '', 
        u.user_type, u.is_active ? 'Actif' : 'Inactif', u.mfa_enabled ? 'Oui' : 'Non'
      ]),
      theme: 'striped',
      headStyles: { fillColor: [14, 165, 233] }
    });
    doc.save(`utilisateurs_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Export PDF réussi');
  };

  const filteredUsers = (users || []).filter(u =>
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <FiLoader className="w-12 h-12 text-mutas-500 animate-spin" />
        <p className="mt-4 text-gray-500">Chargement des utilisateurs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Gestion des utilisateurs</h1>
        <p className="text-gray-500 mt-1">Gestion des comptes, rôles et permissions</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button 
          onClick={() => setActiveTab('users')} 
          className={`px-6 py-3 font-medium transition ${activeTab === 'users' ? 'border-b-2 border-mutas-500 text-mutas-500' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <FiUsers className="inline mr-2" /> Utilisateurs
        </button>
        <button 
          onClick={() => setActiveTab('permissions')} 
          className={`px-6 py-3 font-medium transition ${activeTab === 'permissions' ? 'border-b-2 border-mutas-500 text-mutas-500' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <FiShield className="inline mr-2" /> Types et permissions
        </button>
      </div>

      {/* Onglet Utilisateurs */}
      {activeTab === 'users' && (
        <>
          <div className="flex flex-wrap justify-between gap-4">
            <div className="flex gap-2">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Rechercher un utilisateur..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="pl-10 pr-4 py-2 border rounded-lg focus:ring-mutas-500 focus:border-mutas-500 w-80" 
                />
              </div>
              <select 
                value={itemsPerPage} 
                onChange={(e) => setItemsPerPage(Number(e.target.value))} 
                className="px-3 py-2 border rounded-lg"
              >
                <option value={20}>20 par page</option>
                <option value={50}>50 par page</option>
                <option value={100}>100 par page</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => { resetForm(); setShowUserModal(true); }} 
                className="flex items-center gap-2 bg-mutas-500 text-white px-4 py-2 rounded-lg hover:bg-mutas-600 transition"
              >
                <FiUserPlus /> Nouvel utilisateur
              </button>
              <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                <FiDownload size={16} /> CSV
              </button>
              <button onClick={exportExcel} className="flex items-center gap-2 px-3 py-2 bg-green-100 rounded-lg hover:bg-green-200 transition">
                <FiDownload size={16} /> Excel
              </button>
              <button onClick={exportPDF} className="flex items-center gap-2 px-3 py-2 bg-red-100 rounded-lg hover:bg-red-200 transition">
                <FiDownload size={16} /> PDF
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom complet</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">MFA</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {currentUsers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                        <FiUsers size={40} className="mx-auto mb-2 text-gray-300" />
                        Aucun utilisateur trouvé
                      </td>
                    </tr>
                  ) : (
                    currentUsers.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-medium text-gray-900">{u.username}</td>
                        <td className="px-4 py-3">{u.first_name} {u.last_name}</td>
                        <td className="px-4 py-3">{u.email}</td>
                        <td className="px-4 py-3">
                          <select 
                            value={u.user_type} 
                            onChange={(e) => handleUpdateUserType(u.id, e.target.value)} 
                            className="px-2 py-1 rounded-lg text-xs border bg-gray-50 focus:ring-mutas-500"
                            disabled={currentUser?.id === u.id}
                          >
                            {userTypes.map(t => (
                              <option key={t.id} value={t.name}>{t.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {u.is_active ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.mfa_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {u.mfa_enabled ? 'Activé' : 'Désactivé'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => { setSelectedUser(u); setShowViewUserModal(true); }} className="text-mutas-600 hover:text-mutas-800" title="Voir">
                              <FiEye size={18} />
                            </button>
                            <button onClick={() => openEditModal(u)} className="text-yellow-600 hover:text-yellow-800" title="Modifier">
                              <FiEdit2 size={18} />
                            </button>
                            <button onClick={() => handleToggleUserStatus(u.id, u.is_active)} className={u.is_active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'} title={u.is_active ? 'Désactiver' : 'Activer'}>
                              <FiPower size={18} />
                            </button>
                            {currentUser?.id !== u.id && (
                              <button onClick={() => handleDeleteUser(u.id, u.username)} className="text-red-600 hover:text-red-800" title="Supprimer">
                                <FiTrash2 size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {filteredUsers.length > 0 && (
              <div className="px-6 py-4 border-t flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, filteredUsers.length)} sur {filteredUsers.length}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition">
                    Précédent
                  </button>
                  <span className="px-3 py-1 bg-mutas-500 text-white rounded-lg">{currentPage}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition">
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Onglet Types et Permissions */}
      {activeTab === 'permissions' && (
        <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Types d'utilisateurs</h3>
            <button onClick={() => setShowNewTypeModal(true)} className="flex items-center gap-2 bg-mutas-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-mutas-600 transition">
              <FiPlus size={14} /> Nouveau type
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permissions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {userTypes.map(type => (
                  <tr key={type.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900">{type.name}</td>
                    <td className="px-6 py-4 text-gray-500">{type.description || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(type.permissions || []).slice(0, 3).map(p => (
                          <span key={p.id} className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                            {p.name || p}
                          </span>
                        ))}
                        {(type.permissions || []).length > 3 && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                            +{(type.permissions || []).length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${type.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {type.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedType(type); setShowTypeModal(true); }} className="text-mutas-600 hover:text-mutas-800" title="Gérer les permissions">
                          <FiShield size={18} />
                        </button>
                        <button onClick={() => handleUpdateUserTypeStatus(type.id, type.is_active)} className={type.is_active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'} title={type.is_active ? 'Désactiver' : 'Activer'}>
                          <FiPower size={18} />
                        </button>
                        <button onClick={() => handleDeleteUserType(type.id, type.name)} className="text-red-600 hover:text-red-800" title="Supprimer">
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Utilisateur - Création/Modification */}
      <AnimatePresence>
        {showUserModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white p-5 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold">{isEditing ? 'Modifier' : 'Nouvel'} utilisateur</h2>
                <button onClick={() => { setShowUserModal(false); resetForm(); }} className="p-2 rounded-lg hover:bg-gray-100">
                  <FiX size={22} />
                </button>
              </div>
              <form onSubmit={handleCreateUser} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Nom d'utilisateur *" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="px-3 py-2 border rounded-lg focus:ring-mutas-500 focus:border-mutas-500" required disabled={isEditing} />
                  <input type="email" placeholder="Email *" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="px-3 py-2 border rounded-lg focus:ring-mutas-500 focus:border-mutas-500" required />
                  <input type="text" placeholder="Prénom" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} className="px-3 py-2 border rounded-lg" />
                  <input type="text" placeholder="Nom" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} className="px-3 py-2 border rounded-lg" />
                  <input type="tel" placeholder="Téléphone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="px-3 py-2 border rounded-lg" />
                  <input type="text" placeholder="Adresse" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="px-3 py-2 border rounded-lg" />
                  <select value={formData.user_type} onChange={(e) => setFormData({...formData, user_type: e.target.value})} className="px-3 py-2 border rounded-lg">
                    {userTypes.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                  {!isEditing && (
                    <>
                      <input type="password" placeholder="Mot de passe *" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="px-3 py-2 border rounded-lg focus:ring-mutas-500 focus:border-mutas-500" required />
                      <input type="password" placeholder="Confirmer le mot de passe *" value={formData.confirm_password} onChange={(e) => setFormData({...formData, confirm_password: e.target.value})} className="px-3 py-2 border rounded-lg focus:ring-mutas-500 focus:border-mutas-500" required />
                    </>
                  )}
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" disabled={submitting} className="flex-1 bg-mutas-500 text-white py-2 rounded-lg hover:bg-mutas-600 disabled:opacity-50 flex items-center justify-center gap-2">
                    {submitting ? <FiLoader className="animate-spin" /> : <FiSave />}
                    {submitting ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                  <button type="button" onClick={() => { setShowUserModal(false); resetForm(); }} className="flex-1 border py-2 rounded-lg hover:bg-gray-50">
                    Annuler
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Visualisation Utilisateur */}
      <AnimatePresence>
        {showViewUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-5 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold">Fiche utilisateur</h2>
                <button onClick={() => { setShowViewUserModal(false); setSelectedUser(null); }} className="p-2 rounded-lg hover:bg-gray-100">
                  <FiX size={22} />
                </button>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b">
                  <div className="w-16 h-16 bg-gradient-to-r from-mutas-500 to-mutas-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {selectedUser.first_name?.charAt(0) || selectedUser.username?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{selectedUser.first_name} {selectedUser.last_name}</p>
                    <p className="text-gray-500">@{selectedUser.username}</p>
                    <p className="text-xs text-mutas-500">{selectedUser.user_type}</p>
                  </div>
                </div>
                <p><strong className="text-gray-700">Email:</strong> <span className="text-gray-600">{selectedUser.email || '-'}</span></p>
                <p><strong className="text-gray-700">Téléphone:</strong> <span className="text-gray-600">{selectedUser.phone || '-'}</span></p>
                <p><strong className="text-gray-700">Adresse:</strong> <span className="text-gray-600">{selectedUser.address || '-'}</span></p>
                <p><strong className="text-gray-700">Statut:</strong> 
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${selectedUser.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {selectedUser.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </p>
                <p><strong className="text-gray-700">MFA:</strong> 
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${selectedUser.mfa_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {selectedUser.mfa_enabled ? 'Activé' : 'Désactivé'}
                  </span>
                </p>
                <p><strong className="text-gray-700">Date création:</strong> <span className="text-gray-600">{new Date(selectedUser.date_joined).toLocaleString()}</span></p>
              </div>
              <div className="p-5 border-t flex gap-3">
                <button onClick={() => handlePrintUser(selectedUser)} className="flex-1 flex items-center justify-center gap-2 bg-mutas-500 text-white py-2 rounded-lg hover:bg-mutas-600">
                  <FiPrinter size={16} /> Imprimer
                </button>
                <button onClick={() => { setShowViewUserModal(false); openEditModal(selectedUser); }} className="flex-1 border py-2 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2">
                  <FiEdit2 size={16} /> Modifier
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Permissions */}
      <AnimatePresence>
        {showTypeModal && selectedType && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white p-5 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold">Permissions - {selectedType.name}</h2>
                <button onClick={() => { setShowTypeModal(false); setSelectedType(null); }} className="p-2 rounded-lg hover:bg-gray-100">
                  <FiX size={22} />
                </button>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {permissionsList.map(perm => {
                    const isChecked = selectedType.permissions?.some(p => p.id === perm.id || p === perm.id || p === perm.name);
                    return (
                      <label key={perm.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedType({ 
                                ...selectedType, 
                                permissions: [...(selectedType.permissions || []), perm] 
                              });
                            } else {
                              setSelectedType({ 
                                ...selectedType, 
                                permissions: (selectedType.permissions || []).filter(p => p.id !== perm.id && p !== perm.id && p !== perm.name)
                              });
                            }
                          }} 
                          className="w-4 h-4 text-mutas-500 rounded focus:ring-mutas-500" 
                        />
                        <span className="text-sm text-gray-700">{perm.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="p-5 border-t flex gap-3">
                <button onClick={() => handleUpdatePermissions(selectedType.id, (selectedType.permissions || []).map(p => p.id || p))} className="flex-1 bg-mutas-500 text-white py-2 rounded-lg hover:bg-mutas-600">
                  Enregistrer les permissions
                </button>
                <button onClick={() => { setShowTypeModal(false); setSelectedType(null); }} className="flex-1 border py-2 rounded-lg hover:bg-gray-50">
                  Annuler
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Nouveau Type */}
      <AnimatePresence>
        {showNewTypeModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-5 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold">Nouveau type d'utilisateur</h2>
                <button onClick={() => setShowNewTypeModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                  <FiX size={22} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <input 
                  type="text" 
                  placeholder="Nom du type *" 
                  value={typeFormData.name} 
                  onChange={(e) => setTypeFormData({...typeFormData, name: e.target.value})} 
                  className="w-full px-3 py-2 border rounded-lg focus:ring-mutas-500 focus:border-mutas-500" 
                />
                <textarea 
                  placeholder="Description" 
                  rows={3} 
                  value={typeFormData.description} 
                  onChange={(e) => setTypeFormData({...typeFormData, description: e.target.value})} 
                  className="w-full px-3 py-2 border rounded-lg focus:ring-mutas-500 focus:border-mutas-500" 
                />
              </div>
              <div className="p-5 border-t flex gap-3">
                <button onClick={handleCreateUserType} disabled={submitting} className="flex-1 bg-mutas-500 text-white py-2 rounded-lg hover:bg-mutas-600 disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <FiLoader className="animate-spin" /> : <FiCheck />}
                  {submitting ? 'Création...' : 'Créer'}
                </button>
                <button onClick={() => setShowNewTypeModal(false)} className="flex-1 border py-2 rounded-lg hover:bg-gray-50">
                  Annuler
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default GestionUtilisateurs;