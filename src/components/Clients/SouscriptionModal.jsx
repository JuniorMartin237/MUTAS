// src/components/Clients/SouscriptionModal.jsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiShield, FiHeart, FiUserPlus, FiTrash2, FiLoader, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { clientService } from '../../services/sinistreService';
import toast from 'react-hot-toast';

const SouscriptionModal = ({ isOpen, onClose, onSuccess, client }) => {
  const [assurances, setAssurances] = useState([]);
  const [selectedAssurance, setSelectedAssurance] = useState(null);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [formData, setFormData] = useState({
    taux_prise_en_charge: 80,
    date_debut: new Date().toISOString().split('T')[0],
    date_fin: '',
    conditions: {}
  });
  const [familyMembers, setFamilyMembers] = useState([]);
  const [newMember, setNewMember] = useState({ 
    nom: '', 
    prenom: '', 
    email: '', 
    phone: '', 
    relation: '', 
    taux: 80 
  });
  const [conditions, setConditions] = useState({
    notification_email: true,
    renewal_auto: false,
    franchise_amount: 0,
    waiting_period_days: 0,
    special_conditions: ''
  });

  useEffect(() => {
    if (isOpen && client) {
      fetchAssurances();
      // Réinitialiser le formulaire
      setStep(1);
      setSelectedAssurance(null);
      setFormData({
        taux_prise_en_charge: 80,
        date_debut: new Date().toISOString().split('T')[0],
        date_fin: '',
        conditions: {}
      });
      setFamilyMembers([]);
      setConditions({
        notification_email: true,
        renewal_auto: false,
        franchise_amount: 0,
        waiting_period_days: 0,
        special_conditions: ''
      });
    }
  }, [isOpen, client]);

  const fetchAssurances = async () => {
    setLoading(true);
    try {
      const response = await clientService.getAssurances();
      console.log('Assurances reçues:', response.data);
      if (response.data && Array.isArray(response.data)) {
        setAssurances(response.data);
      } else {
        setAssurances([]);
      }
    } catch (error) {
      console.error('Erreur chargement assurances:', error);
      toast.error('Erreur lors du chargement des assurances');
      setAssurances([]);
    } finally {
      setLoading(false);
    }
  };

  const checkDuplicateSouscription = async () => {
    if (!selectedAssurance || !client) return false;
    
    setCheckingDuplicate(true);
    try {
      const response = await clientService.checkExistingSouscription(client.id, selectedAssurance.id);
      if (response.data.has_souscription) {
        toast.error(`Ce client a déjà une souscription active pour l'assurance "${selectedAssurance.name}"`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur vérification:', error);
      return false;
    } finally {
      setCheckingDuplicate(false);
    }
  };

  const handleSelectAssurance = async (assurance) => {
    setSelectedAssurance(assurance);
    
    // Vérifier si le client a déjà souscrit à cette assurance
    const hasDuplicate = await checkDuplicateSouscription();
    if (hasDuplicate) {
      setSelectedAssurance(null);
      return;
    }
    
    setStep(2);
  };

  const handleSubmit = async () => {
    // Validation des champs requis
    if (!formData.date_fin) {
      toast.error('La date de fin est requise');
      return;
    }
    
    if (!selectedAssurance) {
      toast.error('Veuillez sélectionner une assurance');
      return;
    }
    
    if (!client || !client.id) {
      toast.error('Client invalide');
      return;
    }
    
    // Vérifier une dernière fois les doublons
    const hasDuplicate = await checkDuplicateSouscription();
    if (hasDuplicate) return;
    
    setSubmitting(true);
    
    try {
      // Préparer les conditions
      const conditionsData = {
        notification_email: conditions.notification_email,
        renewal_auto: conditions.renewal_auto,
        franchise_amount: parseFloat(conditions.franchise_amount) || 0,
        waiting_period_days: parseInt(conditions.waiting_period_days) || 0,
        special_conditions: conditions.special_conditions || ''
      };
      
      // Format des données selon ce que le backend attend
      const souscriptionData = {
        assurance: selectedAssurance.id,
        client: client.id,
        taux_prise_en_charge: parseFloat(formData.taux_prise_en_charge),
        date_debut: formData.date_debut,
        date_fin: formData.date_fin,
        conditions: conditionsData,
        status: 'ACTIVE'
      };
      
      console.log('Envoi des données de souscription:', souscriptionData);
      
      const response = await clientService.createSouscription(souscriptionData);
      console.log('Réponse création souscription:', response.data);
      
      const souscriptionId = response.data.id;
      
      // Ajouter les membres de la famille si nécessaire (pour les assurances FAMILLE)
      if (selectedAssurance.couverture === 'FAMILLE' && familyMembers.length > 0) {
        for (const member of familyMembers) {
          try {
            let memberClientId = member.id;
            
            // Si c'est un nouveau membre, créer d'abord le client
            if (member.isNew) {
              const userPayload = {
                user: {
                  username: member.email.split('@')[0] + Date.now(),
                  email: member.email,
                  first_name: member.prenom,
                  last_name: member.nom,
                  phone: member.phone || '',
                  password: 'Temp123!'
                },
                genre: 'M'
              };
              const clientRes = await clientService.createClient(userPayload);
              memberClientId = clientRes.data.id;
            }
            
            // Ajouter le membre à la souscription
            await clientService.addFamilyMember(souscriptionId, {
              client_id: memberClientId,
              relation: member.relation,
              taux_prise_en_charge: parseFloat(member.taux)
            });
          } catch (memberError) {
            console.error('Erreur ajout membre:', memberError);
            toast.warning(`Le membre ${member.prenom} ${member.nom} n'a pas pu être ajouté`);
          }
        }
      }
      
      toast.success('Souscription effectuée avec succès');
      
      // Attendre un peu avant de fermer
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);
      
    } catch (error) {
      console.error('Erreur détaillée souscription:', error);
      console.error('Response error:', error.response?.data);
      
      let errorMessage = 'Erreur lors de la souscription';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          const errors = Object.entries(errorData)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
          errorMessage = errors;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const addMember = () => {
    if (!newMember.nom || !newMember.prenom || !newMember.email) {
      toast.error('Nom, prénom et email requis');
      return;
    }
    if (familyMembers.length >= 3) {
      toast.error('Nombre maximum de membres atteint (3)');
      return;
    }
    setFamilyMembers([...familyMembers, { ...newMember, id: Date.now(), isNew: true }]);
    setNewMember({ nom: '', prenom: '', email: '', phone: '', relation: '', taux: 80 });
  };

  const removeMember = (index) => {
    setFamilyMembers(familyMembers.filter((_, i) => i !== index));
  };

  const getDateMin = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getDateMax = () => {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 5);
    return maxDate.toISOString().split('T')[0];
  };

  if (!isOpen || !client) return null;

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
              <FiHeart className="text-mutas-500 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Souscrire une assurance</h2>
              <p className="text-sm text-gray-500">
                Client: {client.user?.first_name} {client.user?.last_name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <FiX size={22} />
          </button>
        </div>
        
        <div className="p-6">
          {step === 1 && (
            <div>
              <h3 className="font-semibold mb-4">Choisir une assurance</h3>
              {loading ? (
                <div className="flex justify-center py-8">
                  <FiLoader className="w-8 h-8 text-mutas-500 animate-spin" />
                </div>
              ) : assurances.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FiShield size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>Aucune assurance disponible</p>
                  <p className="text-xs mt-2">Veuillez contacter un administrateur</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                  {assurances.map(a => (
                    <div 
                      key={a.id} 
                      onClick={() => handleSelectAssurance(a)} 
                      className={`border rounded-xl p-4 cursor-pointer transition hover:border-mutas-500 hover:shadow-lg ${
                        selectedAssurance?.id === a.id ? 'border-mutas-500 bg-mutas-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <FiShield className="text-blue-500 text-xl" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{a.name}</p>
                          <p className="text-sm text-gray-500">{a.type_assurance} - {a.couverture === 'FAMILLE' ? 'Familiale' : 'Individuelle'}</p>
                          {a.description && <p className="text-xs text-gray-400 mt-1">{a.description}</p>}
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            a.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {a.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {step === 2 && selectedAssurance && (
            <div className="space-y-4">
              <div className="bg-mutas-50 rounded-xl p-4 flex items-center gap-3">
                <FiCheck className="text-mutas-500" />
                <div>
                  <p className="font-semibold">{selectedAssurance.name}</p>
                  <p className="text-sm text-gray-600">
                    {selectedAssurance.type_assurance} - {selectedAssurance.couverture === 'FAMILLE' ? 'Couverture familiale' : 'Couverture individuelle'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Taux de prise en charge (%)</label>
                  <input 
                    type="number" 
                    value={formData.taux_prise_en_charge} 
                    onChange={(e) => setFormData({...formData, taux_prise_en_charge: e.target.value})} 
                    className="w-full px-3 py-2 border rounded-lg focus:ring-mutas-500 focus:border-mutas-500" 
                    min="0" 
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date de début</label>
                  <input 
                    type="date" 
                    value={formData.date_debut} 
                    onChange={(e) => setFormData({...formData, date_debut: e.target.value})} 
                    min={getDateMin()}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-mutas-500 focus:border-mutas-500" 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Date de fin *</label>
                  <input 
                    type="date" 
                    value={formData.date_fin} 
                    onChange={(e) => setFormData({...formData, date_fin: e.target.value})} 
                    min={getDateMin()}
                    max={getDateMax()}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-mutas-500 focus:border-mutas-500" 
                    required 
                  />
                </div>
              </div>
              
              {/* Conditions d'assurance */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <FiAlertCircle size={16} /> Conditions particulières
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="notification_email"
                      checked={conditions.notification_email}
                      onChange={(e) => setConditions({...conditions, notification_email: e.target.checked})}
                      className="w-4 h-4 rounded border-gray-300 text-mutas-500 focus:ring-mutas-500"
                    />
                    <label htmlFor="notification_email" className="text-sm">Notifications par email</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="renewal_auto"
                      checked={conditions.renewal_auto}
                      onChange={(e) => setConditions({...conditions, renewal_auto: e.target.checked})}
                      className="w-4 h-4 rounded border-gray-300 text-mutas-500 focus:ring-mutas-500"
                    />
                    <label htmlFor="renewal_auto" className="text-sm">Renouvellement automatique</label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Franchise (FCFA)</label>
                    <input 
                      type="number" 
                      value={conditions.franchise_amount}
                      onChange={(e) => setConditions({...conditions, franchise_amount: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Période de carence (jours)</label>
                    <input 
                      type="number" 
                      value={conditions.waiting_period_days}
                      onChange={(e) => setConditions({...conditions, waiting_period_days: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      min="0"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Conditions spéciales</label>
                    <textarea 
                      rows="2"
                      value={conditions.special_conditions}
                      onChange={(e) => setConditions({...conditions, special_conditions: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Conditions particulières à cette souscription..."
                    />
                  </div>
                </div>
              </div>
              
              {selectedAssurance.couverture === 'FAMILLE' && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Membres de la famille (max 3)</h4>
                  
                  {familyMembers.length > 0 && (
                    <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                      {familyMembers.map((m, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{m.prenom} {m.nom}</p>
                            <p className="text-xs text-gray-500">{m.email} - {m.relation}</p>
                            <p className="text-xs text-green-600">Taux: {m.taux}%</p>
                          </div>
                          <button 
                            onClick={() => removeMember(idx)} 
                            className="text-red-500 p-2 hover:bg-red-50 rounded-lg"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {familyMembers.length < 3 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-medium mb-3">Ajouter un membre</p>
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          type="text" 
                          placeholder="Nom" 
                          value={newMember.nom} 
                          onChange={(e) => setNewMember({...newMember, nom: e.target.value})} 
                          className="px-3 py-2 border rounded-lg text-sm focus:ring-mutas-500 focus:border-mutas-500" 
                        />
                        <input 
                          type="text" 
                          placeholder="Prénom" 
                          value={newMember.prenom} 
                          onChange={(e) => setNewMember({...newMember, prenom: e.target.value})} 
                          className="px-3 py-2 border rounded-lg text-sm focus:ring-mutas-500 focus:border-mutas-500" 
                        />
                        <input 
                          type="email" 
                          placeholder="Email" 
                          value={newMember.email} 
                          onChange={(e) => setNewMember({...newMember, email: e.target.value})} 
                          className="px-3 py-2 border rounded-lg text-sm focus:ring-mutas-500 focus:border-mutas-500" 
                        />
                        <input 
                          type="text" 
                          placeholder="Téléphone" 
                          value={newMember.phone} 
                          onChange={(e) => setNewMember({...newMember, phone: e.target.value})} 
                          className="px-3 py-2 border rounded-lg text-sm" 
                        />
                        <input 
                          type="text" 
                          placeholder="Lien de parenté" 
                          value={newMember.relation} 
                          onChange={(e) => setNewMember({...newMember, relation: e.target.value})} 
                          className="px-3 py-2 border rounded-lg text-sm" 
                        />
                        <input 
                          type="number" 
                          placeholder="Taux %" 
                          value={newMember.taux} 
                          onChange={(e) => setNewMember({...newMember, taux: e.target.value})} 
                          className="px-3 py-2 border rounded-lg text-sm" 
                        />
                      </div>
                      <button 
                        onClick={addMember} 
                        className="w-full mt-3 bg-mutas-500 text-white py-2 rounded-lg text-sm hover:bg-mutas-600 flex items-center justify-center gap-2"
                      >
                        <FiUserPlus /> Ajouter un membre
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex gap-3 pt-4 border-t">
                <button 
                  onClick={handleSubmit} 
                  disabled={submitting || checkingDuplicate}
                  className="flex-1 bg-mutas-500 text-white py-2 rounded-lg hover:bg-mutas-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting || checkingDuplicate ? <FiLoader className="animate-spin" /> : <FiHeart />}
                  {submitting ? 'Souscription...' : checkingDuplicate ? 'Vérification...' : 'Souscrire'}
                </button>
                <button 
                  onClick={() => setStep(1)} 
                  className="flex-1 border py-2 rounded-lg hover:bg-gray-50"
                >
                  Retour
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SouscriptionModal;