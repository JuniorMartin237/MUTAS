// src/pages/Sinistres/IndemnisationPage.jsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiEye, FiDollarSign, FiXCircle, FiSearch, FiDownload, 
  FiCheckCircle, FiPrinter, FiLoader, FiX, FiRefreshCw,
  FiEdit2
} from 'react-icons/fi';
import { sinistreService } from '../../services/sinistreService';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Modal Rejet (Expert)
const RejectionModal = ({ isOpen, onClose, sinistre, onConfirm }) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !sinistre) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error('Veuillez indiquer un motif de rejet');
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm(sinistre.id, reason);
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-5 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-red-600">Rejet du sinistre (Expert)</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><FiX size={22} /></button>
        </div>
        
        <div className="p-5 space-y-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-500">Référence</p>
            <p className="font-mono font-medium">{sinistre.reference}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Motif du rejet *</label>
            <textarea 
              rows={4} 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-red-500 focus:border-red-500"
              placeholder="Expliquez la raison du rejet..."
              required
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button 
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-red-500 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-red-600 disabled:opacity-50"
            >
              {submitting ? <FiLoader className="animate-spin" /> : <FiXCircle />}
              {submitting ? 'Traitement...' : 'Confirmer le rejet'}
            </button>
            <button onClick={onClose} className="flex-1 border py-2 rounded-lg">Annuler</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Modal Indemnisation (Expert)
const IndemnisationModal = ({ isOpen, onClose, sinistre, onIndemniser }) => {
  const [montant, setMontant] = useState('');
  const [reference, setReference] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [conditions, setConditions] = useState({
    delai_paiement: 30,
    mode_paiement: 'VIREMENT',
    frais_dossier: 0,
    observations: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (sinistre) {
      setMontant(sinistre.approved_amount || sinistre.estimated_amount || '');
    }
  }, [sinistre]);

  if (!isOpen || !sinistre) return null;

  const handleSubmit = async () => {
    if (!montant || parseFloat(montant) <= 0) {
      toast.error('Veuillez renseigner un montant valide');
      return;
    }
    if (!reference.trim()) {
      toast.error('Veuillez renseigner une référence d\'indemnisation');
      return;
    }
    setSubmitting(true);
    try {
      await onIndemniser(sinistre.id, { 
        montant, 
        reference, 
        commentaire,
        conditions
      });
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-5 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-green-600">Indemniser le sinistre</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><FiX size={22} /></button>
        </div>
        
        <div className="p-5 space-y-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-500">Référence</p>
            <p className="font-mono font-medium">{sinistre.reference}</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-500">Sinistré</p>
            <p className="font-medium">{sinistre.sinistre_name || 'Non renseigné'}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Montant à indemniser (FCFA) *</label>
            <input 
              type="number" 
              value={montant} 
              onChange={(e) => setMontant(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500"
              placeholder="Montant de l'indemnisation"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Référence indemnisation *</label>
            <input 
              type="text" 
              value={reference} 
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500"
              placeholder="IND-XXXXX"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Conditions d'indemnisation</label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Délai de paiement (jours)</label>
                <input 
                  type="number" 
                  value={conditions.delai_paiement} 
                  onChange={(e) => setConditions({...conditions, delai_paiement: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Mode de paiement</label>
                <select 
                  value={conditions.mode_paiement} 
                  onChange={(e) => setConditions({...conditions, mode_paiement: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="VIREMENT">Virement bancaire</option>
                  <option value="CHEQUE">Chèque</option>
                  <option value="ESPECES">Espèces</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Frais de dossier (FCFA)</label>
                <input 
                  type="number" 
                  value={conditions.frais_dossier} 
                  onChange={(e) => setConditions({...conditions, frais_dossier: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Observations</label>
                <textarea 
                  rows={2} 
                  value={conditions.observations} 
                  onChange={(e) => setConditions({...conditions, observations: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="Conditions particulières..."
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Commentaire</label>
            <textarea 
              rows={3} 
              value={commentaire} 
              onChange={(e) => setCommentaire(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Informations complémentaires..."
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button 
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-green-500 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-600 disabled:opacity-50"
            >
              {submitting ? <FiLoader className="animate-spin" /> : <FiDollarSign />}
              {submitting ? 'Traitement...' : 'Valider l\'indemnisation'}
            </button>
            <button onClick={onClose} className="flex-1 border py-2 rounded-lg">Annuler</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

function IndemnisationPage() {
  const { user } = useAuth();
  const [sinistres, setSinistres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showIndemniserModal, setShowIndemniserModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedSinistre, setSelectedSinistre] = useState(null);

  const isExpert = user?.user_type === 'EXPERT' || user?.user_type === 'ADMIN' || user?.user_type === 'DIRECTEUR';

  const fetchSinistres = async () => {
    setLoading(true);
    try {
      const response = await sinistreService.getValidationSinistres();
      console.log('Sinistres en validation (expert):', response.data);
      setSinistres(response.data || []);
    } catch (error) {
      console.error('Erreur chargement sinistres:', error);
      toast.error('Erreur lors du chargement des sinistres');
      setSinistres([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSinistres();
  }, []);

  const handleIndemniser = async (sinistreId, data) => {
    try {
      await sinistreService.expertValidate(sinistreId, {
        decision: 'APPROVED',
        approved_amount: data.montant,
        conditions: data.conditions
      });
      toast.success('Sinistre indemnisé avec succès');
      await fetchSinistres();
      setShowIndemniserModal(false);
      setSelectedSinistre(null);
    } catch (error) {
      console.error('Erreur indemnisation:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de l\'indemnisation');
      throw error;
    }
  };

  const handleRejeter = async (sinistreId, reason) => {
    try {
      await sinistreService.expertValidate(sinistreId, {
        decision: 'REJECTED',
        rejection_reason: reason
      });
      toast.success('Sinistre rejeté. Il retourne au déclarant pour modification.');
      await fetchSinistres();
      setShowRejectionModal(false);
      setSelectedSinistre(null);
    } catch (error) {
      console.error('Erreur rejet:', error);
      toast.error(error.response?.data?.error || 'Erreur lors du rejet');
      throw error;
    }
  };

  const handlePrint = (sinistre) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Indemnisation - ${sinistre.reference}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            h1 { color: #0EA5E9; border-bottom: 2px solid #0EA5E9; padding-bottom: 10px; }
            h2 { color: #1F2937; margin-top: 20px; }
            .section { margin-bottom: 20px; border: 1px solid #E5E7EB; border-radius: 8px; padding: 15px; }
            .label { font-weight: bold; width: 200px; display: inline-block; }
            .row { margin-bottom: 10px; }
            .amount { font-size: 18px; font-weight: bold; color: #10B981; }
          </style>
        </head>
        <body>
          <h1>ORDRE D'INDEMNISATION N° ${sinistre.reference}</h1>
          
          <div class="section">
            <h2>Informations du sinistre</h2>
            <div class="row"><span class="label">Référence:</span> ${sinistre.reference}</div>
            <div class="row"><span class="label">Sinistré:</span> ${sinistre.sinistre_name || '-'}</div>
            <div class="row"><span class="label">Type de sinistre:</span> ${sinistre.type_sinistre}</div>
            <div class="row"><span class="label">Date d'incident:</span> ${new Date(sinistre.incident_date).toLocaleString()}</div>
            <div class="row"><span class="label">Adresse:</span> ${sinistre.address || 'Non renseignée'}</div>
          </div>
          
          <div class="section">
            <h2>Montants</h2>
            <div class="row"><span class="label">Montant estimé:</span> ${sinistre.estimated_amount?.toLocaleString()} FCFA</div>
            <div class="row"><span class="label">Montant approuvé:</span> <span class="amount">${sinistre.approved_amount?.toLocaleString()} FCFA</span></div>
          </div>
          
          <div class="section">
            <h2>Description</h2>
            <p>${sinistre.description || 'Non renseignée'}</p>
          </div>
          
          <p style="font-size: 12px; color: #6B7280; margin-top: 30px; text-align: center;">
            Document généré le ${new Date().toLocaleString()}
          </p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getStatusBadge = (status) => {
    const badges = {
      'VALIDATION': 'bg-indigo-100 text-indigo-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'INDEMNISE': 'bg-teal-100 text-teal-800',
      'REJECTED': 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'VALIDATION': 'En attente',
      'APPROVED': 'Approuvé',
      'INDEMNISE': 'Indemnisé',
      'REJECTED': 'Rejeté',
    };
    return labels[status] || status;
  };

  const filteredSinistres = sinistres.filter(s =>
    s.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.type_sinistre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.sinistre_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSinistres.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSinistres.length / itemsPerPage);

  const exportCSV = () => {
    const headers = ['Référence', 'Sinistré', 'Type', 'Date incident', 'Montant estimé', 'Statut'];
    const rows = sinistres.map(s => [
      s.reference,
      s.sinistre_name || '-',
      s.type_sinistre,
      new Date(s.incident_date).toLocaleDateString(),
      s.estimated_amount?.toLocaleString() || '-',
      getStatusLabel(s.status)
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expertise_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export CSV réussi');
  };

  const exportExcel = () => {
    const wsData = sinistres.map(s => ({
      'Référence': s.reference,
      'Sinistré': s.sinistre_name || '-',
      'Type': s.type_sinistre,
      'Date incident': new Date(s.incident_date).toLocaleDateString(),
      'Montant estimé (FCFA)': s.estimated_amount,
      'Statut': getStatusLabel(s.status)
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expertise');
    XLSX.writeFile(wb, `expertise_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Export Excel réussi');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setTextColor(14, 165, 233);
    doc.text('Rapport d\'Expertise - Sinistres à traiter', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Généré le: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Expert: ${user?.username || 'Utilisateur'}`, 14, 37);
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Liste des sinistres en attente', 14, 50);
    
    const tableData = sinistres.map(s => [
      s.reference,
      s.sinistre_name || '-',
      s.type_sinistre,
      new Date(s.incident_date).toLocaleDateString(),
      `${(s.estimated_amount || 0).toLocaleString()} FCFA`,
      getStatusLabel(s.status)
    ]);
    
    doc.autoTable({
      startY: 55,
      head: [['Référence', 'Sinistré', 'Type', 'Date', 'Montant estimé', 'Statut']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [14, 165, 233] }
    });
    
    doc.save(`expertise_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Export PDF réussi');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-mutas-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-gray-500">Chargement des sinistres...</p>
      </div>
    );
  }

  if (!isExpert) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <FiXCircle size={32} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Accès non autorisé</h2>
        <p className="text-gray-500 mt-2">Vous n'avez pas les droits pour accéder à cette page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Expertise des sinistres</h1>
        <p className="text-gray-500 mt-1">Sinistres à expertiser et à indemniser</p>
      </div>

      {/* Barre d'outils */}
      <div className="flex flex-wrap justify-between gap-4">
        <div className="flex gap-2">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par référence, sinistré..."
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
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
            <FiDownload size={16} /> CSV
          </button>
          <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-lg hover:bg-green-200 transition">
            <FiDownload size={16} /> Excel
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-red-100 rounded-lg hover:bg-red-200 transition">
            <FiDownload size={16} /> PDF
          </button>
          <button onClick={fetchSinistres} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
            <FiRefreshCw size={16} /> Actualiser
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sinistré</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date incident</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant estimé</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Validateur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <FiDollarSign size={48} className="mx-auto mb-3 text-gray-300" />
                    <p>Aucun sinistre à expertiser</p>
                  </td>
                </tr>
              ) : (
                currentItems.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-mono text-sm font-medium">{s.reference}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-mutas-100 rounded-full flex items-center justify-center">
                          <FiUser className="text-mutas-500 text-sm" />
                        </div>
                        <span className="font-medium">{s.sinistre_name || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{s.type_sinistre}</td>
                    <td className="px-6 py-4 text-sm">{new Date(s.incident_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm">{s.estimated_amount?.toLocaleString()} FCFA</td>
                    <td className="px-6 py-4 text-sm">{s.validateur_name || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setSelectedSinistre(s); setShowViewModal(true); }} 
                          className="p-2 text-mutas-500 hover:bg-mutas-50 rounded-lg transition" 
                          title="Voir"
                        >
                          <FiEye size={18} />
                        </button>
                        <button 
                          onClick={() => { setSelectedSinistre(s); setShowIndemniserModal(true); }} 
                          className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition" 
                          title="Indemniser"
                        >
                          <FiDollarSign size={18} />
                        </button>
                        <button 
                          onClick={() => { setSelectedSinistre(s); setShowRejectionModal(true); }} 
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" 
                          title="Rejeter"
                        >
                          <FiXCircle size={18} />
                        </button>
                        <button 
                          onClick={() => handlePrint(s)} 
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition" 
                          title="Imprimer"
                        >
                          <FiPrinter size={18} />
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
        {filteredSinistres.length > 0 && (
          <div className="px-6 py-4 border-t flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, filteredSinistres.length)} sur {filteredSinistres.length}
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1} 
                className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
              >
                Précédent
              </button>
              <span className="px-3 py-1 bg-mutas-500 text-white rounded-lg">{currentPage}</span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages} 
                className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Visualisation */}
      {showViewModal && selectedSinistre && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-5 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Détails du sinistre</h2>
              <button onClick={() => { setShowViewModal(false); setSelectedSinistre(null); }} className="p-2 rounded-lg hover:bg-gray-100">
                <FiX size={22} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-gray-400">Référence</label><p className="font-mono">{selectedSinistre.reference}</p></div>
                <div><label className="text-xs text-gray-400">Type</label><p>{selectedSinistre.type_sinistre}</p></div>
                <div><label className="text-xs text-gray-400">Sinistré</label><p>{selectedSinistre.sinistre_name || '-'}</p></div>
                <div><label className="text-xs text-gray-400">Validateur</label><p>{selectedSinistre.validateur_name || '-'}</p></div>
                <div><label className="text-xs text-gray-400">Date incident</label><p>{new Date(selectedSinistre.incident_date).toLocaleString()}</p></div>
                <div><label className="text-xs text-gray-400">Adresse</label><p>{selectedSinistre.address || 'Non renseignée'}</p></div>
              </div>
              <div><label className="text-xs text-gray-400">Description</label><p className="bg-gray-50 p-3 rounded-lg">{selectedSinistre.description || 'Non renseignée'}</p></div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <label className="text-xs text-gray-400">Montant estimé</label>
                <p className="text-lg font-semibold">{selectedSinistre.estimated_amount?.toLocaleString()} FCFA</p>
              </div>
            </div>
            <div className="p-5 border-t">
              <button onClick={() => handlePrint(selectedSinistre)} className="w-full flex items-center justify-center gap-2 bg-mutas-500 text-white py-2 rounded-lg hover:bg-mutas-600">
                <FiPrinter /> Imprimer la fiche sinistre
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Indemnisation */}
      <IndemnisationModal 
        isOpen={showIndemniserModal}
        onClose={() => { setShowIndemniserModal(false); setSelectedSinistre(null); }}
        sinistre={selectedSinistre}
        onIndemniser={handleIndemniser}
      />

      {/* Modal Rejet */}
      <RejectionModal 
        isOpen={showRejectionModal}
        onClose={() => { setShowRejectionModal(false); setSelectedSinistre(null); }}
        sinistre={selectedSinistre}
        onConfirm={handleRejeter}
      />
    </div>
  );
}

export default IndemnisationPage;