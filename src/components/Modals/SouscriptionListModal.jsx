import React, { useState, useEffect } from 'react';
import { FiX, FiHeart } from 'react-icons/fi';
import { authApi } from '../../api/client';
import toast from 'react-hot-toast';
import SouscriptionModal from './SouscriptionModal';

function SouscriptionListModal({ isOpen, onClose, onSuccess, clientId }) {
  const [assurances, setAssurances] = useState([]);
  const [selectedAssurance, setSelectedAssurance] = useState(null);
  const [showSouscriptionForm, setShowSouscriptionForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) { fetchAssurances(); }
  }, [isOpen]);

  const fetchAssurances = async () => {
    setLoading(true);
    try {
      const response = await authApi.get('/accounts/assurances/');
      setAssurances(response.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
          <div className="flex justify-between items-center p-5 border-b">
            <h2 className="text-xl font-bold">Souscrire à une assurance</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><FiX size={22} /></button>
          </div>
          <div className="p-5">
            {loading ? <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {assurances.map(a => (
                  <div key={a.id} onClick={() => { setSelectedAssurance(a); setShowSouscriptionForm(true); }} className="border rounded-xl p-4 cursor-pointer hover:border-blue-500 hover:shadow-lg transition">
                    <div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"><FiHeart className="text-blue-500" /></div><div><p className="font-semibold">{a.name}</p><p className="text-xs text-gray-500">{a.type_assurance} - {a.couverture}</p></div></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <SouscriptionModal isOpen={showSouscriptionForm} onClose={() => { setShowSouscriptionForm(false); setSelectedAssurance(null); onSuccess?.(); }} onSuccess={onSuccess} assurance={selectedAssurance} clientId={clientId} />
    </>
  );
}

export default SouscriptionListModal;