import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { authApi } from '../../api/client';
import toast from 'react-hot-toast';

function FamilyMemberModal({ isOpen, onClose, onSuccess, souscriptionId, clients }) {
  const [formData, setFormData] = useState({ client_id: '', relation: '', taux_prise_en_charge: 80 });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authApi.post(`/accounts/souscriptions/${souscriptionId}/members/add/`, formData);
      toast.success('Membre ajouté');
      onSuccess?.();
      onClose();
    } catch (error) { toast.error('Erreur'); }
    finally { setSubmitting(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center p-5 border-b"><h2 className="text-xl font-bold">Ajouter un membre</h2><button onClick={onClose}><FiX size={22} /></button></div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <select value={formData.client_id} onChange={(e) => setFormData({...formData, client_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required><option value="">Choisir un client</option>{clients.map(c => <option key={c.id} value={c.id}>{c.user?.first_name} {c.user?.last_name}</option>)}</select>
          <input type="text" placeholder="Lien de parenté" value={formData.relation} onChange={(e) => setFormData({...formData, relation: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
          <input type="number" placeholder="Taux prise en charge (%)" value={formData.taux_prise_en_charge} onChange={(e) => setFormData({...formData, taux_prise_en_charge: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
          <button type="submit" disabled={submitting} className="w-full bg-blue-500 text-white py-2 rounded-lg">{submitting ? 'Ajout...' : 'Ajouter'}</button>
        </form>
      </motion.div>
    </div>
  );
}

export default FamilyMemberModal;