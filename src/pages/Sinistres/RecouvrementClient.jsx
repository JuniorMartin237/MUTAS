// src/pages/Sinistres/RecouvrementClient.jsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiDollarSign, FiUser, FiSearch, FiPlus, FiRefreshCw,
  FiCheckCircle, FiClock, FiAlertCircle, FiDownload,
  FiCalendar, FiPhone, FiMail, FiX, FiLoader, FiEdit2,
  FiTrash2, FiFileText, FiTrendingUp, FiPrinter
} from 'react-icons/fi';
import { clientService } from '../../services/sinistreService';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Modal Création/Modification Recouvrement
const RecouvrementModal = ({ isOpen, onClose, onSuccess, client, recouvrement = null }) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    montant: '',
    type_recouvrement: 'COTISATION',
    date_echeance: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    // Champs pour prêt
    marge_benefice: '',
    nombre_mensualites: '',
    date_debut_remboursement: '',
    motif_pret: '',
    // Champs pour cotisation
    periode_cotisation: '',
    // Champs pour autre
    libelle_autre: ''
  });

  useEffect(() => {
    if (recouvrement) {
      setFormData({
        montant: recouvrement.montant || '',
        type_recouvrement: recouvrement.type_recouvrement || 'COTISATION',
        date_echeance: recouvrement.date_echeance || new Date().toISOString().split('T')[0],
        description: recouvrement.description || '',
        reference: recouvrement.reference || '',
        marge_benefice: recouvrement.marge_benefice || '',
        nombre_mensualites: recouvrement.nombre_mensualites || '',
        date_debut_remboursement: recouvrement.date_debut_remboursement || '',
        motif_pret: recouvrement.motif_pret || '',
        periode_cotisation: recouvrement.periode_cotisation || '',
        libelle_autre: recouvrement.libelle_autre || ''
      });
    } else {
      setFormData({
        montant: '',
        type_recouvrement: 'COTISATION',
        date_echeance: new Date().toISOString().split('T')[0],
        description: '',
        reference: '',
        marge_benefice: '',
        nombre_mensualites: '',
        date_debut_remboursement: '',
        motif_pret: '',
        periode_cotisation: '',
        libelle_autre: ''
      });
    }
  }, [recouvrement, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.montant || parseFloat(formData.montant) <= 0) {
      toast.error('Veuillez renseigner un montant valide');
      return;
    }
    if (!formData.date_echeance) {
      toast.error('Veuillez renseigner la date d\'échéance');
      return;
    }
    
    // Validation spécifique selon le type
    if (formData.type_recouvrement === 'PRET') {
      if (!formData.nombre_mensualites || formData.nombre_mensualites <= 0) {
        toast.error('Veuillez renseigner le nombre de mensualités');
        return;
      }
      if (!formData.date_debut_remboursement) {
        toast.error('Veuillez renseigner la date de début de remboursement');
        return;
      }
    }
    
    if (formData.type_recouvrement === 'AUTRE' && !formData.libelle_autre) {
      toast.error('Veuillez renseigner le libellé');
      return;
    }
    
    if (formData.type_recouvrement === 'COTISATION' && !formData.periode_cotisation) {
      toast.error('Veuillez renseigner la période de cotisation');
      return;
    }
    
    setSubmitting(true);
    try {
      const payload = {
        client_id: client.id,
        montant: parseFloat(formData.montant),
        type_recouvrement: formData.type_recouvrement,
        date_echeance: formData.date_echeance,
        description: formData.description,
        reference: formData.reference
      };
      
      // Ajouter les champs spécifiques
      if (formData.type_recouvrement === 'PRET') {
        payload.marge_benefice = formData.marge_benefice ? parseFloat(formData.marge_benefice) : null;
        payload.nombre_mensualites = parseInt(formData.nombre_mensualites);
        payload.date_debut_remboursement = formData.date_debut_remboursement;
        payload.motif_pret = formData.motif_pret;
      } else if (formData.type_recouvrement === 'COTISATION') {
        payload.periode_cotisation = formData.periode_cotisation;
      } else if (formData.type_recouvrement === 'AUTRE') {
        payload.libelle_autre = formData.libelle_autre;
      }
      
      if (recouvrement) {
        await clientService.updateRecouvrement(recouvrement.id, payload);
        toast.success('Recouvrement modifié avec succès');
      } else {
        await clientService.createRecouvrement(payload);
        toast.success('Recouvrement créé avec succès');
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de l\'opération');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-5 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">{recouvrement ? 'Modifier' : 'Nouveau'} recouvrement</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><FiX size={22} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Client</label>
            <p className="text-gray-600 bg-gray-50 p-2 rounded-lg">{client.user?.first_name} {client.user?.last_name}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Type *</label>
            <select 
              value={formData.type_recouvrement} 
              onChange={(e) => setFormData({...formData, type_recouvrement: e.target.value})} 
              className="w-full px-3 py-2 border rounded-lg focus:ring-mutas-500 focus:border-mutas-500"
            >
              <option value="COTISATION">Cotisation</option>
              <option value="PRET">Prêt</option>
              <option value="AMENDE">Amende</option>
              <option value="AUTRE">Autre</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Montant (FCFA) *</label>
            <input 
              type="number" 
              value={formData.montant} 
              onChange={(e) => setFormData({...formData, montant: e.target.value})} 
              className="w-full px-3 py-2 border rounded-lg" 
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Date échéance *</label>
            <input 
              type="date" 
              value={formData.date_echeance} 
              onChange={(e) => setFormData({...formData, date_echeance: e.target.value})} 
              className="w-full px-3 py-2 border rounded-lg" 
              required 
            />
          </div>
          
          {/* Champs spécifiques pour PRET */}
          {formData.type_recouvrement === 'PRET' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Marge de bénéfice (%)</label>
                <input 
                  type="number" 
                  value={formData.marge_benefice} 
                  onChange={(e) => setFormData({...formData, marge_benefice: e.target.value})} 
                  className="w-full px-3 py-2 border rounded-lg" 
                  placeholder="Ex: 5 pour 5%"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nombre de mensualités *</label>
                <input 
                  type="number" 
                  value={formData.nombre_mensualites} 
                  onChange={(e) => setFormData({...formData, nombre_mensualites: e.target.value})} 
                  className="w-full px-3 py-2 border rounded-lg" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date début remboursement *</label>
                <input 
                  type="date" 
                  value={formData.date_debut_remboursement} 
                  onChange={(e) => setFormData({...formData, date_debut_remboursement: e.target.value})} 
                  className="w-full px-3 py-2 border rounded-lg" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Motif du prêt</label>
                <textarea 
                  rows="2" 
                  value={formData.motif_pret} 
                  onChange={(e) => setFormData({...formData, motif_pret: e.target.value})} 
                  className="w-full px-3 py-2 border rounded-lg" 
                  placeholder="Raison du prêt..."
                />
              </div>
            </>
          )}
          
          {/* Champs spécifiques pour COTISATION */}
          {formData.type_recouvrement === 'COTISATION' && (
            <div>
              <label className="block text-sm font-medium mb-1">Période de cotisation *</label>
              <input 
                type="text" 
                value={formData.periode_cotisation} 
                onChange={(e) => setFormData({...formData, periode_cotisation: e.target.value})} 
                className="w-full px-3 py-2 border rounded-lg" 
                placeholder="Ex: Janvier 2024" 
                required 
              />
            </div>
          )}
          
          {/* Champs spécifiques pour AUTRE */}
          {formData.type_recouvrement === 'AUTRE' && (
            <div>
              <label className="block text-sm font-medium mb-1">Libellé *</label>
              <input 
                type="text" 
                value={formData.libelle_autre} 
                onChange={(e) => setFormData({...formData, libelle_autre: e.target.value})} 
                className="w-full px-3 py-2 border rounded-lg" 
                placeholder="Ex: Frais de dossier" 
                required 
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-1">Référence</label>
            <input 
              type="text" 
              value={formData.reference} 
              onChange={(e) => setFormData({...formData, reference: e.target.value})} 
              className="w-full px-3 py-2 border rounded-lg" 
              placeholder="Laissé vide pour génération automatique" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea 
              rows="3" 
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})} 
              className="w-full px-3 py-2 border rounded-lg" 
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={submitting} className="flex-1 bg-mutas-500 text-white py-2 rounded-lg disabled:opacity-50">
              {submitting ? 'Enregistrement...' : (recouvrement ? 'Modifier' : 'Créer')}
            </button>
            <button type="button" onClick={onClose} className="flex-1 border py-2 rounded-lg">Annuler</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Modal Paiement
const PaiementModal = ({ isOpen, onClose, onSuccess, recouvrement }) => {
  const [submitting, setSubmitting] = useState(false);
  const [montant, setMontant] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [mensualiteNumero, setMensualiteNumero] = useState('');

  useEffect(() => {
    if (recouvrement) {
      setMontant(recouvrement.montant_restant?.toString() || recouvrement.montant?.toString() || '');
    }
  }, [recouvrement]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!montant || parseFloat(montant) <= 0) {
      toast.error('Veuillez renseigner un montant valide');
      return;
    }
    if (parseFloat(montant) > recouvrement.montant_restant) {
      toast.error('Le montant payé dépasse le montant restant');
      return;
    }
    setSubmitting(true);
    try {
      await clientService.payRecouvrement(recouvrement.id, {
        montant_paye: parseFloat(montant),
        commentaire: commentaire,
        mensualite_numero: mensualiteNumero || null
      });
      toast.success('Paiement enregistré avec succès');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.response?.data?.error || 'Erreur lors du paiement');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center p-5 border-b">
          <h2 className="text-xl font-bold">Enregistrer un paiement</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><FiX size={22} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Référence</label>
            <p className="text-gray-600 bg-gray-50 p-2 rounded-lg">{recouvrement?.reference}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Montant total</label>
            <p className="text-gray-600">{recouvrement?.montant?.toLocaleString()} FCFA</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Montant restant</label>
            <p className="text-red-600 font-semibold">{recouvrement?.montant_restant?.toLocaleString()} FCFA</p>
          </div>
          {recouvrement?.type_recouvrement === 'PRET' && (
            <div>
              <label className="block text-sm font-medium mb-1">Numéro de mensualité</label>
              <input 
                type="number" 
                value={mensualiteNumero} 
                onChange={(e) => setMensualiteNumero(e.target.value)} 
                className="w-full px-3 py-2 border rounded-lg" 
                placeholder="Ex: 1, 2, 3..."
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Montant à payer *</label>
            <input 
              type="number" 
              value={montant} 
              onChange={(e) => setMontant(e.target.value)} 
              className="w-full px-3 py-2 border rounded-lg" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Commentaire</label>
            <textarea 
              rows="3" 
              value={commentaire} 
              onChange={(e) => setCommentaire(e.target.value)} 
              className="w-full px-3 py-2 border rounded-lg" 
            />
          </div>
          <button type="submit" disabled={submitting} className="w-full bg-green-500 text-white py-2 rounded-lg disabled:opacity-50">
            {submitting ? 'Traitement...' : 'Enregistrer le paiement'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

// Modal Confirmation Suppression
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, recouvrement }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-5 border-b">
          <h2 className="text-xl font-bold text-red-600">Confirmer la suppression</h2>
        </div>
        <div className="p-5">
          <p>Êtes-vous sûr de vouloir supprimer ce recouvrement ?</p>
          <p className="text-sm text-gray-500 mt-2">Réf: {recouvrement?.reference}</p>
          <p className="text-sm text-gray-500">Montant: {recouvrement?.montant?.toLocaleString()} FCFA</p>
        </div>
        <div className="p-5 border-t flex gap-3">
          <button onClick={onConfirm} className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600">
            Supprimer
          </button>
          <button onClick={onClose} className="flex-1 border py-2 rounded-lg">Annuler</button>
        </div>
      </motion.div>
    </div>
  );
};

// Carte Recouvrement
const RecouvrementCard = ({ recouvrement, onEdit, onDelete, onPay }) => {
  const getStatusColor = (status) => {
    switch(status) {
      case 'PAYE': return 'bg-green-100 text-green-800';
      case 'PARTIEL': return 'bg-yellow-100 text-yellow-800';
      case 'EN_RETARD': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'PAYE': return 'Payé';
      case 'PARTIEL': return 'Partiel';
      case 'EN_RETARD': return 'En retard';
      default: return 'En attente';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'PAYE': return <FiCheckCircle className="text-green-500" />;
      case 'EN_RETARD': return <FiAlertCircle className="text-red-500" />;
      default: return <FiClock className="text-yellow-500" />;
    }
  };

  const isPayable = recouvrement.status !== 'PAYE';

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-mono text-sm">{recouvrement.reference || 'N/A'}</p>
          <p className="text-sm text-gray-500">{recouvrement.type_recouvrement}</p>
          {recouvrement.type_recouvrement === 'PRET' && recouvrement.nombre_mensualites && (
            <p className="text-xs text-gray-400">{recouvrement.nombre_mensualites} mensualités</p>
          )}
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(recouvrement.status)}`}>
          {getStatusIcon(recouvrement.status)} {getStatusLabel(recouvrement.status)}
        </span>
      </div>
      <div className="mt-2">
        <p className="text-lg font-bold text-mutas-500">{recouvrement.montant?.toLocaleString()} FCFA</p>
        {recouvrement.montant_mensuel && (
          <p className="text-xs text-gray-500">Mensualité: {recouvrement.montant_mensuel?.toLocaleString()} FCFA</p>
        )}
        {recouvrement.montant_restant > 0 && recouvrement.status !== 'PAYE' && (
          <p className="text-sm text-orange-600">Reste: {recouvrement.montant_restant?.toLocaleString()} FCFA</p>
        )}
        <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
          <span className="flex items-center gap-1"><FiCalendar size={12} /> Échéance: {new Date(recouvrement.date_echeance).toLocaleDateString()}</span>
          {recouvrement.date_paiement && (
            <span className="flex items-center gap-1"><FiCheckCircle size={12} className="text-green-500" /> Payé le: {new Date(recouvrement.date_paiement).toLocaleDateString()}</span>
          )}
        </div>
        {recouvrement.description && <p className="text-sm text-gray-400 mt-2">{recouvrement.description}</p>}
        {recouvrement.type_recouvrement === 'PRET' && recouvrement.motif_pret && (
          <p className="text-xs text-gray-400 mt-1">Motif: {recouvrement.motif_pret}</p>
        )}
      </div>
      <div className="flex gap-2 mt-3">
        {isPayable && (
          <button onClick={() => onPay(recouvrement)} className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm hover:bg-green-600 flex items-center justify-center gap-1">
            <FiDollarSign size={14} /> Payer
          </button>
        )}
        <button onClick={() => onEdit(recouvrement)} className="flex-1 bg-yellow-500 text-white py-2 rounded-lg text-sm hover:bg-yellow-600 flex items-center justify-center gap-1">
          <FiEdit2 size={14} /> Modifier
        </button>
        <button onClick={() => onDelete(recouvrement)} className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm hover:bg-red-600 flex items-center justify-center gap-1">
          <FiTrash2 size={14} /> Supprimer
        </button>
      </div>
    </div>
  );
};

export default function RecouvrementClient() {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [recouvrements, setRecouvrements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecouvrements, setLoadingRecouvrements] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRecouvrementModal, setShowRecouvrementModal] = useState(false);
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecouvrement, setSelectedRecouvrement] = useState(null);
  const [exporting, setExporting] = useState(false);

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

  const fetchRecouvrements = async (clientId) => {
    setLoadingRecouvrements(true);
    try {
      const response = await clientService.getClientRecouvrements(clientId);
      setRecouvrements(response.data || []);
    } catch (error) {
      console.error('Erreur chargement recouvrements:', error);
      setRecouvrements([]);
    } finally {
      setLoadingRecouvrements(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleClientSelect = async (client) => {
    setSelectedClient(client);
    await fetchRecouvrements(client.id);
  };

  const handleDeleteRecouvrement = async () => {
    if (!selectedRecouvrement) return;
    try {
      await clientService.deleteRecouvrement(selectedRecouvrement.id);
      toast.success('Recouvrement supprimé avec succès');
      setShowDeleteModal(false);
      setSelectedRecouvrement(null);
      if (selectedClient) {
        await fetchRecouvrements(selectedClient.id);
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const exportToPDF = async () => {
    if (!selectedClient) {
      toast.error('Veuillez sélectionner un client');
      return;
    }
    setExporting(true);
    try {
      const stats = await clientService.exportRecouvrementStats(selectedClient.id);
      const data = stats.data;
      
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.setTextColor(14, 165, 233);
      doc.text('Rapport de Recouvrement', 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Généré le: ${new Date().toLocaleString()}`, 14, 30);
      doc.text(`Utilisateur: ${user?.username || 'Utilisateur'}`, 14, 37);
      
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Informations du client', 14, 50);
      
      const clientInfo = [
        ['Nom complet', data.client.name],
        ['Code client', data.client.code],
        ['Email', data.client.email],
        ['Téléphone', data.client.phone],
        ['Profession', data.client.profession || '-'],
        ['Entreprise', data.client.entreprise || '-']
      ];
      
      doc.autoTable({
        startY: 55,
        head: [['Champ', 'Valeur']],
        body: clientInfo,
        theme: 'striped',
        headStyles: { fillColor: [14, 165, 233] }
      });
      
      let finalY = doc.lastAutoTable.finalY + 10;
      doc.text('Synthèse des recouvrements', 14, finalY);
      
      const statsData = [
        ['Total recouvrements', data.total_recouvrements.toString()],
        ['Montant total', `${data.total_montant.toLocaleString()} FCFA`],
        ['Montant payé', `${data.total_paye.toLocaleString()} FCFA`],
        ['Montant impayé', `${data.total_impaye.toLocaleString()} FCFA`],
        ['Taux de recouvrement', `${data.taux_recouvrement}%`]
      ];
      
      doc.autoTable({
        startY: finalY + 5,
        head: [['Indicateur', 'Valeur']],
        body: statsData,
        theme: 'striped',
        headStyles: { fillColor: [14, 165, 233] }
      });
      
      finalY = doc.lastAutoTable.finalY + 10;
      doc.text('Détail des recouvrements', 14, finalY);
      
      const recouvrementsData = data.recouvrements.map(r => [
        r.reference,
        r.type,
        `${r.montant.toLocaleString()} FCFA`,
        new Date(r.date_echeance).toLocaleDateString(),
        r.status === 'PAYE' ? 'Payé' : (r.status === 'PARTIEL' ? 'Partiel' : 'En attente')
      ]);
      
      doc.autoTable({
        startY: finalY + 5,
        head: [['Référence', 'Type', 'Montant', 'Échéance', 'Statut']],
        body: recouvrementsData,
        theme: 'striped',
        headStyles: { fillColor: [14, 165, 233] }
      });
      
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i}/${pageCount}`, doc.internal.pageSize.getWidth() - 20, doc.internal.pageSize.getHeight() - 10);
      }
      
      doc.save(`recouvrement_${data.client.code}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Export PDF réussi');
    } catch (error) {
      console.error('Erreur export PDF:', error);
      toast.error('Erreur lors de l\'export PDF');
    } finally {
      setExporting(false);
    }
  };

  const exportToCSV = async () => {
    if (!selectedClient) {
      toast.error('Veuillez sélectionner un client');
      return;
    }
    try {
      const stats = await clientService.exportRecouvrementStats(selectedClient.id);
      const data = stats.data;
      
      const headers = ['Référence', 'Type', 'Montant (FCFA)', 'Date échéance', 'Statut', 'Description'];
      const rows = data.recouvrements.map(r => [
        r.reference,
        r.type,
        r.montant,
        new Date(r.date_echeance).toLocaleDateString(),
        r.status === 'PAYE' ? 'Payé' : (r.status === 'PARTIEL' ? 'Partiel' : 'En attente'),
        r.description || ''
      ]);
      
      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `recouvrement_${data.client.code}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Export CSV réussi');
    } catch (error) {
      console.error('Erreur export CSV:', error);
      toast.error('Erreur lors de l\'export CSV');
    }
  };

  const exportToExcel = async () => {
    if (!selectedClient) {
      toast.error('Veuillez sélectionner un client');
      return;
    }
    try {
      const stats = await clientService.exportRecouvrementStats(selectedClient.id);
      const data = stats.data;
      
      const wsData = data.recouvrements.map(r => ({
        'Référence': r.reference,
        'Type': r.type,
        'Montant (FCFA)': r.montant,
        'Date échéance': new Date(r.date_echeance).toLocaleDateString(),
        'Statut': r.status === 'PAYE' ? 'Payé' : (r.status === 'PARTIEL' ? 'Partiel' : 'En attente'),
        'Description': r.description || ''
      }));
      
      const ws = XLSX.utils.json_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Recouvrements');
      XLSX.writeFile(wb, `recouvrement_${data.client.code}_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Export Excel réussi');
    } catch (error) {
      console.error('Erreur export Excel:', error);
      toast.error('Erreur lors de l\'export Excel');
    }
  };

  const filteredClients = (clients || []).filter(c =>
    c.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.code && c.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalDettes = recouvrements
    .filter(r => r.status !== 'PAYE')
    .reduce((sum, r) => sum + (r.montant_restant || r.montant), 0);
  const totalPaye = recouvrements
    .filter(r => r.status === 'PAYE')
    .reduce((sum, r) => sum + r.montant, 0);

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
            <FiDollarSign className="text-mutas-500" /> Recouvrement client
          </h1>
          <p className="text-gray-500 mt-1">Gestion des cotisations, prêts et recouvrements</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchClients} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
            <FiRefreshCw /> Actualiser
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des clients */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden lg:col-span-1">
          <div className="p-4 border-b">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Rechercher un client..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-mutas-500 focus:border-mutas-500" 
              />
            </div>
          </div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {filteredClients.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FiUser size={40} className="mx-auto mb-3 text-gray-300" />
                <p>Aucun client trouvé</p>
              </div>
            ) : (
              filteredClients.map(client => (
                <div 
                  key={client.id} 
                  onClick={() => handleClientSelect(client)} 
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition ${selectedClient?.id === client.id ? 'bg-mutas-50 border-l-4 border-mutas-500' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-mutas-100 rounded-full flex items-center justify-center">
                      <FiUser className="text-mutas-500" />
                    </div>
                    <div>
                      <p className="font-semibold">{client.user?.first_name} {client.user?.last_name}</p>
                      <p className="text-xs text-gray-500">{client.user?.email}</p>
                      <p className="text-xs text-gray-400">{client.user?.phone}</p>
                      <p className="text-xs text-mutas-500">{client.code}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Détails client et recouvrements */}
        <div className="lg:col-span-2 space-y-6">
          {selectedClient ? (
            <>
              {/* Infos client */}
              <div className="bg-gradient-to-r from-mutas-500 to-mutas-600 rounded-xl p-6 text-white">
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div>
                    <h2 className="text-xl font-bold">{selectedClient.user?.first_name} {selectedClient.user?.last_name}</h2>
                    <p className="opacity-90">Code: {selectedClient.code || selectedClient.id}</p>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm">
                      <span className="flex items-center gap-1"><FiMail size={14} /> {selectedClient.user?.email}</span>
                      <span className="flex items-center gap-1"><FiPhone size={14} /> {selectedClient.user?.phone || '-'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setSelectedRecouvrement(null); setShowRecouvrementModal(true); }} 
                      className="bg-white text-mutas-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-100"
                    >
                      <FiPlus /> Nouveau recouvrement
                    </button>
                    <button 
                      onClick={exportToPDF} 
                      disabled={exporting}
                      className="bg-white text-mutas-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-100 disabled:opacity-50"
                    >
                      <FiPrinter /> PDF
                    </button>
                    <button 
                      onClick={exportToCSV} 
                      className="bg-white text-mutas-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-100"
                    >
                      <FiFileText /> CSV
                    </button>
                    <button 
                      onClick={exportToExcel} 
                      className="bg-white text-mutas-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-100"
                    >
                      <FiDownload /> Excel
                    </button>
                  </div>
                </div>
              </div>

              {/* Cartes récapitulatives */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-blue-600">Total recouvrements</p>
                  <p className="text-2xl font-bold text-blue-700">{recouvrements.length}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="text-sm text-red-600">Total impayé</p>
                  <p className="text-2xl font-bold text-red-700">{totalDettes.toLocaleString()} FCFA</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-sm text-green-600">Total payé</p>
                  <p className="text-2xl font-bold text-green-700">{totalPaye.toLocaleString()} FCFA</p>
                </div>
              </div>

              {/* Liste des recouvrements */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-semibold mb-4">Historique des recouvrements</h3>
                {loadingRecouvrements ? (
                  <div className="flex justify-center py-8">
                    <FiLoader className="w-8 h-8 text-mutas-500 animate-spin" />
                  </div>
                ) : recouvrements.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FiDollarSign size={40} className="mx-auto mb-3 text-gray-300" />
                    <p>Aucun recouvrement pour ce client</p>
                    <button 
                      onClick={() => { setSelectedRecouvrement(null); setShowRecouvrementModal(true); }}
                      className="mt-4 text-mutas-500 hover:underline"
                    >
                      Créer un recouvrement
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recouvrements.map(recouvrement => (
                      <RecouvrementCard 
                        key={recouvrement.id} 
                        recouvrement={recouvrement}
                        onEdit={(r) => { setSelectedRecouvrement(r); setShowRecouvrementModal(true); }}
                        onDelete={(r) => { setSelectedRecouvrement(r); setShowDeleteModal(true); }}
                        onPay={(r) => { setSelectedRecouvrement(r); setShowPaiementModal(true); }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <FiUser size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Sélectionnez un client pour voir ses recouvrements</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <RecouvrementModal 
        isOpen={showRecouvrementModal} 
        onClose={() => { setShowRecouvrementModal(false); setSelectedRecouvrement(null); }} 
        onSuccess={() => selectedClient && fetchRecouvrements(selectedClient.id)}
        client={selectedClient}
        recouvrement={selectedRecouvrement}
      />
      
      <PaiementModal 
        isOpen={showPaiementModal} 
        onClose={() => { setShowPaiementModal(false); setSelectedRecouvrement(null); }} 
        onSuccess={() => selectedClient && fetchRecouvrements(selectedClient.id)}
        recouvrement={selectedRecouvrement}
      />
      
      <DeleteConfirmModal 
        isOpen={showDeleteModal} 
        onClose={() => { setShowDeleteModal(false); setSelectedRecouvrement(null); }} 
        onConfirm={handleDeleteRecouvrement}
        recouvrement={selectedRecouvrement}
      />
    </div>
  );
}