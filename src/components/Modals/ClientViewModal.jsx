import React from 'react';
import { motion } from 'framer-motion';
import { FiX, FiUser, FiMail, FiPhone, FiCalendar, FiMapPin, FiBriefcase, FiHome, FiPrinter } from 'react-icons/fi';
import { generateClientPDF } from '../../utils/pdfGenerator';

function ClientViewModal({ isOpen, onClose, client }) {
  if (!isOpen || !client) return null;

  const handlePrint = () => {
    generateClientPDF(client);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="flex justify-between items-center p-5 border-b">
          <div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center"><FiUser className="text-blue-500 text-xl" /></div><div><h2 className="text-xl font-bold">Détails du client</h2><p className="text-sm text-gray-500">Code: {client.code}</p></div></div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><FiX size={22} /></button>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-4 pb-4 border-b"><div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">{client.user?.first_name?.charAt(0) || 'C'}</div><div><p className="text-lg font-semibold">{client.user?.first_name} {client.user?.last_name}</p><p className="text-gray-500">@{client.user?.username}</p></div></div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div><label className="text-sm text-gray-500">Email</label><p className="flex items-center gap-2"><FiMail size={14} /> {client.user?.email}</p></div>
            <div><label className="text-sm text-gray-500">Téléphone</label><p className="flex items-center gap-2"><FiPhone size={14} /> {client.user?.phone || '-'}</p></div>
            <div><label className="text-sm text-gray-500">Genre</label><p>{client.genre === 'M' ? 'Masculin' : 'Féminin'}</p></div>
            <div><label className="text-sm text-gray-500">Date naissance</label><p className="flex items-center gap-2"><FiCalendar size={14} /> {client.date_naissance ? new Date(client.date_naissance).toLocaleDateString() : '-'}</p></div>
            <div><label className="text-sm text-gray-500">Lieu naissance</label><p className="flex items-center gap-2"><FiMapPin size={14} /> {client.lieu_naissance || '-'}</p></div>
            <div><label className="text-sm text-gray-500">Profession</label><p className="flex items-center gap-2"><FiBriefcase size={14} /> {client.profession || '-'}</p></div>
            <div className="col-span-2"><label className="text-sm text-gray-500">Entreprise</label><p className="flex items-center gap-2"><FiHome size={14} /> {client.entreprise || '-'}</p></div>
          </div>
        </div>
        <div className="p-5 border-t flex gap-3"><button onClick={handlePrint} className="flex-1 bg-blue-500 text-white py-2 rounded-lg flex items-center justify-center gap-2"><FiPrinter /> Imprimer</button><button onClick={onClose} className="flex-1 border py-2 rounded-lg">Fermer</button></div>
      </motion.div>
    </div>
  );
}

export default ClientViewModal;