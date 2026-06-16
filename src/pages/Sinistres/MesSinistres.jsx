import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEye, FiEdit2, FiPrinter, FiPlus, FiSearch, FiDownload } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function MesSinistres() {
  const { user } = useAuth();
  const [sinistres, setSinistres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type_sinistre: 'AUTO',
    incident_date: '',
    address: '',
    description: '',
    estimated_amount: '',
  });
  const [mediaFiles, setMediaFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSinistres();
  }, []);

  const fetchSinistres = async () => {
    try {
      const response = await api.get('/sinistres/');
      const mesSinistres = response.data.filter(s => s.sinistre_client?.id === user?.id);
      setSinistres(mesSinistres);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPosition = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      });
    }
  };

  const handleSubmitDeclaration = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const sinistreResponse = await api.post('/sinistres/create/', formData);
      const sinistreId = sinistreResponse.data.id;
      
      for (const file of mediaFiles) {
        const mediaData = new FormData();
        mediaData.append('media_type', file.type.startsWith('image/') ? 'PHOTO' : 
                                   file.type.startsWith('video/') ? 'VIDEO' : 'DOCUMENT');
        mediaData.append('file', file);
        await api.post(`/sinistres/${sinistreId}/media/`, mediaData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      toast.success('Déclaration effectuée avec succès');
      setShowModal(false);
      setFormData({
        type_sinistre: 'AUTO',
        incident_date: '',
        address: '',
        description: '',
        estimated_amount: '',
      });
      setMediaFiles([]);
      fetchSinistres();
    } catch (error) {
      toast.error('Erreur lors de la déclaration');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = (sinistre) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Sinistre ${sinistre.reference}</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>Fiche sinistre</h1>
          <p><strong>Référence:</strong> ${sinistre.reference}</p>
          <p><strong>Type:</strong> ${sinistre.type_sinistre}</p>
          <p><strong>Statut:</strong> ${sinistre.status}</p>
          <p><strong>Date:</strong> ${new Date(sinistre.created_at).toLocaleString()}</p>
          <p><strong>Adresse:</strong> ${sinistre.address}</p>
          <p><strong>Description:</strong> ${sinistre.description}</p>
          <p><strong>Montant estimé:</strong> ${sinistre.estimated_amount?.toLocaleString()} FCFA</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Filtrer et trier
  const filteredSinistres = sinistres.filter(s =>
    s.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.type_sinistre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedSinistres = [...filteredSinistres].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (sortField === 'created_at') {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    }
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedSinistres.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedSinistres.length / itemsPerPage);

  // Export CSV
  const exportCSV = () => {
    const headers = ['Référence', 'Type', 'Statut', 'Date', 'Adresse', 'Montant estimé'];
    const rows = sinistres.map(s => [
      s.reference, s.type_sinistre, s.status,
      new Date(s.created_at).toLocaleDateString(),
      s.address, s.estimated_amount || ''
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mes_sinistres.csv';
    a.click();
  };

  // Export Excel
  const exportExcel = () => {
    const wsData = sinistres.map(s => ({
      Référence: s.reference,
      Type: s.type_sinistre,
      Statut: s.status,
      Date: new Date(s.created_at).toLocaleDateString(),
      Adresse: s.address,
      'Montant estimé': s.estimated_amount
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mes sinistres');
    XLSX.writeFile(wb, 'mes_sinistres.xlsx');
  };

  // Export PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Mes sinistres', 14, 10);
    const tableData = sinistres.map(s => [
      s.reference, s.type_sinistre, s.status,
      new Date(s.created_at).toLocaleDateString(),
      s.estimated_amount ? s.estimated_amount.toLocaleString() : ''
    ]);
    doc.autoTable({
      head: [['Référence', 'Type', 'Statut', 'Date', 'Montant']],
      body: tableData,
      startY: 20,
    });
    doc.save('mes_sinistres.pdf');
  };

  const getStatusBadge = (status) => {
    const config = {
      DECLARE: { color: 'bg-yellow-100 text-yellow-800', label: 'Déclaré' },
      VALIDATION: { color: 'bg-blue-100 text-blue-800', label: 'En validation' },
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Mes sinistres</h1>
        <button
          onClick={() => {
            setShowModal(true);
            getCurrentPosition();
          }}
          className="flex items-center gap-2 bg-mutas-500 text-white px-4 py-2 rounded-lg hover:bg-mutas-600 transition-colors"
        >
          <FiPlus size={18} /> Effectuer une déclaration
        </button>
      </div>

      {/* Barre d'outils */}
      <div className="flex flex-wrap justify-between gap-4">
        <div className="flex gap-2">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-mutas-500 focus:border-mutas-500"
            />
          </div>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="px-3 py-2 border rounded-lg"
          >
            <option value={20}>20 par page</option>
            <option value={50}>50 par page</option>
            <option value={100}>100 par page</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
            <FiDownload size={16} /> CSV
          </button>
          <button onClick={exportExcel} className="flex items-center gap-1 px-3 py-2 bg-green-100 rounded-lg hover:bg-green-200">
            <FiDownload size={16} /> Excel
          </button>
          <button onClick={exportPDF} className="flex items-center gap-1 px-3 py-2 bg-red-100 rounded-lg hover:bg-red-200">
            <FiDownload size={16} /> PDF
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => setSortField('reference')}>
                  Référence {sortField === 'reference' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => setSortField('type_sinistre')}>
                  Type {sortField === 'type_sinistre' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => setSortField('status')}>
                  Statut {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => setSortField('created_at')}>
                  Date {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant estimé</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {currentItems.map(sinistre => {
                const badge = getStatusBadge(sinistre.status);
                return (
                  <tr key={sinistre.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{sinistre.reference}</td>
                    <td className="px-6 py-4">{sinistre.type_sinistre}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>{badge.label}</span>
                    </td>
                    <td className="px-6 py-4">{new Date(sinistre.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">{sinistre.estimated_amount?.toLocaleString() || '-'} FCFA</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link to={`/sinistre/${sinistre.id}`} className="text-mutas-600 hover:text-mutas-800" title="Voir">
                          <FiEye size={18} />
                        </Link>
                        <button className="text-yellow-600 hover:text-yellow-800" title="Modifier">
                          <FiEdit2 size={18} />
                        </button>
                        <button onClick={() => handlePrint(sinistre)} className="text-gray-600 hover:text-gray-800" title="Imprimer">
                          <FiPrinter size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
           </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Affichage {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, sortedSinistres.length)} sur {sortedSinistres.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded-lg disabled:opacity-50"
            >
              Précédent
            </button>
            <span className="px-3 py-1 bg-mutas-500 text-white rounded-lg">{currentPage}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded-lg disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      {/* Modal de déclaration */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-5 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold">Nouvelle déclaration de sinistre</h2>
            </div>
            <form onSubmit={handleSubmitDeclaration} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type de sinistre</label>
                <select
                  name="type_sinistre"
                  value={formData.type_sinistre}
                  onChange={(e) => setFormData({ ...formData, type_sinistre: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="AUTO">Automobile</option>
                  <option value="HABITATION">Habitation</option>
                  <option value="SANTE">Santé</option>
                  <option value="VOYAGE">Voyage</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date de l'incident</label>
                <input
                  type="datetime-local"
                  value={formData.incident_date}
                  onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Adresse</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
                <button type="button" onClick={getCurrentPosition} className="text-sm text-mutas-500 mt-1">
                  📍 Utiliser ma position actuelle
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="4"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Montant estimé (FCFA)</label>
                <input
                  type="number"
                  value={formData.estimated_amount}
                  onChange={(e) => setFormData({ ...formData, estimated_amount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Photos / Documents</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setMediaFiles([...mediaFiles, ...Array.from(e.target.files)])}
                  className="w-full"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={submitting} className="flex-1 bg-mutas-500 text-white py-2 rounded-lg hover:bg-mutas-600">
                  {submitting ? 'Envoi...' : 'Déclarer'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50">
                  Annuler
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default MesSinistres;