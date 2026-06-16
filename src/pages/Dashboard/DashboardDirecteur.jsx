import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { FiFileText, FiCheckCircle, FiClock, FiAlertCircle, FiTrendingUp, FiUsers, FiDollarSign } from 'react-icons/fi';
import api from '../../api/client';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

function DashboardDirecteur() {
  const [stats, setStats] = useState({
    total: 0,
    enCours: 0,
    indemnisés: 0,
    rejetes: 0,
    montantTotal: 0,
    montantIndemnise: 0,
    tauxIndemnisation: 0,
  });
  const [sinistresParType, setSinistresParType] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/sinistres/');
      const data = response.data;
      
      const total = data.length;
      const enCours = data.filter(s => s.status !== 'CLOSED' && s.status !== 'INDEMNISE').length;
      const indemnisés = data.filter(s => s.status === 'INDEMNISE').length;
      const rejetes = data.filter(s => s.status === 'REJECTED').length;
      
      const montantTotal = data.reduce((sum, s) => sum + (s.estimated_amount || 0), 0);
      const montantIndemnise = data.reduce((sum, s) => sum + (s.approved_amount || 0), 0);
      const tauxIndemnisation = montantTotal > 0 ? (montantIndemnise / montantTotal) * 100 : 0;
      
      const parType = {};
      data.forEach(s => {
        parType[s.type_sinistre] = (parType[s.type_sinistre] || 0) + 1;
      });
      
      setStats({
        total, enCours, indemnisés, rejetes,
        montantTotal, montantIndemnise, tauxIndemnisation: tauxIndemnisation.toFixed(2),
      });
      setSinistresParType(parType);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const evolutionData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    datasets: [
      {
        label: 'Sinistres déclarés',
        data: [12, 15, 18, 22, 25, 28, 30, 27, 24, 20, 18, 15],
        borderColor: '#0EA5E9',
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Sinistres indemnisés',
        data: [8, 10, 12, 14, 16, 18, 20, 22, 20, 18, 16, 14],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const typeData = {
    labels: Object.keys(sinistresParType),
    datasets: [
      {
        data: Object.values(sinistresParType),
        backgroundColor: ['#0EA5E9', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6'],
      },
    ],
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
              <p className="text-gray-500 dark:text-gray-400 text-sm">En cours</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.enCours}</p>
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
              <p className="text-gray-500 dark:text-gray-400 text-sm">Indemnisés</p>
              <p className="text-2xl font-bold text-green-600">{stats.indemnisés}</p>
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
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border-l-4 border-purple-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Taux d'indemnisation</p>
              <p className="text-2xl font-bold text-green-600">{stats.tauxIndemnisation}%</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <FiTrendingUp className="text-purple-600" size={20} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Montant total estimé</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.montantTotal.toLocaleString()} FCFA</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <FiDollarSign className="text-blue-600" size={20} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Montant total indemnisé</p>
              <p className="text-2xl font-bold text-green-600">{stats.montantIndemnise.toLocaleString()} FCFA</p>
            </div>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <FiCheckCircle className="text-green-600" size={20} />
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
          <Line data={evolutionData} options={{ responsive: true, maintainAspectRatio: true }} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5"
        >
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Répartition par type</h3>
          <Pie data={typeData} options={{ responsive: true, maintainAspectRatio: true }} />
        </motion.div>
      </div>

      {/* Performance indicators */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Temps moyen de traitement</h3>
          <p className="text-3xl font-bold text-mutas-600">12.5 jours</p>
          <p className="text-sm text-gray-500 mt-2">Objectif : 10 jours</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Satisfaction client</h3>
          <p className="text-3xl font-bold text-green-600">89%</p>
          <p className="text-sm text-gray-500 mt-2">Objectif : 85%</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Taux de litiges</h3>
          <p className="text-3xl font-bold text-yellow-600">5.2%</p>
          <p className="text-sm text-gray-500 mt-2">Objectif : &lt;5%</p>
        </div>
      </motion.div>
    </div>
  );
}

export default DashboardDirecteur;