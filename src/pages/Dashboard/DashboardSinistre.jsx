import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { FiFileText, FiCheckCircle, FiClock, FiAlertCircle, FiEye, FiCalendar } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

function DashboardSinistre() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    enCours: 0,
    indemnisés: 0,
    rejetes: 0,
  });
  const [sinistres, setSinistres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/sinistres/');
      const mesSinistres = response.data.filter(s => s.sinistre_client?.id === user?.id);
      setSinistres(mesSinistres);
      setStats({
        total: mesSinistres.length,
        enCours: mesSinistres.filter(s => s.status !== 'CLOSED' && s.status !== 'INDEMNISE').length,
        indemnisés: mesSinistres.filter(s => s.status === 'INDEMNISE').length,
        rejetes: mesSinistres.filter(s => s.status === 'REJECTED').length,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
    datasets: [
      {
        label: 'Mes sinistres',
        data: [2, 4, 3, 5, 7, 4],
        backgroundColor: '#0EA5E9',
        borderRadius: 8,
      },
    ],
  };

  const pieData = {
    labels: ['En cours', 'Indemnisés', 'Rejetés'],
    datasets: [
      {
        data: [stats.enCours, stats.indemnisés, stats.rejetes],
        backgroundColor: ['#F59E0B', '#10B981', '#EF4444'],
      },
    ],
  };

  const getStatusBadge = (status) => {
    const config = {
      DECLARE: { color: 'bg-yellow-100 text-yellow-800', label: 'Déclaré' },
      VALIDATION: { color: 'bg-blue-100 text-blue-800', label: 'En validation' },
      EXPERTISE: { color: 'bg-purple-100 text-purple-800', label: 'En expertise' },
      APPROVED: { color: 'bg-green-100 text-green-800', label: 'Approuvé' },
      INDEMNISE: { color: 'bg-emerald-100 text-emerald-800', label: 'Indemnisé' },
      REJECTED: { color: 'bg-red-100 text-red-800', label: 'Rejeté' },
      CLOSED: { color: 'bg-gray-100 text-gray-800', label: 'Clôturé' },
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

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
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
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border-l-4 border-yellow-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">En cours</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.enCours}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
              <FiClock className="text-yellow-600" size={20} />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border-l-4 border-green-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Indemnisés</p>
              <p className="text-2xl font-bold text-green-600">{stats.indemnisés}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <FiCheckCircle className="text-green-600" size={20} />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
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
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Évolution des sinistres</h3>
          <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: true }} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5"
        >
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Répartition des sinistres</h3>
          <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: true }} />
        </motion.div>
      </div>

      {/* Liste des sinistres */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
      >
        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-white">Mes sinistres en cours</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Référence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {sinistres.filter(s => s.status !== 'CLOSED').slice(0, 10).map(sinistre => {
                const badge = getStatusBadge(sinistre.status);
                return (
                  <tr key={sinistre.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-white">{sinistre.reference}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{sinistre.type_sinistre}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>{badge.label}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{new Date(sinistre.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{sinistre.estimated_amount?.toLocaleString() || '-'} FCFA</td>
                    <td className="px-6 py-4">
                      <Link to={`/sinistre/${sinistre.id}`} className="flex items-center gap-1 text-mutas-600 hover:text-mutas-700">
                        <FiEye size={16} /> Suivre
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {sinistres.filter(s => s.status !== 'CLOSED').length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Aucun sinistre en cours
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

export default DashboardSinistre;