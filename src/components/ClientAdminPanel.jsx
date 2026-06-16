import React, { useState, useEffect } from 'react';
import { FiX, FiFileText, FiShield, FiChevronRight, FiTrash2, FiUserPlus, FiPrinter } from 'react-icons/fi';
import { authApi } from '../api/client';
import toast from 'react-hot-toast';
import { generateClientPDF } from '../utils/pdfGenerator';
import DeclarationModal from './Modals/DeclarationModal';
import SouscriptionListModal from './Modals/SouscriptionListModal';

function ClientAdminPanel({ isOpen, onClose, client, onRefresh }) {
  const [activeTab, setActiveTab] = useState('info');
  const [souscriptions, setSouscriptions] = useState([]);
  const [sinistres, setSinistres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssuranceDetail, setShowAssuranceDetail] = useState(false);
  const [selectedSouscription, setSelectedSouscription] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showDeclarationModal, setShowDeclarationModal] = useState(false);
  const [showSouscriptionListModal, setShowSouscriptionListModal] = useState(false);
  const [newMember, setNewMember] = useState({ nom: '', prenom: '', email: '', phone: '', relation: '', taux_prise_en_charge: 80 });
  const [clientsList, setClientsList] = useState([]);

  useEffect(() => { if (isOpen && client) { fetchData(); fetchClientsList(); } }, [isOpen, client]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [souscriptionsRes, sinistresRes] = await Promise.all([
        authApi.get(`/accounts/clients/${client.id}/souscriptions/`),
        authApi.get(`/sinistres/?client=${client.id}`)
      ]);
      setSouscriptions(souscriptionsRes.data || []);
      setSinistres(sinistresRes.data || []);
    } catch (error) { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  const fetchClientsList = async () => {
    try { const response = await authApi.get('/accounts/clients/'); setClientsList(response.data); } catch (error) { console.error(error); }
  };

  const fetchFamilyMembers = async (souscriptionId) => {
    try { const response = await authApi.get(`/accounts/souscriptions/${souscriptionId}/members/`); setFamilyMembers(response.data); } catch (error) { setFamilyMembers([]); }
  };

  const addFamilyMember = async (souscriptionId) => {
    if (!newMember.nom || !newMember.prenom || !newMember.email) { toast.error('Nom, prénom et email requis'); return; }
    try {
      let clientId = newMember.id;
      if (!clientId) {
        const userPayload = { user: { username: newMember.email.split('@')[0], email: newMember.email, first_name: newMember.prenom, last_name: newMember.nom, phone: newMember.phone, password: 'Temp123!' }, genre: 'M' };
        const clientRes = await authApi.post('/accounts/clients/create/', userPayload);
        clientId = clientRes.data.id;
      }
      await authApi.post(`/accounts/souscriptions/${souscriptionId}/members/add/`, { client_id: clientId, relation: newMember.relation, taux_prise_en_charge: newMember.taux_prise_en_charge });
      toast.success('Membre ajouté');
      setShowAddMemberModal(false);
      setNewMember({ nom: '', prenom: '', email: '', phone: '', relation: '', taux_prise_en_charge: 80 });
      fetchFamilyMembers(souscriptionId);
      fetchData();
    } catch (error) { toast.error('Erreur lors de l\'ajout'); }
  };

  const removeFamilyMember = async (souscriptionId, memberId) => {
    if (window.confirm('Retirer ce membre ?')) {
      try { await authApi.delete(`/accounts/souscriptions/${souscriptionId}/members/${memberId}/remove/`); toast.success('Membre retiré'); fetchFamilyMembers(souscriptionId); fetchData(); } catch (error) { toast.error('Erreur'); }
    }
  };

  const openAssuranceDetail = async (souscription) => {
    setSelectedSouscription(souscription);
    if (souscription.assurance?.couverture === 'FAMILLE') await fetchFamilyMembers(souscription.id);
    setShowAssuranceDetail(true);
  };

  const handlePrintPDF = () => generateClientPDF(client, souscriptions, sinistres);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex justify-between items-center p-5 border-b">
            <div><h2 className="text-xl font-bold">{client.user?.first_name} {client.user?.last_name}</h2><p className="text-sm text-gray-500">Code: {client.code}</p></div>
            <div className="flex gap-2">
              <button onClick={handlePrintPDF} className="flex items-center gap-2 bg-green-500 text-white px-3 py-1 rounded-lg text-sm"><FiPrinter /> PDF</button>
              <button onClick={() => setShowDeclarationModal(true)} className="flex items-center gap-2 bg-orange-500 text-white px-3 py-1 rounded-lg text-sm"><FiFileText /> Déclarer</button>
              <button onClick={() => setShowSouscriptionListModal(true)} className="flex items-center gap-2 bg-blue-500 text-white px-3 py-1 rounded-lg text-sm"><FiShield /> Souscrire</button>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><FiX size={22} /></button>
            </div>
          </div>
          <div className="flex border-b px-5">{['info', 'assurances', 'sinistres'].map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-3 font-medium text-sm ${activeTab === tab ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}>{tab === 'info' ? 'Informations' : tab === 'assurances' ? 'Mes assurances' : 'Historique sinistres'}</button>))}</div>
          <div className="flex-1 overflow-y-auto p-5">
            {loading ? <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div> : (
              <>
                {activeTab === 'info' && (<div className="grid grid-cols-2 gap-4"><div><label className="text-sm text-gray-500">Email</label><p>{client.user?.email || '-'}</p></div><div><label className="text-sm text-gray-500">Téléphone</label><p>{client.user?.phone || '-'}</p></div><div><label className="text-sm text-gray-500">Genre</label><p>{client.genre === 'M' ? 'Masculin' : 'Féminin'}</p></div><div><label className="text-sm text-gray-500">Date naissance</label><p>{client.date_naissance ? new Date(client.date_naissance).toLocaleDateString() : '-'}</p></div><div><label className="text-sm text-gray-500">Profession</label><p>{client.profession || '-'}</p></div><div><label className="text-sm text-gray-500">Entreprise</label><p>{client.entreprise || '-'}</p></div><div className="col-span-2"><label className="text-sm text-gray-500">Historique sinistres</label><div className="mt-2 space-y-2 max-h-40 overflow-y-auto">{sinistres.map(s => (<div key={s.id} className="p-2 bg-gray-50 rounded-lg flex justify-between"><span className="font-mono text-sm">{s.reference}</span><span className="text-xs">{s.status}</span></div>))}</div></div></div>)}
                {activeTab === 'assurances' && (<div className="space-y-3">{souscriptions.map(s => (<div key={s.id} onClick={() => openAssuranceDetail(s)} className="flex justify-between items-center p-4 border rounded-xl cursor-pointer hover:bg-gray-50"><div><p className="font-semibold">{s.assurance_name}</p><p className="text-sm text-gray-500">Taux: {s.taux_prise_en_charge}% | Début: {new Date(s.date_debut).toLocaleDateString()}</p></div><FiChevronRight className="text-gray-400" /></div>))}{souscriptions.length === 0 && <p className="text-center text-gray-500 py-8">Aucune souscription</p>}</div>)}
                {activeTab === 'sinistres' && (<div className="space-y-2">{sinistres.map(s => (<div key={s.id} className="p-3 border rounded-lg"><p className="font-mono">{s.reference}</p><p className="text-sm">{s.type_sinistre} - {s.status}</p></div>))}</div>)}
              </>
            )}
          </div>
        </div>
      </div>

      {showAssuranceDetail && selectedSouscription && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"><div className="flex justify-between p-5 border-b"><h3 className="font-bold">{selectedSouscription.assurance_name}</h3><button onClick={() => setShowAssuranceDetail(false)}><FiX /></button></div><div className="p-5 space-y-3"><p><strong>Taux prise en charge:</strong> {selectedSouscription.taux_prise_en_charge}%</p><p><strong>Période:</strong> {new Date(selectedSouscription.date_debut).toLocaleDateString()} - {new Date(selectedSouscription.date_fin).toLocaleDateString()}</p>{selectedSouscription.assurance?.couverture === 'FAMILLE' && (<div><div className="flex justify-between items-center mb-2"><p className="font-medium">Membres de la famille</p><button onClick={() => setShowAddMemberModal(true)} className="flex items-center gap-1 text-sm text-blue-500"><FiUserPlus /> Ajouter</button></div><div className="space-y-2">{familyMembers.map(m => (<div key={m.id} className="flex justify-between items-center p-2 bg-gray-50 rounded"><div><p className="font-medium">{m.client_name}</p><p className="text-xs text-gray-500">{m.relation} - {m.taux_prise_en_charge}%</p></div><button onClick={() => removeFamilyMember(selectedSouscription.id, m.id)} className="text-red-500"><FiTrash2 /></button></div>))}</div></div>)}</div><div className="p-5 border-t"><button onClick={() => setShowAssuranceDetail(false)} className="w-full bg-blue-500 text-white py-2 rounded-lg">Fermer</button></div></div></div>)}

      {showAddMemberModal && selectedSouscription && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-md"><div className="flex justify-between p-5 border-b"><h3 className="font-bold">Ajouter un membre</h3><button onClick={() => setShowAddMemberModal(false)}><FiX /></button></div><div className="p-5 space-y-3"><div className="grid grid-cols-2 gap-2"><input type="text" placeholder="Nom" value={newMember.nom} onChange={(e) => setNewMember({...newMember, nom: e.target.value})} className="px-3 py-2 border rounded-lg" /><input type="text" placeholder="Prénom" value={newMember.prenom} onChange={(e) => setNewMember({...newMember, prenom: e.target.value})} className="px-3 py-2 border rounded-lg" /><input type="email" placeholder="Email" value={newMember.email} onChange={(e) => setNewMember({...newMember, email: e.target.value})} className="px-3 py-2 border rounded-lg" /><input type="tel" placeholder="Téléphone" value={newMember.phone} onChange={(e) => setNewMember({...newMember, phone: e.target.value})} className="px-3 py-2 border rounded-lg" /><input type="text" placeholder="Lien de parenté" value={newMember.relation} onChange={(e) => setNewMember({...newMember, relation: e.target.value})} className="px-3 py-2 border rounded-lg col-span-2" /><input type="number" placeholder="Taux %" value={newMember.taux_prise_en_charge} onChange={(e) => setNewMember({...newMember, taux_prise_en_charge: e.target.value})} className="px-3 py-2 border rounded-lg" /></div><select onChange={(e) => { const c = clientsList.find(c => c.id === parseInt(e.target.value)); if (c) setNewMember({ nom: c.user?.last_name || '', prenom: c.user?.first_name || '', email: c.user?.email || '', phone: c.user?.phone || '', relation: '', taux_prise_en_charge: 80, id: c.id }); }} className="w-full px-3 py-2 border rounded-lg"><option value="">Ou sélectionner un client</option>{clientsList.map(c => <option key={c.id} value={c.id}>{c.user?.first_name} {c.user?.last_name}</option>)}</select></div><div className="p-5 border-t flex gap-3"><button onClick={() => addFamilyMember(selectedSouscription.id)} className="flex-1 bg-blue-500 text-white py-2 rounded-lg">Ajouter</button><button onClick={() => setShowAddMemberModal(false)} className="flex-1 border py-2 rounded-lg">Annuler</button></div></div></div>)}

      <DeclarationModal isOpen={showDeclarationModal} onClose={() => setShowDeclarationModal(false)} onSuccess={() => { fetchData(); onRefresh?.(); }} client={client} />
      <SouscriptionListModal isOpen={showSouscriptionListModal} onClose={() => setShowSouscriptionListModal(false)} onSuccess={() => { fetchData(); onRefresh?.(); }} clientId={client?.id} />
    </>
  );
}

export default ClientAdminPanel;