import React, { useState, useEffect } from 'react';
import { FiX, FiUser, FiMail, FiPhone, FiCalendar, FiMapPin, FiBriefcase, FiHome, FiShield, FiUserPlus, FiHeart } from 'react-icons/fi';
import { authApi } from '../../api/client';
import toast from 'react-hot-toast';

function ClientModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('informations');
  const isEditing = !!initialData;
  const [assurances, setAssurances] = useState([]);
  const [selectedAssurance, setSelectedAssurance] = useState(null);
  const [showSouscriptionForm, setShowSouscriptionForm] = useState(false);
  const [souscriptionData, setSouscriptionData] = useState({
    taux_prise_en_charge: 80,
    date_debut: new Date().toISOString().split('T')[0],
    date_fin: '',
    familyMembers: []
  });
  const [newMember, setNewMember] = useState({ nom: '', prenom: '', email: '', phone: '', relation: '', taux: 80 });

  const [formData, setFormData] = useState({
    username: initialData?.user?.username || '',
    email: initialData?.user?.email || '',
    first_name: initialData?.user?.first_name || '',
    last_name: initialData?.user?.last_name || '',
    phone: initialData?.user?.phone || '',
    password: '',
    confirm_password: '',
    genre: initialData?.genre || 'M',
    date_naissance: initialData?.date_naissance || '',
    lieu_naissance: initialData?.lieu_naissance || '',
    profession: initialData?.profession || '',
    entreprise: initialData?.entreprise || ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchAssurances();
      if (isEditing && initialData) {
        setFormData({
          username: initialData.user?.username || '',
          email: initialData.user?.email || '',
          first_name: initialData.user?.first_name || '',
          last_name: initialData.user?.last_name || '',
          phone: initialData.user?.phone || '',
          password: '',
          confirm_password: '',
          genre: initialData.genre || 'M',
          date_naissance: initialData.date_naissance || '',
          lieu_naissance: initialData.lieu_naissance || '',
          profession: initialData.profession || '',
          entreprise: initialData.entreprise || ''
        });
      }
    }
  }, [isOpen, initialData]);

  const fetchAssurances = async () => {
    try {
      const response = await authApi.get('/accounts/assurances/');
      setAssurances(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateSouscription = async (clientId) => {
    if (!souscriptionData.date_fin) {
      toast.error('Veuillez renseigner la date de fin');
      return false;
    }
    try {
      const response = await authApi.post('/accounts/souscriptions/create/', {
        assurance_id: selectedAssurance.id,
        client_id: clientId,
        taux_prise_en_charge: souscriptionData.taux_prise_en_charge,
        date_debut: souscriptionData.date_debut,
        date_fin: souscriptionData.date_fin
      });
      const souscriptionId = response.data.id;
      for (const member of souscriptionData.familyMembers) {
        let memberClientId = member.id;
        if (member.isNew) {
          const userPayload = {
            user: {
              username: member.email.split('@')[0],
              email: member.email,
              first_name: member.prenom,
              last_name: member.nom,
              phone: member.phone || '',
              password: 'Temp123!'
            },
            genre: 'M'
          };
          const clientRes = await authApi.post('/accounts/clients/create/', userPayload);
          memberClientId = clientRes.data.id;
        }
        await authApi.post(`/accounts/souscriptions/${souscriptionId}/members/add/`, {
          client_id: memberClientId,
          relation: member.relation,
          taux_prise_en_charge: member.taux
        });
      }
      toast.success('Souscription effectuée');
      return true;
    } catch (error) {
      console.error('Erreur souscription:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la souscription');
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEditing && formData.password !== formData.confirm_password) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (!formData.username || !formData.email || (!isEditing && !formData.password)) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    setSubmitting(true);
    const payload = {
      user: {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name || '',
        last_name: formData.last_name || '',
        phone: formData.phone || '',
        password: formData.password
      },
      genre: formData.genre,
      date_naissance: formData.date_naissance || null,
      lieu_naissance: formData.lieu_naissance || '',
      profession: formData.profession || '',
      entreprise: formData.entreprise || ''
    };
    try {
      let clientId;
      if (isEditing) {
        await authApi.put(`/accounts/clients/${initialData.id}/update/`, payload);
        clientId = initialData.id;
        toast.success('Client modifié avec succès');
      } else {
        const response = await authApi.post('/accounts/clients/create/', payload);
        clientId = response.data.id;
        toast.success('Client créé avec succès');
      }
      if (selectedAssurance && showSouscriptionForm) {
        await handleCreateSouscription(clientId);
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'opération');
    } finally {
      setSubmitting(false);
    }
  };

  const addFamilyMember = () => {
    if (!newMember.nom || !newMember.prenom || !newMember.email) {
      toast.error('Nom, prénom et email requis');
      return;
    }
    setSouscriptionData({
      ...souscriptionData,
      familyMembers: [...souscriptionData.familyMembers, { ...newMember, id: Date.now(), isNew: true }]
    });
    setNewMember({ nom: '', prenom: '', email: '', phone: '', relation: '', taux: 80 });
  };

  const removeFamilyMember = (index) => {
    setSouscriptionData({
      ...souscriptionData,
      familyMembers: souscriptionData.familyMembers.filter((_, i) => i !== index)
    });
  };

  const resetSouscription = () => {
    setSelectedAssurance(null);
    setShowSouscriptionForm(false);
    setSouscriptionData({
      taux_prise_en_charge: 80,
      date_debut: new Date().toISOString().split('T')[0],
      date_fin: '',
      familyMembers: []
    });
    setNewMember({ nom: '', prenom: '', email: '', phone: '', relation: '', taux: 80 });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center"><FiUserPlus className="text-blue-500 text-xl" /></div>
            <div><h2 className="text-xl font-bold">{isEditing ? 'Modifier le client' : 'Nouveau client'}</h2></div>
          </div>
          <button onClick={() => { onClose(); resetSouscription(); }} className="p-2 rounded-lg hover:bg-gray-100"><FiX size={22} /></button>
        </div>

        <div className="flex border-b px-5">
          {[
            { key: 'informations', label: 'Identité', icon: <FiUser size={14} /> },
            { key: 'professionnel', label: 'Professionnel', icon: <FiBriefcase size={14} /> },
            { key: 'securite', label: 'Sécurité', icon: <FiShield size={14} /> },
            { key: 'souscription', label: 'Souscription', icon: <FiHeart size={14} /> }
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-3 font-medium text-sm flex items-center gap-2 ${activeTab === tab.key ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === 'informations' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Nom d'utilisateur *</label><input type="text" name="username" value={formData.username} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" disabled={isEditing} /></div>
              <div><label className="block text-sm font-medium mb-1">Email *</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Prénom</label><input type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Nom</label><input type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Téléphone</label><input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Genre</label><select name="genre" value={formData.genre} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg"><option value="M">Masculin</option><option value="F">Féminin</option></select></div>
              <div><label className="block text-sm font-medium mb-1">Date naissance</label><input type="date" name="date_naissance" value={formData.date_naissance} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Lieu naissance</label><input type="text" name="lieu_naissance" value={formData.lieu_naissance} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" /></div>
            </div>
          )}

          {activeTab === 'professionnel' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Profession</label><input type="text" name="profession" value={formData.profession} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Entreprise</label><input type="text" name="entreprise" value={formData.entreprise} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" /></div>
            </div>
          )}

          {activeTab === 'securite' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Mot de passe {!isEditing && '*'}</label><input type="password" name="password" value={formData.password} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" required={!isEditing} /></div>
                <div><label className="block text-sm font-medium mb-1">Confirmer {!isEditing && '*'}</label><input type="password" name="confirm_password" value={formData.confirm_password} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" required={!isEditing} /></div>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg"><p className="text-sm text-yellow-700">Ce mot de passe sera envoyé au client. Il pourra le modifier à sa première connexion.</p></div>
            </div>
          )}

          {activeTab === 'souscription' && (
            <div className="space-y-4">
              <h3 className="font-semibold">Souscrire à une assurance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {assurances.map(a => (
                  <div key={a.id} onClick={() => { setSelectedAssurance(a); setShowSouscriptionForm(true); }} className={`border rounded-xl p-3 cursor-pointer hover:border-blue-500 ${selectedAssurance?.id === a.id ? 'border-blue-500 bg-blue-50' : ''}`}>
                    <p className="font-semibold">{a.name}</p>
                    <p className="text-xs text-gray-500">{a.type_assurance} - {a.couverture}</p>
                  </div>
                ))}
              </div>

              {showSouscriptionForm && selectedAssurance && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium mb-3">Détails de la souscription - {selectedAssurance.name}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-sm">Taux (%)</label><input type="number" value={souscriptionData.taux_prise_en_charge} onChange={(e) => setSouscriptionData({...souscriptionData, taux_prise_en_charge: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                    <div><label className="text-sm">Date début</label><input type="date" value={souscriptionData.date_debut} onChange={(e) => setSouscriptionData({...souscriptionData, date_debut: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                    <div className="col-span-2"><label className="text-sm">Date fin *</label><input type="date" value={souscriptionData.date_fin} onChange={(e) => setSouscriptionData({...souscriptionData, date_fin: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required /></div>
                  </div>

                  {selectedAssurance.couverture === 'FAMILLE' && (
                    <div className="mt-4">
                      <p className="font-medium">Membres de la famille</p>
                      {souscriptionData.familyMembers.map((m, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded mt-1">
                          <div><p className="text-sm">{m.prenom} {m.nom}</p><p className="text-xs">{m.email} - {m.relation} ({m.taux}%)</p></div>
                          <button onClick={() => removeFamilyMember(idx)} className="text-red-500 text-sm">Retirer</button>
                        </div>
                      ))}
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <input type="text" placeholder="Nom" value={newMember.nom} onChange={(e) => setNewMember({...newMember, nom: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" />
                        <input type="text" placeholder="Prénom" value={newMember.prenom} onChange={(e) => setNewMember({...newMember, prenom: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" />
                        <input type="email" placeholder="Email" value={newMember.email} onChange={(e) => setNewMember({...newMember, email: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" />
                        <input type="text" placeholder="Lien de parenté" value={newMember.relation} onChange={(e) => setNewMember({...newMember, relation: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" />
                        <input type="number" placeholder="Taux %" value={newMember.taux} onChange={(e) => setNewMember({...newMember, taux: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" />
                        <button onClick={addFamilyMember} className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm">Ajouter</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-5 border-t flex gap-3 sticky bottom-0 bg-white">
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 bg-blue-500 text-white py-2 rounded-lg disabled:opacity-50">
            {submitting ? 'Enregistrement...' : (isEditing ? 'Modifier' : 'Créer')}
          </button>
          <button onClick={() => { onClose(); resetSouscription(); }} className="flex-1 border py-2 rounded-lg">Annuler</button>
        </div>
      </div>
    </div>
  );
}

export default ClientModal;