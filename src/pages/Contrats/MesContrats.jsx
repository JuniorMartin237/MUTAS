import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiEye, FiEdit2, FiPrinter, FiPlus, FiUsers, FiSearch, FiDownload } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function MesContrats() {
  const { user } = useAuth();
  const [contrats, setContrats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [showNewContratModal, setShowNewContratModal] = useState(false);
  const [showTiersModal, setShowTiersModal] = useState(false);
  const [selectedContratFam, setSelectedContratFam] = useState(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    type_contrat: 'AUTO',
    date_debut: '',
    date_fin: '',
    montant_prime: '',
    beneficiaires: [],
  });
  const [tiersFormData, setTiersFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    phone: '',
    adresse: '',
    relation: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [position, setPosition] = useState({ latitude: null, longitude: null });

  useEffect(() => {
    fetchContrats();
    getCurrentPosition();
  }, []);

  const fetchContrats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/contrats/');
      const mesContrats = response.data.filter(c => c.souscripteur?.id === user?.id);
      setContrats(mesContrats);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPosition = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPosition({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.log('Erreur géolocalisation:', error);
        }
      );
    }
  };

  const handleNewContrat = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/contrats/creer/', formData);
      toast.success('Demande de contrat envoyée avec succès');
      setShowNewContratModal(false);
      setFormData({ type_contrat: 'AUTO', date_debut: '', date_fin: '', montant_prime: '', beneficiaires: [] });
      fetchContrats();
    } catch (error) {
      toast.error('Erreur lors de la demande');
    } finally {
      setSubmitting(false);
    }
  };

  const handleIntegrateTiers = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Étape 1: Créer le compte du tiers
      const userResponse = await api.post('/accounts/register/', {
        username: tiersFormData.email.split('@')[0] + Date.now(),
        email: tiersFormData.email,
        first_name: tiersFormData.prenom,
        last_name: tiersFormData.nom,
        phone: tiersFormData.phone,
        address: tiersFormData.adresse,
        user_type: 'SINISTRE',
        password: Math.random().toString(36).slice(-8),
      });
      // Étape 2: Associer au contrat FAM
      await api.post(`/contrats/${selectedContratFam.id}/ajouter-beneficiaire/`, {
        beneficiaire_id: userResponse.data.id,
        relation: tiersFormData.relation,
        latitude: position.latitude,
        longitude: position.longitude,
      });
      toast.success('Tiers intégré avec succès');
      setShowTiersModal(false);
      setSelectedContratFam(null);
      setStep(1);
      setTiersFormData({ nom: '', prenom: '', email: '', phone: '', adresse: '', relation: '' });
      fetchContrats();
    } catch (error) {
      toast.error('Erreur lors de l\'intégration');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = (contrat) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Contrat ${contrat.reference}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #0EA5E9; }
          .info { margin-bottom: 10px; }
          .label { font-weight: bold; width: 150px; display: inline-block; }
        </style>
        </head>
        <body>
          <h1>Fiche contrat d'assurance</h1>
          <hr/>
          <div class="info"><span class="label">Référence:</span> ${contrat.reference}</div>
          <div class="info"><span class="label">Type:</span> ${contrat.type_contrat}</div>
          <div class="info"><span class="label">Statut:</span> ${contrat.statut || 'ACTIF'}</div>
          <div class="info"><span class="label">Date début:</span> ${new Date(contrat.date_debut).toLocaleDateString()}</div>
          <div class="info"><span class="label">Date fin:</span> ${new Date(contrat.date_fin).toLocaleDateString()}</div>
          <div class="info"><span class="label">Prime mensuelle:</span> ${contrat.montant_prime?.toLocaleString()} FCFA</div>
          <hr/>
          <p style="font-size: 12px; color: gray;">Document généré le ${new Date().toLocaleString()}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Filtrer et paginer
  const filteredContrats = contrats.filter(c =>
    c.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.type_contrat?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredContrats.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredContrats.length / itemsPerPage);

  // Exports
  const exportCSV = () => {
    const headers = ['Référence', 'Type', 'Statut', 'Date début', 'Date fin', 'Prime'];
    const rows = contrats.map(c => [
      c.reference, c.type_contrat, c.statut || 'ACTIF',
      new Date(c.date_debut).toLocaleDateString(),
      new Date(c.date_fin).toLocaleDateString(),
      c.montant_prime || ''
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mes_contrats.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const wsData = contrats.map(c => ({
      Référence: c.reference,
      Type: c.type_contrat,
      Statut: c.statut || 'ACTIF',
      'Date début': new Date(c.date_debut).toLocaleDateString(),
      'Date fin': new Date(c.date_fin).toLocaleDateString(),
      Prime: c.montant_prime
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mes contrats');
    XLSX.writeFile(wb, 'mes_contrats.xlsx');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Mes contrats', 14, 10);
    const tableData = contrats.map(c => [
      c.reference, 
      c.type_contrat, 
      c.statut || 'ACTIF',
      new Date(c.date_debut).toLocaleDateString(),
      c.montant_prime ? c.montant_prime.toLocaleString() : ''
    ]);
    doc.autoTable({
      head: [['Référence', 'Type', 'Statut', 'Date début', 'Prime']],
      body: tableData,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [14, 165, 233] },
    });
    doc.save('mes_contrats.pdf');
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
        <h1 className="text-2xl font-bold">Mes contrats</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowNewContratModal(true)}
            className="flex items-center gap-2 bg-mutas-500 text-white px-4 py-2 rounded-lg hover:bg-mutas-600 transition-colors"
          >
            <FiPlus size={18} /> Nouveau contrat
          </button>
          <button
            onClick={() => setShowTiersModal(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <FiUsers size={18} /> Intégrer un tiers
          </button>
        </div>
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
          <button onClick={exportCSV} className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <FiDownload size={16} /> CSV
          </button>
          <button onClick={exportExcel} className="flex items-center gap-1 px-3 py-2 bg-green-100 dark:bg-green-900/30 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors">
            <FiDownload size={16} /> Excel
          </button>
          <button onClick={exportPDF} className="flex items-center gap-1 px-3 py-2 bg-red-100 dark:bg-red-900/30 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Référence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date début</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date fin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Prime</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {currentItems.map(contrat => (
                <tr key={contrat.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{contrat.reference}</td>
                  <td className="px-6 py-4">{contrat.type_contrat}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      contrat.statut === 'ACTIF' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                      contrat.statut === 'EXPIRED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>{contrat.statut || 'ACTIF'}</span>
                  </td>
                  <td className="px-6 py-4">{new Date(contrat.date_debut).toLocaleDateString()}</td>
                  <td className="px-6 py-4">{new Date(contrat.date_fin).toLocaleDateString()}</td>
                  <td className="px-6 py-4">{contrat.montant_prime?.toLocaleString()} FCFA</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="text-mutas-600 hover:text-mutas-800 dark:text-mutas-400" title="Voir">
                        <FiEye size={18} />
                      </button>
                      <button className="text-yellow-600 hover:text-yellow-800" title="Modifier">
                        <FiEdit2 size={18} />
                      </button>
                      <button onClick={() => handlePrint(contrat)} className="text-gray-600 hover:text-gray-800 dark:text-gray-400" title="Imprimer">
                        <FiPrinter size={18} />
                      </button>
                    </div>
                   </td>
                 </tr>
              ))}
              {currentItems.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    Aucun contrat trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Affichage {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, filteredContrats.length)} sur {filteredContrats.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Précédent
            </button>
            <span className="px-3 py-1 bg-mutas-500 text-white rounded-lg">{currentPage}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      {/* Modal Nouveau Contrat */}
      {showNewContratModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md"
          >
            <div className="p-5 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold">Nouvelle demande de contrat</h2>
            </div>
            <form onSubmit={handleNewContrat} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type de contrat</label>
                <select
                  value={formData.type_contrat}
                  onChange={(e) => setFormData({ ...formData, type_contrat: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="AUTO">Automobile</option>
                  <option value="SANTE">Santé</option>
                  <option value="HABITATION">Habitation</option>
                  <option value="VOYAGE">Voyage</option>
                  <option value="FAM">Familiale (FAM)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date de début</label>
                <input
                  type="date"
                  value={formData.date_debut}
                  onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date de fin</label>
                <input
                  type="date"
                  value={formData.date_fin}
                  onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prime mensuelle (FCFA)</label>
                <input
                  type="number"
                  value={formData.montant_prime}
                  onChange={(e) => setFormData({ ...formData, montant_prime: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="10000"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-mutas-500 text-white py-2 rounded-lg hover:bg-mutas-600 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Envoi...' : 'Soumettre'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewContratModal(false)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal Intégrer un tiers - Step 1 */}
      {showTiersModal && step === 1 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md"
          >
            <div className="p-5 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold">Choisir le contrat FAM</h2>
              <p className="text-sm text-gray-500 mt-1">Sélectionnez le contrat familial auquel intégrer la personne</p>
            </div>
            <div className="p-5 space-y-3 max-h-96 overflow-y-auto">
              {contrats.filter(c => c.type_contrat === 'FAM').length === 0 && (
                <p className="text-center text-gray-500">Aucun contrat FAM disponible</p>
              )}
              {contrats.filter(c => c.type_contrat === 'FAM').map(contrat => (
                <button
                  key={contrat.id}
                  onClick={() => { setSelectedContratFam(contrat); setStep(2); }}
                  className="w-full p-3 border rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <p className="font-medium">{contrat.reference}</p>
                  <p className="text-sm text-gray-500">Prime: {contrat.montant_prime?.toLocaleString()} FCFA/mois</p>
                  <p className="text-xs text-gray-400">Début: {new Date(contrat.date_debut).toLocaleDateString()}</p>
                </button>
              ))}
            </div>
            <div className="p-5 border-t dark:border-gray-700">
              <button
                onClick={() => setShowTiersModal(false)}
                className="w-full py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Intégrer un tiers - Step 2 */}
      {showTiersModal && step === 2 && selectedContratFam && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="p-5 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-xl font-bold">Intégrer un tiers</h2>
              <p className="text-sm text-gray-500">Contrat: {selectedContratFam.reference}</p>
            </div>
            <form onSubmit={handleIntegrateTiers} className="p-5 space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Nom"
                  value={tiersFormData.nom}
                  onChange={(e) => setTiersFormData({ ...tiersFormData, nom: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Prénom"
                  value={tiersFormData.prenom}
                  onChange={(e) => setTiersFormData({ ...tiersFormData, prenom: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={tiersFormData.email}
                  onChange={(e) => setTiersFormData({ ...tiersFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
              <div>
                <input
                  type="tel"
                  placeholder="Téléphone"
                  value={tiersFormData.phone}
                  onChange={(e) => setTiersFormData({ ...tiersFormData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Adresse"
                  value={tiersFormData.adresse}
                  onChange={(e) => setTiersFormData({ ...tiersFormData, adresse: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Lien de parenté (ex: enfant, conjoint, parent)"
                  value={tiersFormData.relation}
                  onChange={(e) => setTiersFormData({ ...tiersFormData, relation: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
              {position.latitude && (
                <p className="text-xs text-green-600">
                  📍 Localisation automatique activée
                </p>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Traitement...' : 'Intégrer'}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep(1); setSelectedContratFam(null); }}
                  className="flex-1 border border-gray-300 dark:border-gray-600 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Retour
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default MesContrats;