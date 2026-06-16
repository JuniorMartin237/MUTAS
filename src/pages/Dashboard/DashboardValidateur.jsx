import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { FiFileText, FiCheckCircle, FiClock, FiAlertCircle, FiEye, FiUserCheck, FiUsers } from 'react-icons/fi';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { playNotificationSound, playSuccessSound } from '../../utils/sound';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

function DashboardValidateur() {
  const [stats, setStats] = useState({
    total: 0,
    enAttente: 0,
    valides: 0,
    rejetes: 0,
  });
  const [sinistres, setSinistres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSinistre, setSelectedSinistre] = useState(null);
  const [commentaire, setCommentaire] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/sinistres/');
      const enAttente = response.data.filter(s => s.status === 'VALIDATION');
      setSinistres(enAttente);
      setStats({
        total: response.data.length,
        enAttente: enAttente.length,
        valides: response.data.filter(s => s.status === 'APPROVED' || s.status === 'INDEMNISE').length,
        rejetes: response.data.filter(s => s.status === 'REJECTED').length,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidation = async (sinistreId, action) => {
    try {
      const newStatus = action === 'approve' ? 'EXPERTISE' : 'REJECTED';
      await api.put(`/sinistres/${sinistreId}/status/`, {
        status: newStatus,
        comment: commentaire,
      });
      playSuccessSound();
      toast.success(action === 'approve' ? 'Sinistre envoyé en expertise' : 'Sinistre rejeté');
      setSelectedSinistre(null);
      setCommentaire('');
      fetchData();
    } catch (error) {
      toast.error('Erreur lors de la validation');
    }
  };

  const chartData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
    datasets: [
      {
        label: 'Validations effectuées',
        data: [8, 12, 10, 15, 18, 14],
        backgroundColor: '#0EA5E9',
        borderRadius: 8,
      },
    ],
  };

  const pieData = {
    labels: ['En attente', 'Validés', 'Rejetés'],
    datasets: [
      {
        data: [stats.enAttente, stats.valides, stats.rejetes],
        backgroundColor: ['#F59E0B', '#10B981', '#EF4444'],
      },
    ],
  };

  const getStatusBadge = (status) => {
    const config = {
      DECLARE: { color: 'bg-gray-100 text-gray-800', label: 'Déclaré' },
      VALIDATION: { color: 'bg-yellow-100 text-yellow-800', label: 'En validation' },
      EXPERTISE: { color: 'bg-purple-100 text-purple-800', label: 'En expertise' },
      APPROVED: { color: 'bg-green-100 text-green-800', label: 'Approuvé' },
      INDEMNISE: { color: 'bg-emerald-100 text-emerald-800', label: 'Indemnisé' },
      REJECTED: { color: 'bg-red-100 text-red-800', label: 'Rejeté' },
    };
    return config[status] || { color: 'bg-gray-100 text-gray-800', label: status };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-mutas-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border-l-4 border-mutas-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Total sinistres</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-mutas-100 dark:bg-mutas-900/30 rounded-full flex items-center justify-center">
              <FiFileText className="text-mutas-500" size={20} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border-l-4 border-yellow-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">En attente</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.enAttente}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
              <FiClock className="text-yellow-600" size={20} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border-l-4 border-green-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Validés</p>
              <p className="text-2xl font-bold text-green-600">{stats.valides}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <FiCheckCircle className="text-green-600" size={20} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border-l-4 border-red-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Rejetés</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejetes}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <FiAlertCircle className="text-red-600" size={20} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5"
        >
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Performances validations</h3>
          <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: true }} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5"
        >
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">État des sinistres</h3>
          <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: true }} />
        </motion.div>
      </div>

      {/* Liste des sinistres à valider */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
      >
        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-white">Sinistres en attente de validation</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Référence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Déclarant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {sinistres.map(sinistre => {
                const badge = getStatusBadge(sinistre.status);
                return (
                  <tr key={sinistre.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-white">{sinistre.reference}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{sinistre.declarant?.username}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{sinistre.type_sinistre}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{new Date(sinistre.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{sinistre.estimated_amount?.toLocaleString() || '-'} FCFA</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedSinistre(sinistre)}
                        className="flex items-center gap-1 text-mutas-600 hover:text-mutas-700"
                      >
                        <FiUserCheck size={16} /> Valider
                      </button>
                    </td>
                  </tr>
                );
              })}
              {sinistres.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Aucune demande de validation en attente
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modal de validation */}
      {selectedSinistre && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-5 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Validation du sinistre</h3>
              <p className="text-sm text-gray-500 mt-1">Réf: {selectedSinistre.reference}</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Commentaire (optionnel)</label>
                <textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-mutas-500 focus:border-mutas-500"
                  rows="3"
                  placeholder="Ajoutez une remarque..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleValidation(selectedSinistre.id, 'approve')}
                  className="flex-1 bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 transition-colors"
                >
                  Approuver
                </button>
                <button
                  onClick={() => handleValidation(selectedSinistre.id, 'reject')}
                  className="flex-1 bg-red-600 text-white py-2 rounded-xl hover:bg-red-700 transition-colors"
                >
                  Rejeter
                </button>
              </div>
              <button
                onClick={() => setSelectedSinistre(null)}
                className="w-full text-gray-500 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Annuler
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default DashboardValidateur;