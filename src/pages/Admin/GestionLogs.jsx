import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiDownload, FiFilter, FiCalendar, FiUser, FiActivity, FiClock, FiRefreshCw, FiEye, FiInfo } from 'react-icons/fi';
import api from '../../api/client';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function GestionLogs() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [actionFilter, setActionFilter] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [stats, setStats] = useState({ total: 0, today: 0, thisWeek: 0, uniqueUsers: 0 });

  useEffect(() => {
    fetchLogs();
    fetchUsers();
    fetchStats();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await api.get('/logs/activities/');
      setLogs(response.data);
    } catch (error) {
      toast.error('Erreur chargement logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/accounts/all-users/');
      setUsers(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/logs/stats/');
      setStats(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const filteredLogs = logs.filter(log => {
    let match = true;
    if (searchTerm && !log.action?.toLowerCase().includes(searchTerm.toLowerCase()) && !log.user_name?.toLowerCase().includes(searchTerm.toLowerCase())) match = false;
    if (selectedUser && log.user !== parseInt(selectedUser)) match = false;
    if (actionFilter && log.action !== actionFilter) match = false;
    if (dateDebut && new Date(log.timestamp) < new Date(dateDebut)) match = false;
    if (dateFin && new Date(log.timestamp) > new Date(dateFin)) match = false;
    return match;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const uniqueActions = [...new Set(logs.map(l => l.action))];

  const exportCSV = () => {
    const headers = ['Utilisateur', 'Action', 'Timestamp', 'IP', 'Détails'];
    const rows = filteredLogs.map(l => [l.user_name, l.action, new Date(l.timestamp).toLocaleString(), l.ip_address || '', JSON.stringify(l.details || {})]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const wsData = filteredLogs.map(l => ({ Utilisateur: l.user_name, Action: l.action, Timestamp: new Date(l.timestamp).toLocaleString(), IP: l.ip_address || '', Détails: JSON.stringify(l.details || {}) }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Logs');
    XLSX.writeFile(wb, `logs_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text('Logs système', 14, 10);
    doc.autoTable({ head: [['Utilisateur', 'Action', 'Timestamp', 'IP']], body: filteredLogs.map(l => [l.user_name, l.action, new Date(l.timestamp).toLocaleString(), l.ip_address || '']), startY: 20 });
    doc.save(`logs_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getActionColor = (action) => {
    if (action.includes('LOGIN') || action.includes('CONNEXION')) return 'bg-green-100 text-green-800';
    if (action.includes('LOGOUT') || action.includes('DECONNEXION')) return 'bg-gray-100 text-gray-800';
    if (action.includes('CREATE') || action.includes('CREATION')) return 'bg-blue-100 text-blue-800';
    if (action.includes('UPDATE') || action.includes('MODIFICATION')) return 'bg-yellow-100 text-yellow-800';
    if (action.includes('DELETE') || action.includes('SUPPRESSION')) return 'bg-red-100 text-red-800';
    if (action.includes('VALIDATE') || action.includes('VALIDATION')) return 'bg-purple-100 text-purple-800';
    if (action.includes('REJECT') || action.includes('REJET')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="flex justify-center h-64"><div className="w-12 h-12 border-4 border-mutas-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestion des logs</h1>
        <button onClick={fetchLogs} className="flex items-center gap-2 px-4 py-2 bg-mutas-500 text-white rounded-lg"><FiRefreshCw /> Actualiser</button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4"><div className="flex justify-between"><div><p className="text-gray-500 text-sm">Total logs</p><p className="text-2xl font-bold">{stats.total || logs.length}</p></div><div className="w-10 h-10 bg-mutas-100 rounded-full flex items-center justify-center"><FiActivity className="text-mutas-500" /></div></div></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4"><div className="flex justify-between"><div><p className="text-gray-500 text-sm">Aujourd'hui</p><p className="text-2xl font-bold text-green-600">{stats.today || logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length}</p></div><div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center"><FiCalendar className="text-green-600" /></div></div></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4"><div className="flex justify-between"><div><p className="text-gray-500 text-sm">Cette semaine</p><p className="text-2xl font-bold text-orange-600">{stats.thisWeek || logs.filter(l => { const date = new Date(l.timestamp); const today = new Date(); const weekAgo = new Date(today.setDate(today.getDate() - 7)); return date > weekAgo; }).length}</p></div><div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center"><FiClock className="text-orange-600" /></div></div></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4"><div className="flex justify-between"><div><p className="text-gray-500 text-sm">Utilisateurs uniques</p><p className="text-2xl font-bold text-purple-600">{stats.uniqueUsers || new Set(logs.map(l => l.user)).size}</p></div><div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center"><FiUser className="text-purple-600" /></div></div></div>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" /></div>
          <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="px-3 py-2 border rounded-lg"><option value="">Tous les utilisateurs</option>{users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}</select>
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="px-3 py-2 border rounded-lg"><option value="">Toutes les actions</option>{uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}</select>
          <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="px-3 py-2 border rounded-lg" placeholder="Date début" />
          <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="px-3 py-2 border rounded-lg" placeholder="Date fin" />
        </div>
      </div>

      {/* Export buttons */}
      <div className="flex justify-end gap-2">
        <button onClick={exportCSV} className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"><FiDownload /> CSV</button>
        <button onClick={exportExcel} className="px-3 py-2 bg-green-100 rounded-lg hover:bg-green-200"><FiDownload /> Excel</button>
        <button onClick={exportPDF} className="px-3 py-2 bg-red-100 rounded-lg hover:bg-red-200"><FiDownload /> PDF</button>
      </div>

      {/* Tableau */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Détails</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
            <tbody className="divide-y">
              {currentLogs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{log.user?.username || log.user_name || 'Système'}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs ${getActionColor(log.action)}`}>{log.action}</span></td>
                  <td className="px-6 py-4">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-4 font-mono text-sm">{log.ip_address || '-'}</td>
                  <td className="px-6 py-4 max-w-md">
                    <div className="text-sm break-words">
                      {typeof log.details === 'object' ? (
                        <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-20">{JSON.stringify(log.details, null, 2)}</pre>
                      ) : (log.details || '-')}
                    </div>
                  </td>
                  <td className="px-6 py-4"><button onClick={() => { setSelectedLog(log); setShowDetailModal(true); }} className="text-mutas-500 hover:text-mutas-700"><FiEye size={18} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t flex justify-between items-center">
          <p className="text-sm text-gray-500">{indexOfFirstItem + 1} à {Math.min(indexOfLastItem, filteredLogs.length)} sur {filteredLogs.length}</p>
          <div className="flex gap-2"><button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded-lg disabled:opacity-50">Précédent</button><span className="px-3 py-1 bg-mutas-500 text-white rounded-lg">{currentPage}</span><button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-lg disabled:opacity-50">Suivant</button></div>
        </div>
      </div>

      {/* Modal Détails */}
      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-5 border-b flex justify-between items-center"><h2 className="text-xl font-bold">Détails du log</h2><button onClick={() => setShowDetailModal(false)}><FiX size={24} /></button></div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-gray-500">ID</label><p className="font-mono">{selectedLog.id}</p></div>
                <div><label className="text-sm text-gray-500">Utilisateur</label><p>{selectedLog.user?.username || selectedLog.user_name || 'Système'}</p></div>
                <div><label className="text-sm text-gray-500">Action</label><p><span className={`px-2 py-1 rounded-full text-xs ${getActionColor(selectedLog.action)}`}>{selectedLog.action}</span></p></div>
                <div><label className="text-sm text-gray-500">Timestamp</label><p>{new Date(selectedLog.timestamp).toLocaleString()}</p></div>
                <div><label className="text-sm text-gray-500">IP Address</label><p className="font-mono">{selectedLog.ip_address || '-'}</p></div>
                <div className="col-span-2"><label className="text-sm text-gray-500">Détails complets</label><pre className="mt-2 p-3 bg-gray-50 rounded-lg overflow-x-auto text-sm">{JSON.stringify(selectedLog.details, null, 2)}</pre></div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default GestionLogs;