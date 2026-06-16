import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiFileText, FiUsers, FiPrinter, FiPlus, FiRefreshCw, FiChevronRight, FiHome } from 'react-icons/fi';
import { authApi } from '../../api/client';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import FamilyMemberModal from '../Modals/FamilyMemberModal';
import SouscriptionModal from '../Modals/SouscriptionModal';

function ClientPanel({ isOpen, onClose, client, onSuccess, assurances }) {
  const [souscriptions, setSouscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [showSouscriptionModal, setShowSouscriptionModal] = useState(false);
  const [selectedSouscription, setSelectedSouscription] = useState(null);
  const [showDeclarationModal, setShowDeclarationModal] = useState(false);

  useEffect(() => {
    if (client && isOpen) fetchSouscriptions();
  }, [client, isOpen]);

  const fetchSouscriptions = async () => {
    setLoading(true);
    try {
      const res = await authApi.get(`/accounts/souscriptions/client/${client.id}/`);
      setSouscriptions(res.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handlePrint = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Fiche client - ${client.user?.first_name} ${client.user?.last_name}`, 14, 20);
    doc.setFontSize(11);
    doc.text(`Code: ${client.code}`, 14, 35);
    doc.text(`Email: ${client.user?.email || '-'}`, 14, 45);
    doc.text(`Téléphone: ${client.user?.phone || '-'}`, 14, 55);
    doc.text(`Adresse: ${client.user?.address || '-'}`, 14, 65);
    doc.text(`Genre: ${client.genre === 'M' ? 'Masculin' : 'Féminin'}`, 14, 75);
    doc.text(`Profession: ${client.profession || '-'}`, 14, 85);
    doc.text(`Entreprise: ${client.entreprise || '-'}`, 14, 95);
    if (souscriptions.length > 0) {
      doc.autoTable({
        startY: 110,
        head: [['Assurance', 'Taux', 'Début', 'Fin', 'Statut']],
        body: souscriptions.map(s => [s.assurance_name, `${s.taux_prise_en_charge}%`, new Date(s.date_debut).toLocaleDateString(), new Date(s.date_fin).toLocaleDateString(), s.status])
      });
    }
    doc.save(`client_${client.code}.pdf`);
  };

  if (!isOpen || !client) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-5 border-b bg-gradient-to-r from-mutas-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-mutas-400 to-mutas-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {client.user?.first_name?.charAt(0)}{client.user?.last_name?.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold">{client.user?.first_name} {client.user?.last_name}</h2>
                <p className="text-sm text-gray-500 font-mono">{client.code}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-all"><FiX size={22} /></button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Actions rapides */}
            <div className="flex gap-3 flex-wrap">
              <button onClick={() => setShowDeclarationModal(true)} className="flex items-center gap-2 bg-mutas-500 text-white px-4 py-2.5 rounded-xl hover:bg-mutas-600 transition-all">
                <FiFileText size={18} /> Déclarer un sinistre
              </button>
              <button onClick={handlePrint} className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2.5 rounded-xl hover:bg-gray-700 transition-all">
                <FiPrinter size={18} /> Imprimer
              </button>
              <button onClick={() => setShowSouscriptionModal(true)} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-700 transition-all">
                <FiPlus size={18} /> Souscrire
              </button>
            </div>

            {/* Infos client */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><FiHome /> Informations personnelles</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Email:</span> {client.user?.email || '-'}</div>
                <div><span className="text-gray-500">Téléphone:</span> {client.user?.phone || '-'}</div>
                <div><span className="text-gray-500">Genre:</span> {client.genre === 'M' ? 'Masculin' : 'Féminin'}</div>
                <div><span className="text-gray-500">Date naissance:</span> {client.date_naissance ? new Date(client.date_naissance).toLocaleDateString() : '-'}</div>
                <div><span className="text-gray-500">Profession:</span> {client.profession || '-'}</div>
                <div><span className="text-gray-500">Entreprise:</span> {client.entreprise || '-'}</div>
              </div>
            </div>

            {/* Souscriptions */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Assurances souscrites</h3>
                <button onClick={fetchSouscriptions} className="text-gray-400 hover:text-mutas-500"><FiRefreshCw size={16} /></button>
              </div>
              {loading ? (
                <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-mutas-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : souscriptions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Aucune souscription</div>
              ) : (
                <div className="space-y-3">
                  {souscriptions.map(s => (
                    <div key={s.id} className="border rounded-xl p-4 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <p className="font-semibold text-mutas-600">{s.assurance_name}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Taux: <span className="font-medium">{s.taux_prise_en_charge}%</span>
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(s.date_debut).toLocaleDateString()} → {new Date(s.date_fin).toLocaleDateString()}
                          </p>
                          <p className="text-xs mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {s.status}
                            </span>
                          </p>
                        </div>
                        {s.assurance_couverture === 'FAMILLE' && (
                          <button
                            onClick={() => { setSelectedSouscription(s); setShowFamilyModal(true); }}
                            className="flex items-center gap-1 text-mutas-500 hover:text-mutas-700 text-sm border border-mutas-200 px-3 py-1.5 rounded-lg hover:bg-mutas-50 transition-all"
                          >
                            <FiUsers size={14} /> Gérer famille
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      <FamilyMemberModal isOpen={showFamilyModal} onClose={() => { setShowFamilyModal(false); fetchSouscriptions(); onSuccess(); }} souscriptionId={selectedSouscription?.id} onSuccess={fetchSouscriptions} />
      <SouscriptionModal isOpen={showSouscriptionModal} onClose={() => setShowSouscriptionModal(false)} onSuccess={() => { fetchSouscriptions(); onSuccess(); }} clientId={client.id} assurances={assurances} />
    </>
  );
}

export default ClientPanel;