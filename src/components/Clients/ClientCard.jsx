import React from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiAward, FiCalendar, FiShield } from 'react-icons/fi';

function ClientCard({ client, onClick }) {
  const mainSouscription = client.souscriptions?.find(s => s.status === 'ACTIVE');
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-4 cursor-pointer border border-gray-100"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 bg-gradient-to-br from-mutas-400 to-mutas-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
          {client.user?.first_name?.charAt(0)}{client.user?.last_name?.charAt(0)}
        </div>
        <div>
          <h3 className="font-semibold">{client.user?.first_name} {client.user?.last_name}</h3>
          <p className="text-xs text-gray-500 font-mono">Code: {client.code}</p>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <FiShield className="text-mutas-500" size={14} />
          <span className="truncate">{mainSouscription?.assurance_name || 'Aucune assurance'}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <FiAward className="text-green-500" size={14} />
          <span>Taux: {mainSouscription?.taux_prise_en_charge || 0}%</span>
        </div>
        {mainSouscription?.date_debut && (
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <FiCalendar size={12} />
            <span>Depuis {new Date(mainSouscription.date_debut).toLocaleDateString()}</span>
          </div>
        )}
      </div>
      <div className="mt-3 pt-2 border-t text-xs text-center text-gray-400">
        Cliquez pour gérer
      </div>
    </motion.div>
  );
}

export default ClientCard;