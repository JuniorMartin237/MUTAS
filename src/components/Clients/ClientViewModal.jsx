// src/components/Clients/ClientViewModal.jsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiX, FiUser, FiMail, FiPhone, FiCalendar, FiMapPin, 
  FiBriefcase, FiHome, FiHeart, FiShield, FiPrinter, 
  FiDownload, FiLoader, FiTrash2, FiUserPlus, FiChevronRight,
  FiCheckCircle, FiClock, FiAlertCircle, FiEdit2, FiRefreshCw,
  FiUsers, FiPlus
} from 'react-icons/fi';
import { clientService } from '../../services/sinistreService';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ClientViewModal = ({ isOpen, onClose, client, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [souscriptions, setSouscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [newMember, setNewMember] = useState({
    nom: '',
    prenom: '',
    email: '',
    phone: '',
    relation: '',
    taux: 80
  });
  const [addingMember, setAddingMember] = useState(false);
  const [selectedSouscription, setSelectedSouscription] = useState(null);

  useEffect(() => {
    if (isOpen && client) {
      fetchSouscriptions();
    }
  }, [isOpen, client]);

  const fetchSouscriptions = async () => {
    setLoading(true);
    try {
      const response = await clientService.getClientSouscriptions(client.id);
      console.log('Souscriptions reçues:', response.data);
      setSouscriptions(response.data || []);
      
      // Récupérer les membres pour chaque souscription FAMILLE
      const familySouscriptions = (response.data || []).filter(s => s.assurance?.couverture === 'FAMILLE');
      let allMembers = [];
      for (const sous of familySouscriptions) {
        try {
          const membersRes = await clientService.getFamilyMembers(sous.id);
          allMembers = [...allMembers, ...(membersRes.data || [])];
        } catch (e) {
          console.error('Erreur récupération membres:', e);
        }
      }
      setFamilyMembers(allMembers);
    } catch (error) {
      console.error('Erreur chargement souscriptions:', error);
      setSouscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFamilyMember = async () => {
    if (!newMember.nom || !newMember.prenom || !newMember.email) {
      toast.error('Nom, prénom et email requis');
      return;
    }

    if (!selectedSouscription) {
      toast.error('Veuillez sélectionner une souscription FAMILLE');
      return;
    }

    setAddingMember(true);
    try {
      // Créer le client membre
      const userPayload = {
        user: {
          username: newMember.email.split('@')[0],
          email: newMember.email,
          first_name: newMember.prenom,
          last_name: newMember.nom,
          phone: newMember.phone || '',
          password: 'Temp123!'
        },
        genre: 'M'
      };
      
      const clientRes = await clientService.createClient(userPayload);
      const memberClientId = clientRes.data.id;

      // Ajouter à la souscription
      await clientService.addFamilyMember(selectedSouscription, {
        client_id: memberClientId,
        relation: newMember.relation,
        taux_prise_en_charge: parseFloat(newMember.taux)
      });

      toast.success('Membre ajouté avec succès');
      setNewMember({ nom: '', prenom: '', email: '', phone: '', relation: '', taux: 80 });
      setShowFamilyModal(false);
      setSelectedSouscription(null);
      fetchSouscriptions();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de l\'ajout du membre');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveFamilyMember = async (memberId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir retirer ce membre ?')) return;
    
    try {
      await clientService.removeFamilyMember(memberId);
      toast.success('Membre retiré avec succès');
      fetchSouscriptions();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du retrait du membre');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'SUSPENDED': 'bg-orange-100 text-orange-800',
      'EXPIRED': 'bg-red-100 text-red-800',
      'CANCELLED': 'bg-gray-100 text-gray-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'ACTIVE': return <FiCheckCircle className="text-green-500" />;
      case 'PENDING': return <FiClock className="text-yellow-500" />;
      case 'SUSPENDED': return <FiAlertCircle className="text-orange-500" />;
      case 'EXPIRED': return <FiAlertCircle className="text-red-500" />;
      default: return <FiClock className="text-gray-500" />;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'ACTIVE': 'Active',
      'PENDING': 'En attente',
      'SUSPENDED': 'Suspendue',
      'EXPIRED': 'Expirée',
      'CANCELLED': 'Annulée'
    };
    return labels[status] || status;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Fiche Client - ${client.user?.first_name} ${client.user?.last_name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            h1 { color: #0EA5E9; border-bottom: 2px solid #0EA5E9; padding-bottom: 10px; }
            h2 { color: #1F2937; margin-top: 20px; }
            .section { margin-bottom: 20px; border: 1px solid #E5E7EB; border-radius: 8px; padding: 15px; }
            .label { font-weight: bold; width: 150px; display: inline-block; }
            .row { margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #E5E7EB; padding: 8px; text-align: left; }
            th { background-color: #F3F4F6; }
            .status-active { color: #10B981; }
            .status-expired { color: #EF4444; }
          </style>
        </head>
        <body>
          <h1>FICHE CLIENT - ${client.code || client.id}</h1>
          
          <div class="section">
            <h2>Informations personnelles</h2>
            <div class="row"><span class="label">Nom complet:</span> ${client.user?.first_name} ${client.user?.last_name}</div>
            <div class="row"><span class="label">Nom d'utilisateur:</span> ${client.user?.username}</div>
            <div class="row"><span class="label">Email:</span> ${client.user?.email}</div>
            <div class="row"><span class="label">Téléphone:</span> ${client.user?.phone || '-'}</div>
            <div class="row"><span class="label">Genre:</span> ${client.genre === 'M' ? 'Masculin' : 'Féminin'}</div>
            <div class="row"><span class="label">Date naissance:</span> ${client.date_naissance ? new Date(client.date_naissance).toLocaleDateString() : '-'}</div>
            <div class="row"><span class="label">Lieu naissance:</span> ${client.lieu_naissance || '-'}</div>
            <div class="row"><span class="label">Profession:</span> ${client.profession || '-'}</div>
            <div class="row"><span class="label">Entreprise:</span> ${client.entreprise || '-'}</div>
            <div class="row"><span class="label">Statut:</span> ${client.user?.is_active ? 'Actif' : 'Inactif'}</div>
          </div>
          
          <div class="section">
            <h2>Assurances souscrites</h2>
            ${souscriptions.length === 0 ? '<p>Aucune assurance souscrite</p>' : `
              <table>
                <thead><tr><th>Assurance</th><th>Type</th><th>Taux</th><th>Date début</th><th>Date fin</th><th>Statut</th></tr></thead>
                <tbody>
                  ${souscriptions.map(s => `
                    <tr>
                      <td>${s.assurance?.name || '-'}</td>
                      <td>${s.assurance?.type_assurance || '-'}</td>
                      <td>${s.taux_prise_en_charge}%</td>
                      <td>${new Date(s.date_debut).toLocaleDateString()}</td>
                      <td>${new Date(s.date_fin).toLocaleDateString()}</td>
                      <td class="${s.status === 'ACTIVE' ? 'status-active' : 'status-expired'}">${getStatusLabel(s.status)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            `}
          </div>
          
          ${familyMembers.length > 0 ? `
            <div class="section">
              <h2>Membres de la famille</h2>
              <table>
                <thead><tr><th>Nom</th><th>Relation</th><th>Taux</th></tr></thead>
                <tbody>
                  ${familyMembers.map(m => `
                    <tr>
                      <td>${m.client_name || '-'}</td>
                      <td>${m.relation || '-'}</td>
                      <td>${m.taux_prise_en_charge}%</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}
          
          <p style="font-size: 12px; color: #6B7280; margin-top: 20px; text-align: center;">
            Document généré le ${new Date().toLocaleString()}
          </p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const exportToPDF = async () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setTextColor(14, 165, 233);
    doc.text(`Fiche Client - ${client.code || client.id}`, 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Généré le: ${new Date().toLocaleString()}`, 14, 30);
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Informations personnelles', 14, 45);
    
    const personalInfo = [
      ['Nom complet', `${client.user?.first_name} ${client.user?.last_name}`],
      ['Nom d\'utilisateur', client.user?.username],
      ['Email', client.user?.email],
      ['Téléphone', client.user?.phone || '-'],
      ['Genre', client.genre === 'M' ? 'Masculin' : 'Féminin'],
      ['Date naissance', client.date_naissance ? new Date(client.date_naissance).toLocaleDateString() : '-'],
      ['Lieu naissance', client.lieu_naissance || '-'],
      ['Profession', client.profession || '-'],
      ['Entreprise', client.entreprise || '-'],
      ['Statut', client.user?.is_active ? 'Actif' : 'Inactif']
    ];
    
    doc.autoTable({
      startY: 50,
      head: [['Champ', 'Valeur']],
      body: personalInfo,
      theme: 'striped',
      headStyles: { fillColor: [14, 165, 233] }
    });
    
    let finalY = doc.lastAutoTable.finalY + 10;
    doc.text('Assurances souscrites', 14, finalY);
    
    if (souscriptions.length === 0) {
      doc.text('Aucune assurance souscrite', 14, finalY + 10);
    } else {
      const assurancesData = souscriptions.map(s => [
        s.assurance?.name || '-',
        s.assurance?.type_assurance || '-',
        `${s.taux_prise_en_charge}%`,
        new Date(s.date_debut).toLocaleDateString(),
        new Date(s.date_fin).toLocaleDateString(),
        getStatusLabel(s.status)
      ]);
      
      doc.autoTable({
        startY: finalY + 5,
        head: [['Assurance', 'Type', 'Taux', 'Début', 'Fin', 'Statut']],
        body: assurancesData,
        theme: 'striped',
        headStyles: { fillColor: [14, 165, 233] }
      });
      finalY = doc.lastAutoTable.finalY;
    }
    
    if (familyMembers.length > 0) {
      doc.text('Membres de la famille', 14, finalY + 10);
      const membersData = familyMembers.map(m => [
        m.client_name || '-',
        m.relation || '-',
        `${m.taux_prise_en_charge}%`
      ]);
      
      doc.autoTable({
        startY: finalY + 15,
        head: [['Nom', 'Relation', 'Taux']],
        body: membersData,
        theme: 'striped',
        headStyles: { fillColor: [14, 165, 233] }
      });
    }
    
    doc.save(`fiche_client_${client.code || client.id}.pdf`);
    toast.success('PDF exporté avec succès');
  };

  const familySouscriptions = souscriptions.filter(s => s.assurance?.couverture === 'FAMILLE' && s.status === 'ACTIVE');

  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        {/* En-tête */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-mutas-100 rounded-full flex items-center justify-center">
              <FiUser className="text-mutas-500 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{client.user?.first_name} {client.user?.last_name}</h2>
              <p className="text-sm text-gray-500">Code: {client.code || client.id}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handlePrint}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
              title="Imprimer"
            >
              <FiPrinter size={20} />
            </button>
            <button 
              onClick={exportToPDF}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
              title="Exporter PDF"
            >
              <FiDownload size={20} />
            </button>
            <button 
              onClick={onClose} 
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
            >
              <FiX size={22} />
            </button>
          </div>
        </div>
        
        {/* Onglets */}
        <div className="flex border-b px-6">
          <button 
            onClick={() => setActiveTab('info')}
            className={`px-4 py-3 font-medium text-sm transition ${
              activeTab === 'info' 
                ? 'text-mutas-500 border-b-2 border-mutas-500' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FiUser className="inline mr-2" size={14} /> Informations
          </button>
          <button 
            onClick={() => setActiveTab('assurances')}
            className={`px-4 py-3 font-medium text-sm transition ${
              activeTab === 'assurances' 
                ? 'text-mutas-500 border-b-2 border-mutas-500' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FiShield className="inline mr-2" size={14} /> Assurances ({souscriptions.length})
          </button>
          {familyMembers.length > 0 && (
            <button 
              onClick={() => setActiveTab('family')}
              className={`px-4 py-3 font-medium text-sm transition ${
                activeTab === 'family' 
                  ? 'text-mutas-500 border-b-2 border-mutas-500' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FiUsers className="inline mr-2" size={14} /> Famille ({familyMembers.length})
            </button>
          )}
        </div>
        
        <div className="p-6">
          {/* Onglet Informations */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <FiUser size={16} />
                  <span className="text-xs uppercase tracking-wide">Identité</span>
                </div>
                <div className="space-y-2">
                  <p><span className="text-sm text-gray-500">Nom complet:</span> <span className="font-medium">{client.user?.first_name} {client.user?.last_name}</span></p>
                  <p><span className="text-sm text-gray-500">Nom d'utilisateur:</span> <span className="font-medium">@{client.user?.username}</span></p>
                  <p><span className="text-sm text-gray-500">Genre:</span> <span className="font-medium">{client.genre === 'M' ? 'Masculin' : 'Féminin'}</span></p>
                  <p><span className="text-sm text-gray-500">Date naissance:</span> <span className="font-medium">{client.date_naissance ? new Date(client.date_naissance).toLocaleDateString() : '-'}</span></p>
                  <p><span className="text-sm text-gray-500">Lieu naissance:</span> <span className="font-medium">{client.lieu_naissance || '-'}</span></p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <FiMail size={16} />
                  <span className="text-xs uppercase tracking-wide">Contact</span>
                </div>
                <div className="space-y-2">
                  <p><span className="text-sm text-gray-500">Email:</span> <span className="font-medium">{client.user?.email}</span></p>
                  <p><span className="text-sm text-gray-500">Téléphone:</span> <span className="font-medium">{client.user?.phone || '-'}</span></p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <FiBriefcase size={16} />
                  <span className="text-xs uppercase tracking-wide">Professionnel</span>
                </div>
                <div className="space-y-2">
                  <p><span className="text-sm text-gray-500">Profession:</span> <span className="font-medium">{client.profession || '-'}</span></p>
                  <p><span className="text-sm text-gray-500">Entreprise:</span> <span className="font-medium">{client.entreprise || '-'}</span></p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <FiHome size={16} />
                  <span className="text-xs uppercase tracking-wide">Statut</span>
                </div>
                <div className="space-y-2">
                  <p><span className="text-sm text-gray-500">Code client:</span> <span className="font-mono font-medium">{client.code || client.id}</span></p>
                  <p><span className="text-sm text-gray-500">Statut compte:</span> 
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${client.user?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {client.user?.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </p>
                  <p><span className="text-sm text-gray-500">Date création:</span> <span className="font-medium">{new Date(client.created_at).toLocaleDateString()}</span></p>
                </div>
              </div>
            </div>
          )}
          
          {/* Onglet Assurances */}
          {activeTab === 'assurances' && (
            <div>
              {loading ? (
                <div className="flex justify-center py-12">
                  <FiLoader className="w-8 h-8 text-mutas-500 animate-spin" />
                </div>
              ) : souscriptions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FiShield size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>Aucune assurance souscrite</p>
                  <p className="text-sm mt-2">Ce client n'a pas encore souscrit à une assurance</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {souscriptions.map((souscription) => (
                    <div key={souscription.id} className="border rounded-xl p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <FiShield className="text-blue-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{souscription.assurance?.name}</h3>
                            <p className="text-sm text-gray-500">{souscription.assurance?.type_assurance}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusBadge(souscription.status)}`}>
                            {getStatusIcon(souscription.status)} {getStatusLabel(souscription.status)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">Couverture</p>
                          <p className="font-medium">{souscription.assurance?.couverture === 'FAMILLE' ? 'Familiale' : 'Individuelle'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Taux prise en charge</p>
                          <p className="font-medium">{souscription.taux_prise_en_charge}%</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Date début</p>
                          <p className="font-medium">{new Date(souscription.date_debut).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Date fin</p>
                          <p className="font-medium">{new Date(souscription.date_fin).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {souscription.conditions && Object.keys(souscription.conditions).length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-gray-500 mb-1">Conditions particulières</p>
                          <div className="text-xs text-gray-600">
                            {Object.entries(souscription.conditions).map(([key, value]) => (
                              <p key={key}>• {key}: {value}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Onglet Famille */}
          {activeTab === 'family' && (
            <div>
              {familySouscriptions.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Souscription FAMILLE</label>
                  <select 
                    value={selectedSouscription || ''} 
                    onChange={(e) => setSelectedSouscription(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Sélectionner une souscription</option>
                    {familySouscriptions.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.assurance?.name} (jusqu'au {new Date(s.date_fin).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Membres de la famille</h3>
                <button 
                  onClick={() => setShowFamilyModal(true)}
                  disabled={familySouscriptions.length === 0}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                    familySouscriptions.length > 0 
                      ? 'bg-mutas-500 text-white hover:bg-mutas-600' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <FiUserPlus size={14} /> Ajouter un membre
                </button>
              </div>
              
              {familyMembers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FiUsers size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>Aucun membre de la famille</p>
                  {familySouscriptions.length === 0 && (
                    <p className="text-sm mt-2">Aucune souscription FAMILLE active</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {familyMembers.map((member) => (
                    <div key={member.id} className="border rounded-lg p-4 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <FiUser className="text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium">{member.client_name}</p>
                          <p className="text-sm text-gray-500">{member.relation} • Taux: {member.taux_prise_en_charge}%</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRemoveFamilyMember(member.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Retirer"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Modal Ajout Membre Famille */}
      {showFamilyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-5 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">Ajouter un membre</h3>
              <button onClick={() => setShowFamilyModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <FiX size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Souscription *</label>
                <select 
                  value={selectedSouscription || ''} 
                  onChange={(e) => setSelectedSouscription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Sélectionner une souscription</option>
                  {familySouscriptions.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.assurance?.name} (jusqu'au {new Date(s.date_fin).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="text" 
                  placeholder="Nom" 
                  value={newMember.nom} 
                  onChange={(e) => setNewMember({...newMember, nom: e.target.value})} 
                  className="px-3 py-2 border rounded-lg"
                />
                <input 
                  type="text" 
                  placeholder="Prénom" 
                  value={newMember.prenom} 
                  onChange={(e) => setNewMember({...newMember, prenom: e.target.value})} 
                  className="px-3 py-2 border rounded-lg"
                />
                <input 
                  type="email" 
                  placeholder="Email" 
                  value={newMember.email} 
                  onChange={(e) => setNewMember({...newMember, email: e.target.value})} 
                  className="px-3 py-2 border rounded-lg"
                />
                <input 
                  type="text" 
                  placeholder="Téléphone" 
                  value={newMember.phone} 
                  onChange={(e) => setNewMember({...newMember, phone: e.target.value})} 
                  className="px-3 py-2 border rounded-lg"
                />
                <input 
                  type="text" 
                  placeholder="Lien de parenté" 
                  value={newMember.relation} 
                  onChange={(e) => setNewMember({...newMember, relation: e.target.value})} 
                  className="px-3 py-2 border rounded-lg"
                />
                <input 
                  type="number" 
                  placeholder="Taux %" 
                  value={newMember.taux} 
                  onChange={(e) => setNewMember({...newMember, taux: e.target.value})} 
                  className="px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="p-5 border-t flex gap-3">
              <button 
                onClick={handleAddFamilyMember} 
                disabled={addingMember || !selectedSouscription}
                className="flex-1 bg-mutas-500 text-white py-2 rounded-lg hover:bg-mutas-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {addingMember ? <FiLoader className="animate-spin" /> : <FiUserPlus />}
                {addingMember ? 'Ajout...' : 'Ajouter'}
              </button>
              <button onClick={() => setShowFamilyModal(false)} className="flex-1 border py-2 rounded-lg">Annuler</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ClientViewModal;