import React, { useState, useEffect } from 'react';
import { FiX, FiUserPlus, FiTrash2 } from 'react-icons/fi';
import { authApi } from '../../api/client';
import toast from 'react-hot-toast';

function SouscriptionModal({ isOpen, onClose, onSuccess, assurance, clientId }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    assurance_id: '',
    client_id: null,
    taux_prise_en_charge: 80,
    date_debut: '',
    date_fin: ''
  });
  const [familyMembers, setFamilyMembers] = useState([]);
  const [newMember, setNewMember] = useState({ nom: '', prenom: '', email: '', phone: '', relation: '', taux: 80 });
  const [clientsList, setClientsList] = useState([]);
  const [isFamily, setIsFamily] = useState(false);

  useEffect(() => {
    if (isOpen && assurance) {
      setIsFamily(assurance.couverture === 'FAMILLE');
      setFormData({
        assurance_id: assurance.id,
        client_id: clientId,
        taux_prise_en_charge: 80,
        date_debut: new Date().toISOString().split('T')[0],
        date_fin: ''
      });
      fetchClients();
    }
  }, [isOpen, assurance, clientId]);

  const fetchClients = async () => {
    try {
      const response = await authApi.get('/accounts/clients/');
      setClientsList(response.data);
    } catch (error) { console.error(error); }
  };

  const handleSubmit = async () => {
    if (!formData.date_fin) { toast.error('Date de fin requise'); return; }
    setSubmitting(true);
    try {
      const response = await authApi.post('/accounts/souscriptions/create/', formData);
      const souscriptionId = response.data.id;
      for (const member of familyMembers) {
        let memberClientId = member.id;
        if (member.isNew) {
          const userPayload = {
            user: { username: member.email.split('@')[0], email: member.email, first_name: member.prenom, last_name: member.nom, phone: member.phone || '', password: 'Temp123!' },
            genre: 'M'
          };
          const clientRes = await authApi.post('/accounts/clients/create/', userPayload);
          memberClientId = clientRes.data.id;
        }
        await authApi.post(`/accounts/souscriptions/${souscriptionId}/members/add/`, { client_id: memberClientId, relation: member.relation, taux_prise_en_charge: member.taux });
      }
      toast.success('Souscription créée');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) { toast.error('Erreur'); }
    finally { setSubmitting(false); }
  };

  const addMember = () => {
    if (!newMember.nom || !newMember.prenom || !newMember.email) { toast.error('Nom, prénom et email requis'); return; }
    setFamilyMembers([...familyMembers, { ...newMember, id: Date.now(), isNew: true }]);
    setNewMember({ nom: '', prenom: '', email: '', phone: '', relation: '', taux: 80 });
  };

  const removeMember = (index) => setFamilyMembers(familyMembers.filter((_, i) => i !== index));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="flex justify-between items-center p-5 border-b">
          <h2 className="text-xl font-bold">Souscrire à {assurance?.name}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><FiX size={22} /></button>
        </div>
        <div className="p-5">
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-2">Taux (%)</label><input type="number" value={formData.taux_prise_en_charge} onChange={(e) => setFormData({...formData, taux_prise_en_charge: e.target.value})} className="w-full px-4 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-2">Date début</label><input type="date" value={formData.date_debut} onChange={(e) => setFormData({...formData, date_debut: e.target.value})} className="w-full px-4 py-2 border rounded-lg" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium mb-2">Date fin *</label><input type="date" value={formData.date_fin} onChange={(e) => setFormData({...formData, date_fin: e.target.value})} className="w-full px-4 py-2 border rounded-lg" required /></div>
              </div>
              {isFamily ? <button onClick={() => setStep(2)} className="w-full bg-blue-500 text-white py-2 rounded-lg">Suivant</button> : <button onClick={handleSubmit} disabled={submitting} className="w-full bg-blue-500 text-white py-2 rounded-lg">Souscrire</button>}
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Membres de la famille</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {familyMembers.map((m, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div><p>{m.prenom} {m.nom}</p><p className="text-xs">{m.email} - {m.relation} ({m.taux}%)</p></div>
                    <button onClick={() => removeMember(idx)} className="text-red-500"><FiTrash2 /></button>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Ajouter un membre</p>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Nom" value={newMember.nom} onChange={(e) => setNewMember({...newMember, nom: e.target.value})} className="px-3 py-2 border rounded-lg" />
                  <input type="text" placeholder="Prénom" value={newMember.prenom} onChange={(e) => setNewMember({...newMember, prenom: e.target.value})} className="px-3 py-2 border rounded-lg" />
                  <input type="email" placeholder="Email" value={newMember.email} onChange={(e) => setNewMember({...newMember, email: e.target.value})} className="px-3 py-2 border rounded-lg" />
                  <input type="text" placeholder="Lien" value={newMember.relation} onChange={(e) => setNewMember({...newMember, relation: e.target.value})} className="px-3 py-2 border rounded-lg" />
                  <input type="number" placeholder="Taux %" value={newMember.taux} onChange={(e) => setNewMember({...newMember, taux: e.target.value})} className="px-3 py-2 border rounded-lg" />
                </div>
                <button onClick={addMember} className="w-full border py-2 rounded-lg mt-2 flex items-center justify-center gap-2"><FiUserPlus /> Ajouter</button>
              </div>
              <div className="flex gap-3 pt-4"><button onClick={handleSubmit} disabled={submitting} className="flex-1 bg-blue-500 text-white py-2 rounded-lg">Finaliser</button><button onClick={() => setStep(1)} className="flex-1 border py-2 rounded-lg">Retour</button></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SouscriptionModal;