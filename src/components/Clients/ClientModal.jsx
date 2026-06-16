// src/components/Clients/ClientModal.jsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiUser, FiMail, FiPhone, FiCalendar, FiMapPin, FiBriefcase, FiHome, FiToggleLeft, FiToggleRight, FiLoader } from 'react-icons/fi';
import { clientService } from '../../services/sinistreService';
import toast from 'react-hot-toast';

const ClientModal = ({ isOpen, onClose, onSuccess, client }) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
    confirm_password: '',
    genre: 'M',
    date_naissance: '',
    lieu_naissance: '',
    profession: '',
    entreprise: ''
  });

  useEffect(() => {
    if (client) {
      setFormData({
        username: client.user?.username || '',
        email: client.user?.email || '',
        first_name: client.user?.first_name || '',
        last_name: client.user?.last_name || '',
        phone: client.user?.phone || '',
        password: '',
        confirm_password: '',
        genre: client.genre || 'M',
        date_naissance: client.date_naissance || '',
        lieu_naissance: client.lieu_naissance || '',
        profession: client.profession || '',
        entreprise: client.entreprise || ''
      });
    } else {
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        password: '',
        confirm_password: '',
        genre: 'M',
        date_naissance: '',
        lieu_naissance: '',
        profession: '',
        entreprise: ''
      });
    }
  }, [client, isOpen]);

  const handleToggleStatus = async () => {
    if (!client) return;
    try {
      await clientService.toggleClientStatus(client.id);
      toast.success(`Compte ${client.user?.is_active ? 'désactivé' : 'activé'} avec succès`);
      onSuccess?.();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du changement de statut');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!client && formData.password !== formData.confirm_password) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (!formData.username || !formData.email) {
      toast.error('Nom d\'utilisateur et email requis');
      return;
    }
    
    setSubmitting(true);
    try {
      const payload = {
        user: {
          username: formData.username,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          password: formData.password || 'Temp123!'
        },
        genre: formData.genre,
        date_naissance: formData.date_naissance || null,
        lieu_naissance: formData.lieu_naissance,
        profession: formData.profession,
        entreprise: formData.entreprise
      };
      
      if (client) {
        await clientService.updateClient(client.id, payload);
        toast.success('Client modifié avec succès');
      } else {
        await clientService.createClient(payload);
        toast.success('Client créé avec succès');
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
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white p-5 border-b flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-mutas-100 rounded-xl flex items-center justify-center">
              <FiUser className="text-mutas-500 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{client ? 'Modifier' : 'Nouveau'} client</h2>
              <p className="text-sm text-gray-500">Sinistré</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {client && (
              <button 
                onClick={handleToggleStatus}
                className={`p-2 rounded-lg flex items-center gap-2 ${client.user?.is_active ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}
                title={client.user?.is_active ? 'Désactiver le compte' : 'Activer le compte'}
              >
                {client.user?.is_active ? <FiToggleRight size={20} /> : <FiToggleLeft size={20} />}
                {client.user?.is_active ? 'Actif' : 'Inactif'}
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
              <FiX size={22} />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nom d'utilisateur *</label>
              <input 
                type="text" 
                value={formData.username} 
                onChange={(e) => setFormData({...formData, username: e.target.value})} 
                className="w-full px-3 py-2 border rounded-lg focus:ring-mutas-500 focus:border-mutas-500" 
                required 
                disabled={!!client} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input 
                type="email" 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                className="w-full px-3 py-2 border rounded-lg focus:ring-mutas-500 focus:border-mutas-500" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Prénom</label>
              <input 
                type="text" 
                value={formData.first_name} 
                onChange={(e) => setFormData({...formData, first_name: e.target.value})} 
                className="w-full px-3 py-2 border rounded-lg" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nom</label>
              <input 
                type="text" 
                value={formData.last_name} 
                onChange={(e) => setFormData({...formData, last_name: e.target.value})} 
                className="w-full px-3 py-2 border rounded-lg" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Téléphone</label>
              <input 
                type="tel" 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                className="w-full px-3 py-2 border rounded-lg" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Genre</label>
              <select 
                value={formData.genre} 
                onChange={(e) => setFormData({...formData, genre: e.target.value})} 
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date naissance</label>
              <input 
                type="date" 
                value={formData.date_naissance} 
                onChange={(e) => setFormData({...formData, date_naissance: e.target.value})} 
                className="w-full px-3 py-2 border rounded-lg" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Lieu naissance</label>
              <input 
                type="text" 
                value={formData.lieu_naissance} 
                onChange={(e) => setFormData({...formData, lieu_naissance: e.target.value})} 
                className="w-full px-3 py-2 border rounded-lg" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Profession</label>
              <input 
                type="text" 
                value={formData.profession} 
                onChange={(e) => setFormData({...formData, profession: e.target.value})} 
                className="w-full px-3 py-2 border rounded-lg" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Entreprise</label>
              <input 
                type="text" 
                value={formData.entreprise} 
                onChange={(e) => setFormData({...formData, entreprise: e.target.value})} 
                className="w-full px-3 py-2 border rounded-lg" 
              />
            </div>
            
            {!client && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Mot de passe *</label>
                  <input 
                    type="password" 
                    value={formData.password} 
                    onChange={(e) => setFormData({...formData, password: e.target.value})} 
                    className="w-full px-3 py-2 border rounded-lg" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Confirmer *</label>
                  <input 
                    type="password" 
                    value={formData.confirm_password} 
                    onChange={(e) => setFormData({...formData, confirm_password: e.target.value})} 
                    className="w-full px-3 py-2 border rounded-lg" 
                    required 
                  />
                </div>
              </>
            )}
          </div>
          
          <div className="flex gap-3 mt-6 pt-4 border-t">
            <button 
              type="submit" 
              disabled={submitting} 
              className="flex-1 bg-mutas-500 text-white py-2 rounded-lg hover:bg-mutas-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <FiLoader className="animate-spin" /> : <FiUser />}
              {submitting ? 'Enregistrement...' : (client ? 'Modifier' : 'Créer')}
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 border py-2 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ClientModal;