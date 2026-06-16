import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { 
  FiFileText, FiUsers, FiActivity, FiServer, FiShield, FiUserCheck, FiClock, 
  FiCheckCircle, FiXCircle, FiAlertCircle, FiPlus, FiFilter, FiCalendar, 
  FiList, FiTrendingUp, FiEye, FiEdit2, FiTrash2, FiCheck, FiRefreshCw,
  FiGrid, FiPieChart, FiBarChart2, FiDatabase, FiSave, FiX, FiUpload,
  FiUser, FiMail, FiPhone, FiMapPin, FiChevronLeft, FiChevronRight,
  FiBell, FiFlag, FiAlertTriangle
} from 'react-icons/fi';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

function DashboardAdmin() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showSinistreDetailModal, setShowSinistreDetailModal] = useState(false);
  const [selectedSinistre, setSelectedSinistre] = useState(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationSinistres, setValidationSinistres] = useState([]);
  const [showNewSinistreModal, setShowNewSinistreModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    enCours: 0,
    indemnisés: 0,
    rejetés: 0,
    enAttente: 0
  });
  
  const [repartition, setRepartition] = useState({});
  const [evolution, setEvolution] = useState([]);
  const [derniersSinistres, setDerniersSinistres] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [sinistresByDate, setSinistresByDate] = useState({});
  
  // Tâches
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '',
    priority: 'medium',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '12:00',
    reminder: false
  });
  
  // Formulaire sinistre
  const [sinistreForm, setSinistreForm] = useState({
    type: 'AUTO',
    description: '',
    date_survenance: new Date().toISOString().split('T')[0],
    lieu: '',
    montant_estime: '',
    pieces_jointes: [],
    type_declaration: 'PARTIEL'
  });
  
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Mois et années
  const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  useEffect(() => {
    fetchDashboardData();
    fetchDerniersSinistres();
    fetchValidationSinistres();
    fetchTasks();
  }, []);

  useEffect(() => {
    generateCalendar();
  }, [currentDate, calendarEvents]);

  const fetchDashboardData = async () => {
    try {
      const sinistresResponse = await api.get('/sinistres/');
      const sinistres = sinistresResponse.data;
      
      setStats({
        total: sinistres.length,
        enCours: sinistres.filter(s => s.statut === 'EN_COURS' || s.statut === 'TRAITEMENT').length,
        indemnisés: sinistres.filter(s => s.statut === 'INDEMNISE' || s.statut === 'CLOTURE').length,
        rejetés: sinistres.filter(s => s.statut === 'REJETE').length,
        enAttente: sinistres.filter(s => s.statut === 'EN_ATTENTE' || s.statut === 'NOUVEAU').length,
      });
      
      const repartitionData = {};
      sinistres.forEach(s => {
        const type = s.type_sinistre || 'AUTRE';
        repartitionData[type] = (repartitionData[type] || 0) + 1;
      });
      setRepartition(repartitionData);
      
      const evolutionData = getEvolutionData(sinistres);
      setEvolution(evolutionData);
      
      // Organiser sinistres par date
      const byDate = {};
      sinistres.forEach(s => {
        const date = new Date(s.date_creation).toDateString();
        if (!byDate[date]) byDate[date] = [];
        byDate[date].push(s);
      });
      setSinistresByDate(byDate);
      
    } catch (error) {
      console.error(error);
      toast.error('Erreur chargement données');
    } finally {
      setLoading(false);
    }
  };

  const fetchDerniersSinistres = async () => {
    try {
      const response = await api.get('/sinistres/?ordering=-date_creation&limit=10');
      setDerniersSinistres(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchValidationSinistres = async () => {
    try {
      const response = await api.get('/sinistres/?statut=FINALISE&statut=EN_ATTENTE_VALIDATION');
      setValidationSinistres(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks/');
      setTasks(response.data);
    } catch (error) {
      // Données locales par défaut
      setTasks([
        { id: 1, title: 'Valider les sinistres en attente', completed: false, priority: 'high', dueDate: new Date().toISOString().split('T')[0], reminder: true },
        { id: 2, title: 'Faire le rapport mensuel', completed: false, priority: 'medium', dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], reminder: false },
        { id: 3, title: 'Vérifier les expertises en cours', completed: true, priority: 'low', dueDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], reminder: false },
      ]);
    }
  };

  const getEvolutionData = (sinistres) => {
    const counts = new Array(12).fill(0);
    sinistres.forEach(s => {
      const month = new Date(s.date_creation).getMonth();
      counts[month]++;
    });
    return counts;
  };

  // Calendrier
  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startDay = firstDayOfMonth.getDay() || 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const calendar = [];
    let dayCounter = 1;
    
    for (let i = 0; i < 6; i++) {
      const week = [];
      for (let j = 0; j < 7; j++) {
        if ((i === 0 && j < startDay - 1) || dayCounter > daysInMonth) {
          week.push(null);
        } else {
          const date = new Date(year, month, dayCounter);
          const dateStr = date.toDateString();
          const dayEvents = calendarEvents.filter(e => new Date(e.date).toDateString() === dateStr);
          const daySinistres = sinistresByDate[dateStr] || [];
          
          week.push({
            day: dayCounter,
            date: date,
            events: dayEvents,
            sinistres: daySinistres,
            counts: {
              enAttente: daySinistres.filter(s => s.statut === 'EN_ATTENTE' || s.statut === 'NOUVEAU').length,
              enCours: daySinistres.filter(s => s.statut === 'EN_COURS' || s.statut === 'TRAITEMENT').length,
              indemnisés: daySinistres.filter(s => s.statut === 'INDEMNISE' || s.statut === 'CLOTURE').length,
              rejetés: daySinistres.filter(s => s.statut === 'REJETE').length,
            }
          });
          dayCounter++;
        }
      }
      calendar.push(week);
      if (dayCounter > daysInMonth) break;
    }
    
    return calendar;
  };

  const calendar = generateCalendar();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Gestion sinistre
  const handleSinistreChange = (e) => {
    setSinistreForm({ ...sinistreForm, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} dépasse 5MB`);
        continue;
      }
      const formData = new FormData();
      formData.append('file', file);
      try {
        const response = await api.post('/sinistres/upload/', formData);
        setUploadedFiles([...uploadedFiles, response.data]);
      } catch (error) {
        toast.error(`Erreur upload ${file.name}`);
      }
    }
  };

  const handleSubmitSinistre = async () => {
    if (!sinistreForm.description || !sinistreForm.date_survenance) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }
    
    try {
      const data = {
        ...sinistreForm,
        pieces_jointes: uploadedFiles.map(f => f.id),
        montant_estime: parseFloat(sinistreForm.montant_estime) || 0
      };
      await api.post('/sinistres/create/', data);
      toast.success('Sinistre déclaré avec succès');
      setShowNewSinistreModal(false);
      resetSinistreForm();
      fetchDashboardData();
      fetchDerniersSinistres();
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  const resetSinistreForm = () => {
    setSinistreForm({
      type: 'AUTO',
      description: '',
      date_survenance: new Date().toISOString().split('T')[0],
      lieu: '',
      montant_estime: '',
      pieces_jointes: [],
      type_declaration: 'PARTIEL'
    });
    setUploadedFiles([]);
  };

  const handleValiderSinistre = async (sinistreId, decision, motif = null) => {
    try {
      await api.post(`/sinistres/${sinistreId}/valider/`, { decision, motif });
      toast.success(`Sinistre ${decision === 'APPROUVE' ? 'approuvé' : 'rejeté'}`);
      fetchValidationSinistres();
      fetchDashboardData();
      setShowValidationModal(false);
    } catch (error) {
      toast.error('Erreur lors de la validation');
    }
  };

  // Gestion tâches
  const addTask = async () => {
    if (!newTask.title.trim()) {
      toast.error('Veuillez entrer une tâche');
      return;
    }
    
    try {
      const response = await api.post('/tasks/create/', newTask);
      setTasks([...tasks, response.data]);
      toast.success('Tâche ajoutée');
      setNewTask({ title: '', priority: 'medium', dueDate: new Date().toISOString().split('T')[0], dueTime: '12:00', reminder: false });
      setShowTaskModal(false);
    } catch (error) {
      // Sauvegarde locale
      const task = { ...newTask, id: Date.now(), completed: false };
      setTasks([...tasks, task]);
      toast.success('Tâche ajoutée');
      setShowTaskModal(false);
    }
  };

  const toggleTask = async (id) => {
    const task = tasks.find(t => t.id === id);
    try {
      await api.patch(`/tasks/${id}/`, { completed: !task.completed });
      setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    } catch (error) {
      setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    }
  };

  const deleteTask = async (id) => {
    try {
      await api.delete(`/tasks/${id}/`);
      setTasks(tasks.filter(t => t.id !== id));
    } catch (error) {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const getPriorityColor = (priority) => {
    return {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    }[priority];
  };

  const getPriorityLabel = (priority) => {
    return { high: 'Haute', medium: 'Moyenne', low: 'Basse' }[priority];
  };

  const getStatusColor = (statut) => {
    const colors = {
      'EN_COURS': 'bg-yellow-100 text-yellow-800',
      'TRAITEMENT': 'bg-blue-100 text-blue-800',
      'INDEMNISE': 'bg-green-100 text-green-800',
      'CLOTURE': 'bg-green-100 text-green-800',
      'REJETE': 'bg-red-100 text-red-800',
      'EN_ATTENTE': 'bg-gray-100 text-gray-800',
      'NOUVEAU': 'bg-purple-100 text-purple-800',
      'FINALISE': 'bg-indigo-100 text-indigo-800',
      'EN_ATTENTE_VALIDATION': 'bg-orange-100 text-orange-800',
    };
    return colors[statut] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (statut) => {
    const labels = {
      'EN_COURS': 'En cours',
      'TRAITEMENT': 'En traitement',
      'INDEMNISE': 'Indemnisé',
      'CLOTURE': 'Clôturé',
      'REJETE': 'Rejeté',
      'EN_ATTENTE': 'En attente',
      'NOUVEAU': 'Nouveau',
      'FINALISE': 'Finalisé',
      'EN_ATTENTE_VALIDATION': 'En attente validation',
    };
    return labels[statut] || statut;
  };

  const repartitionData = {
    labels: Object.keys(repartition).map(t => {
      const types = { AUTO: 'Auto', HABITATION: 'Habitation', SANTE: 'Santé', VOYAGE: 'Voyage', AUTRE: 'Autre' };
      return types[t] || t;
    }),
    datasets: [{
      data: Object.values(repartition),
      backgroundColor: ['#0EA5E9', '#F59E0B', '#10B981', '#8B5CF6', '#EF4444', '#EC4899', '#06B6D4'],
      borderWidth: 0,
    }],
  };

  const evolutionData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    datasets: [{
      label: 'Sinistres',
      data: evolution,
      borderColor: '#0EA5E9',
      backgroundColor: 'rgba(14, 165, 233, 0.1)',
      fill: true,
      tension: 0.4,
    }],
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <button onClick={fetchDashboardData} className="flex items-center gap-2 px-4 py-2 bg-mutas-500 text-white rounded-lg hover:bg-mutas-600">
          <FiRefreshCw size={16} /> Actualiser
        </button>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total sinistres</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-mutas-100 rounded-full flex items-center justify-center">
              <FiFileText className="text-mutas-500" size={20} />
            </div>
          </div>
        </motion.div>

        <motion.div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">En attente</p>
              <p className="text-2xl font-bold text-purple-600">{stats.enAttente}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <FiClock className="text-purple-600" size={20} />
            </div>
          </div>
        </motion.div>

        <motion.div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">En cours</p>
              <p className="text-2xl font-bold text-orange-600">{stats.enCours}</p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <FiActivity className="text-orange-600" size={20} />
            </div>
          </div>
        </motion.div>

        <motion.div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Indemnisés</p>
              <p className="text-2xl font-bold text-green-600">{stats.indemnisés}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <FiCheckCircle className="text-green-600" size={20} />
            </div>
          </div>
        </motion.div>

        <motion.div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Rejetés</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejetés}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <FiXCircle className="text-red-600" size={20} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <FiTrendingUp /> Évolution des sinistres
          </h3>
          <Line data={evolutionData} options={{ responsive: true, maintainAspectRatio: true }} />
        </motion.div>

        <motion.div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <FiPieChart /> Répartition par type
          </h3>
          <div className="max-w-xs mx-auto">
            <Doughnut data={repartitionData} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>
        </motion.div>
      </div>

      {/* Raccourcis rapides */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setShowNewSinistreModal(true)}
          className="flex items-center justify-center gap-2 p-4 bg-mutas-500 text-white rounded-xl hover:bg-mutas-600 transition-colors"
        >
          <FiPlus size={20} /> Nouveau sinistre
        </button>
        <button
          onClick={() => setShowValidationModal(true)}
          className="flex items-center justify-center gap-2 p-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
        >
          <FiCheckCircle size={20} /> Valider sinistre ({validationSinistres.length})
        </button>
        <button className="flex items-center justify-center gap-2 p-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors">
          <FiBarChart2 size={20} /> Rapports
        </button>
        <button className="flex items-center justify-center gap-2 p-4 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors">
          <FiUsers size={20} /> Gestion équipe
        </button>
      </div>

      {/* Derniers sinistres et Calendrier */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <FiList /> Derniers sinistres
            </h3>
            <button className="text-mutas-500 text-sm hover:underline">Voir tout</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 text-xs font-medium text-gray-500">N° Sinistre</th>
                  <th className="text-left py-2 text-xs font-medium text-gray-500">Type</th>
                  <th className="text-left py-2 text-xs font-medium text-gray-500">Date</th>
                  <th className="text-left py-2 text-xs font-medium text-gray-500">Statut</th>
                  <th className="text-left py-2 text-xs font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {derniersSinistres.map((sinistre, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedSinistre(sinistre); setShowSinistreDetailModal(true); }}>
                    <td className="py-2 text-sm font-mono">{sinistre.numero || `SIN-${sinistre.id}`}</td>
                    <td className="py-2 text-sm">{sinistre.type_sinistre || 'Non spécifié'}</td>
                    <td className="py-2 text-sm">{new Date(sinistre.date_creation).toLocaleDateString()}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sinistre.statut)}`}>
                        {getStatusLabel(sinistre.statut)}
                      </span>
                    </td>
                    <td className="py-2">
                      <button className="text-mutas-500 hover:text-mutas-700" onClick={(e) => { e.stopPropagation(); setSelectedSinistre(sinistre); setShowSinistreDetailModal(true); }}>
                        <FiEye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Calendrier Google-like */}
        <motion.div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <FiCalendar /> Calendrier
            </h3>
            <div className="flex gap-2">
              <button onClick={goToToday} className="text-xs px-2 py-1 bg-gray-100 rounded-lg hover:bg-gray-200">Aujourd'hui</button>
              <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-lg"><FiChevronLeft size={16} /></button>
              <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-lg"><FiChevronRight size={16} /></button>
            </div>
          </div>
          
          <div className="text-center mb-4">
            <span className="text-lg font-semibold">{months[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-xs font-medium text-gray-500 py-2">{day}</div>
            ))}
          </div>
          
          <div className="space-y-1">
            {calendar.map((week, weekIdx) => (
              <div key={weekIdx} className="grid grid-cols-7 gap-1">
                {week.map((day, dayIdx) => (
                  <div
                    key={dayIdx}
                    onClick={() => day && setSelectedDate(day.date)}
                    className={`min-h-[80px] p-1 rounded-lg cursor-pointer transition-colors ${
                      day && day.date.toDateString() === new Date().toDateString() ? 'bg-mutas-50 border border-mutas-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    {day && (
                      <>
                        <span className={`text-xs font-medium ${day.date.toDateString() === new Date().toDateString() ? 'text-mutas-600' : 'text-gray-700'}`}>
                          {day.day}
                        </span>
                        <div className="mt-1 space-y-0.5">
                          {day.counts.enAttente > 0 && (
                            <div className="text-[10px] flex items-center gap-1 text-purple-600">
                              <div className="w-2 h-2 rounded-full bg-purple-500" />
                              <span>{day.counts.enAttente} en attente</span>
                            </div>
                          )}
                          {day.counts.enCours > 0 && (
                            <div className="text-[10px] flex items-center gap-1 text-orange-600">
                              <div className="w-2 h-2 rounded-full bg-orange-500" />
                              <span>{day.counts.enCours} en cours</span>
                            </div>
                          )}
                          {day.counts.indemnisés > 0 && (
                            <div className="text-[10px] flex items-center gap-1 text-green-600">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              <span>{day.counts.indemnisés} indemnisés</span>
                            </div>
                          )}
                          {day.counts.rejetés > 0 && (
                            <div className="text-[10px] flex items-center gap-1 text-red-600">
                              <div className="w-2 h-2 rounded-full bg-red-500" />
                              <span>{day.counts.rejetés} rejetés</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Todoliste */}
      <motion.div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <FiCheckCircle /> Liste des tâches
          </h3>
          <button onClick={() => setShowTaskModal(true)} className="flex items-center gap-2 px-3 py-1 bg-mutas-500 text-white rounded-lg text-sm">
            <FiPlus size={14} /> Nouvelle tâche
          </button>
        </div>
        
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {tasks.map(task => (
            <div key={task.id} className="flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 flex-1">
                <button onClick={() => toggleTask(task.id)} className={`w-5 h-5 rounded border-2 flex items-center justify-center ${task.completed ? 'bg-mutas-500 border-mutas-500' : 'border-gray-300'}`}>
                  {task.completed && <FiCheck size={12} className="text-white" />}
                </button>
                <div className="flex-1">
                  <span className={`text-sm ${task.completed ? 'line-through text-gray-400' : ''}`}>{task.title}</span>
                  <div className="flex gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
                      {getPriorityLabel(task.priority)}
                    </span>
                    {task.dueDate && (
                      <span className={`text-xs flex items-center gap-1 ${new Date(task.dueDate) < new Date() && !task.completed ? 'text-red-500' : 'text-gray-500'}`}>
                        <FiClock size={10} /> {new Date(task.dueDate).toLocaleDateString()}
                        {task.reminder && <FiBell size={10} className="text-yellow-500" />}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => deleteTask(task.id)} className="text-red-400 hover:text-red-600">
                <FiTrash2 size={16} />
              </button>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="text-center py-8 text-gray-500">Aucune tâche. Créez-en une !</div>
          )}
        </div>
      </motion.div>

      {/* Modal Nouveau Sinistre */}
      <AnimatePresence>
        {showNewSinistreModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-8">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 p-5 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold">Nouvelle déclaration de sinistre</h2>
                <button onClick={() => setShowNewSinistreModal(false)}><FiX size={24} /></button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex gap-4 mb-4">
                  <button
                    onClick={() => setSinistreForm({...sinistreForm, type_declaration: 'PARTIEL'})}
                    className={`flex-1 py-2 rounded-lg border ${sinistreForm.type_declaration === 'PARTIEL' ? 'bg-mutas-500 text-white border-mutas-500' : 'border-gray-300'}`}
                  >
                    Déclaration partielle
                  </button>
                  <button
                    onClick={() => setSinistreForm({...sinistreForm, type_declaration: 'FINAL'})}
                    className={`flex-1 py-2 rounded-lg border ${sinistreForm.type_declaration === 'FINAL' ? 'bg-mutas-500 text-white border-mutas-500' : 'border-gray-300'}`}
                  >
                    Déclaration finale
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Type de sinistre *</label>
                    <select name="type" value={sinistreForm.type} onChange={handleSinistreChange} className="w-full px-3 py-2 border rounded-lg">
                      <option value="AUTO">Automobile</option>
                      <option value="HABITATION">Habitation</option>
                      <option value="SANTE">Santé</option>
                      <option value="VOYAGE">Voyage</option>
                      <option value="AUTRE">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Date de survenance *</label>
                    <input type="date" name="date_survenance" value={sinistreForm.date_survenance} onChange={handleSinistreChange} className="w-full px-3 py-2 border rounded-lg" required />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Lieu</label>
                    <input type="text" name="lieu" value={sinistreForm.lieu} onChange={handleSinistreChange} className="w-full px-3 py-2 border rounded-lg" placeholder="Adresse du sinistre" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Description *</label>
                    <textarea name="description" rows={4} value={sinistreForm.description} onChange={handleSinistreChange} className="w-full px-3 py-2 border rounded-lg" placeholder="Décrivez les circonstances du sinistre..." required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Montant estimé (FCFA)</label>
                    <input type="number" name="montant_estime" value={sinistreForm.montant_estime} onChange={handleSinistreChange} className="w-full px-3 py-2 border rounded-lg" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Pièces jointes</label>
                    <label className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <FiUpload /> Upload fichiers
                      <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                    </label>
                    {uploadedFiles.length > 0 && <p className="text-xs text-green-500 mt-1">{uploadedFiles.length} fichier(s) uploadé(s)</p>}
                  </div>
                </div>
              </div>
              
              <div className="p-5 border-t flex gap-3">
                <button onClick={handleSubmitSinistre} className="flex-1 bg-mutas-500 text-white py-2 rounded-lg">Soumettre la déclaration</button>
                <button onClick={() => setShowNewSinistreModal(false)} className="flex-1 border py-2 rounded-lg">Annuler</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Validation Sinistres */}
      <AnimatePresence>
        {showValidationModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 p-5 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold">Validation des sinistres</h2>
                <button onClick={() => setShowValidationModal(false)}><FiX size={24} /></button>
              </div>
              
              <div className="p-6">
                <div className="space-y-3">
                  {validationSinistres.map(sinistre => (
                    <div key={sinistre.id} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedSinistre(sinistre); setShowSinistreDetailModal(true); }}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-mono text-sm">{sinistre.numero || `SIN-${sinistre.id}`}</p>
                          <p className="text-sm text-gray-500">{sinistre.type_sinistre} - {new Date(sinistre.date_creation).toLocaleDateString()}</p>
                          <p className="text-sm mt-1">{sinistre.description?.substring(0, 100)}...</p>
                        </div>
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sinistre.statut)}`}>
                            {getStatusLabel(sinistre.statut)}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleValiderSinistre(sinistre.id, 'APPROUVE'); }}
                            className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                          >
                            Approuver
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); const motif = prompt('Motif du rejet:'); if (motif) handleValiderSinistre(sinistre.id, 'REJETE', motif); }}
                            className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                          >
                            Rejeter
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {validationSinistres.length === 0 && (
                    <div className="text-center py-8 text-gray-500">Aucun sinistre à valider</div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Détails Sinistre */}
      <AnimatePresence>
        {showSinistreDetailModal && selectedSinistre && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 p-5 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold">Détails du sinistre</h2>
                <button onClick={() => setShowSinistreDetailModal(false)}><FiX size={24} /></button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-sm text-gray-500">N° Sinistre</label><p className="font-mono">{selectedSinistre.numero || `SIN-${selectedSinistre.id}`}</p></div>
                  <div><label className="text-sm text-gray-500">Type</label><p>{selectedSinistre.type_sinistre || 'Non spécifié'}</p></div>
                  <div><label className="text-sm text-gray-500">Date de création</label><p>{new Date(selectedSinistre.date_creation).toLocaleString()}</p></div>
                  <div><label className="text-sm text-gray-500">Statut</label><p><span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(selectedSinistre.statut)}`}>{getStatusLabel(selectedSinistre.statut)}</span></p></div>
                  <div className="col-span-2"><label className="text-sm text-gray-500">Description</label><p className="mt-1">{selectedSinistre.description}</p></div>
                  <div><label className="text-sm text-gray-500">Montant estimé</label><p>{selectedSinistre.montant_estime?.toLocaleString()} FCFA</p></div>
                  <div><label className="text-sm text-gray-500">Déclarant</label><p>{selectedSinistre.declarant?.username || 'Non spécifié'}</p></div>
                </div>
                
                {selectedSinistre.statut === 'FINALISE' || selectedSinistre.statut === 'EN_ATTENTE_VALIDATION' ? (
                  <div className="flex gap-3 pt-4 border-t">
                    <button onClick={() => handleValiderSinistre(selectedSinistre.id, 'APPROUVE')} className="flex-1 bg-green-500 text-white py-2 rounded-lg">Approuver</button>
                    <button onClick={() => { const motif = prompt('Motif du rejet:'); if (motif) handleValiderSinistre(selectedSinistre.id, 'REJETE', motif); }} className="flex-1 bg-red-500 text-white py-2 rounded-lg">Rejeter</button>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Nouvelle Tâche */}
      <AnimatePresence>
        {showTaskModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-5 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold">Nouvelle tâche</h2>
                <button onClick={() => setShowTaskModal(false)}><FiX size={24} /></button>
              </div>
              
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Titre *</label>
                  <input type="text" value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="Ex: Valider les sinistres" autoFocus />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Priorité</label>
                  <select value={newTask.priority} onChange={(e) => setNewTask({...newTask, priority: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                    <option value="high">Haute</option>
                    <option value="medium">Moyenne</option>
                    <option value="low">Basse</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Date d'échéance</label>
                    <input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Heure</label>
                    <input type="time" value={newTask.dueTime} onChange={(e) => setNewTask({...newTask, dueTime: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                </div>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={newTask.reminder} onChange={(e) => setNewTask({...newTask, reminder: e.target.checked})} className="w-4 h-4 text-mutas-500 rounded" />
                  <span className="text-sm">Activer le rappel</span>
                </label>
              </div>
              
              <div className="p-5 border-t flex gap-3">
                <button onClick={addTask} className="flex-1 bg-mutas-500 text-white py-2 rounded-lg">Ajouter</button>
                <button onClick={() => setShowTaskModal(false)} className="flex-1 border py-2 rounded-lg">Annuler</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DashboardAdmin;