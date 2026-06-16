import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FiBarChart2, FiTrendingUp, FiDollarSign, FiCheckCircle, 
  FiXCircle, FiAward, FiCalendar, FiDownload, FiRefreshCw,
  FiLoader
} from 'react-icons/fi';
import { useCapitalisation } from '../../hooks/sinistres/useCapitalisation';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    className={`bg-gradient-to-br ${color} rounded-xl p-5 text-white shadow-lg`}
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm opacity-90">{title}</p>
        <p className="text-2xl font-bold mt-1">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        {subtitle && <p className="text-xs opacity-80 mt-1">{subtitle}</p>}
      </div>
      <Icon size={32} className="opacity-80" />
    </div>
  </motion.div>
);

export default function Capitalisation() {
  const { user } = useAuth();
  const { stats, loading, fetchStats } = useCapitalisation();
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [exporting, setExporting] = useState(false);

  const filteredMonthlyStats = stats.monthly_stats?.filter(
    s => s.month && new Date(s.month).getFullYear() === yearFilter
  ) || [];

  const exportToPDF = async () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.setTextColor(14, 165, 233);
      doc.text('Rapport de Capitalisation - Sinistres', 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Généré le: ${new Date().toLocaleString()}`, 14, 30);
      doc.text(`Utilisateur: ${user?.username || 'Utilisateur'}`, 14, 37);
      doc.text(`Année: ${yearFilter}`, 14, 44);
      
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Synthèse globale', 14, 55);
      
      const statsData = [
        ['Total déclarations', stats.total_sinistres.toString()],
        ['Approuvées', stats.total_approved.toString()],
        ['Indemnisées', stats.total_indemnized.toString()],
        ['Rejetées', stats.total_rejected.toString()],
        ['Montant total', `${(stats.total_amount || 0).toLocaleString()} FCFA`],
        ['Taux de succès', `${stats.success_rate || 0}%`]
      ];
      
      doc.autoTable({
        startY: 60,
        head: [['Indicateur', 'Valeur']],
        body: statsData,
        theme: 'striped',
        headStyles: { fillColor: [14, 165, 233] }
      });
      
      let finalY = doc.lastAutoTable.finalY + 10;
      doc.text('Évolution mensuelle', 14, finalY);
      
      const monthlyData = filteredMonthlyStats.map(s => [
        s.month ? new Date(s.month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : 'N/A',
        s.count?.toString() || '0',
        `${(s.amount || 0).toLocaleString()} FCFA`
      ]);
      
      if (monthlyData.length > 0) {
        doc.autoTable({
          startY: finalY + 5,
          head: [['Mois', 'Nombre sinistres', 'Montant']],
          body: monthlyData,
          theme: 'striped',
          headStyles: { fillColor: [14, 165, 233] }
        });
      } else {
        doc.text('Aucune donnée pour l\'année sélectionnée', 14, finalY + 15);
      }
      
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i}/${pageCount}`, doc.internal.pageSize.getWidth() - 20, doc.internal.pageSize.getHeight() - 10);
      }
      
      doc.save(`capitalisation_sinistres_${yearFilter}.pdf`);
      toast.success('Export PDF réussi');
    } catch (error) {
      console.error('Erreur export PDF:', error);
      toast.error('Erreur lors de l\'export PDF');
    } finally {
      setExporting(false);
    }
  };

  const exportToExcel = () => {
    try {
      const wsData = filteredMonthlyStats.map(s => ({
        Mois: s.month ? new Date(s.month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : 'N/A',
        'Nombre sinistres': s.count || 0,
        'Montant (FCFA)': s.amount || 0
      }));
      
      wsData.push({
        Mois: 'TOTAL',
        'Nombre sinistres': stats.total_sinistres,
        'Montant (FCFA)': stats.total_amount || 0
      });
      
      const ws = XLSX.utils.json_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Capitalisation');
      XLSX.writeFile(wb, `capitalisation_sinistres_${yearFilter}.xlsx`);
      toast.success('Export Excel réussi');
    } catch (error) {
      console.error('Erreur export Excel:', error);
      toast.error('Erreur lors de l\'export Excel');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <FiLoader className="w-12 h-12 text-mutas-500 animate-spin" />
        <p className="mt-4 text-gray-500">Chargement des statistiques...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FiBarChart2 className="text-mutas-500" /> Capitalisation des sinistres
          </h1>
          <p className="text-gray-500 mt-1">Analyse et suivi des performances</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchStats} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
            <FiRefreshCw /> Actualiser
          </button>
          <button onClick={exportToPDF} disabled={exporting} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50">
            <FiDownload /> PDF
          </button>
          <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
            <FiDownload /> Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="flex items-center gap-4">
          <FiCalendar className="text-gray-400" />
          <select 
            value={yearFilter} 
            onChange={(e) => setYearFilter(parseInt(e.target.value))}
            className="px-4 py-2 border rounded-lg focus:ring-mutas-500 focus:border-mutas-500"
          >
            <option value={2023}>2023</option>
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total déclarations" value={stats.total_sinistres || 0} icon={FiBarChart2} color="from-blue-500 to-blue-600" />
        <StatCard title="Sinistres approuvés" value={stats.total_approved || 0} icon={FiCheckCircle} color="from-green-500 to-green-600" />
        <StatCard title="Sinistres indemnisés" value={stats.total_indemnized || 0} icon={FiAward} color="from-emerald-500 to-emerald-600" />
        <StatCard title="Sinistres rejetés" value={stats.total_rejected || 0} icon={FiXCircle} color="from-red-500 to-red-600" />
        <StatCard title="Montant total indemnisé" value={`${(stats.total_amount || 0).toLocaleString()} FCFA`} icon={FiDollarSign} color="from-yellow-500 to-yellow-600" />
        <StatCard title="Taux de succès" value={`${stats.success_rate || 0}%`} icon={FiTrendingUp} color="from-purple-500 to-purple-600" subtitle={`${stats.total_approved || 0} / ${stats.total_sinistres || 0} sinistres`} />
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Évolution mensuelle</h2>
        {filteredMonthlyStats.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Aucune donnée pour l'année {yearFilter}</div>
        ) : (
          <div className="space-y-4">
            {filteredMonthlyStats.map((stat, idx) => {
              const maxCount = Math.max(...filteredMonthlyStats.map(s => s.count || 0), 1);
              const maxAmount = Math.max(...filteredMonthlyStats.map(s => s.amount || 0), 1);
              const barWidthCount = ((stat.count || 0) / maxCount) * 100;
              const barWidthAmount = ((stat.amount || 0) / maxAmount) * 100;
              
              return (
                <div key={idx} className="border-b pb-3">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">
                      {stat.month ? new Date(stat.month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : 'N/A'}
                    </span>
                    <span className="text-sm text-gray-500">{stat.count || 0} sinistre(s)</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full mb-2">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${barWidthCount}%` }} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Montant</span>
                    <span className="text-xs text-green-600">{(stat.amount || 0).toLocaleString()} FCFA</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${barWidthAmount}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}