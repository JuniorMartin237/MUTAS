import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { FiPlus, FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';
import api from '../../api/client';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

function DashboardDeclarant() {
  const [stats, setStats] = useState({
    total: 0,
    enCours: 0,
    valides: 0,
    rejetes: 0,
  });
  const [sinistres, setSinistres] = useState([]);
  const [taches, setTaches] = useState([
    { id: 1, titre: 'Finaliser déclaration SIN-001', assignee: 'Moi', statut: 'en_cours' },
    { id: 2, titre: 'Transmettre documents pour SIN-002', assignee: 'Validateur', statut: 'termine' },
  ]);
  const [nouvelleTache, setNouvelleTache] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/sinistres/');
      const data = response.data;
      setSinistres(data);
      setStats({
        total: data.length,
        enCours: data.filter(s => s.status !== 'CLOSED' && s.status !== 'INDEMNISE').length,
        valides: data.filter(s => s.status === 'APPROVED').length,
        rejetes: data.filter(s => s.status === 'REJECTED').length,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const ajouterTache = () => {
    if (nouvelleTache.trim()) {
      setTaches([...taches, { id: Date.now(), titre: nouvelleTache, assignee: 'Moi', statut: 'en_cours' }]);
      setNouvelleTache('');
    }
  };

  const chartData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
    datasets: [
      {
        label: 'Sinistres déclarés',
        data: [12, 19, 15, 17, 22, 18],
        backgroundColor: '#0EA5E9',
        borderRadius: 8,
      },
    ],
  };

  const pieData = {
    labels: ['En cours', 'Validés', 'Rejetés'],
    datasets: [
      {
        data: [stats.enCours, stats.valides, stats.rejetes],
        backgroundColor: ['#F59E0B', '#10B981', '#EF4444'],
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total sinistres</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-mutas-blue/10 rounded-full flex items-center justify-center">
              <FiAlertCircle className="text-mutas-blue" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">En cours</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.enCours}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <FiClock className="text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Validés</p>
              <p className="text-2xl font-bold text-green-600">{stats.valides}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <FiCheckCircle className="text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow">
          <Link to="/sinistre/new" className="block h-full">
            <div className="flex items-center justify-between p-4 bg-mutas-blue rounded-lg text-white hover:bg-mutas-sky transition-colors h-full">
              <div>
                <p className="text-sm">Déclarer un sinistre</p>
                <p className="text-lg font-bold">Nouvelle déclaration</p>
              </div>
              <FiPlus className="w-8 h-8" />
            </div>
          </Link>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-4">Évolution des sinistres</h3>
          <Bar data={chartData} options={{ responsive: true }} />
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-4">Répartition des sinistres</h3>
          <Pie data={pieData} options={{ responsive: true }} />
        </div>
      </div>
      
      {/* TodoList, Calendrier, Sinistres en cours */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TodoList */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-3">Tâches à faire</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {taches.map(tache => (
              <div key={tache.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <input type="checkbox" className="rounded" />
                <span className={`flex-1 text-sm ${tache.statut === 'termine' ? 'line-through text-gray-400' : ''}`}>
                  {tache.titre}
                </span>
                <span className="text-xs text-gray-500">{tache.assignee}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              placeholder="Nouvelle tâche..."
              value={nouvelleTache}
              onChange={(e) => setNouvelleTache(e.target.value)}
              className="flex-1 px-2 py-1 border rounded text-sm"
            />
            <button onClick={ajouterTache} className="bg-mutas-blue text-white px-3 py-1 rounded text-sm">Ajouter</button>
          </div>
        </div>
        
        {/* Calendrier simplifié */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-3">Calendrier</h3>
          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(day => (
              <div key={day} className="font-semibold text-gray-500">{day}</div>
            ))}
            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
              <div key={day} className={`p-1 rounded ${day === 15 ? 'bg-mutas-blue text-white' : 'hover:bg-gray-100'}`}>
                {day}
              </div>
            ))}
          </div>
        </div>
        
        {/* Liste des sinistres en cours */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-3">Sinistres en cours</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sinistres.filter(s => s.status !== 'CLOSED').slice(0, 5).map(sinistre => (
              <Link key={sinistre.id} to={`/sinistre/${sinistre.id}`} className="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-gray-100">
                <div>
                  <p className="font-medium text-sm">{sinistre.reference}</p>
                  <p className="text-xs text-gray-500">{sinistre.type_sinistre}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  sinistre.status === 'DECLARE' ? 'bg-yellow-100 text-yellow-800' :
                  sinistre.status === 'VALIDATION' ? 'bg-blue-100 text-blue-800' :
                  sinistre.status === 'INDEMNISE' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>{sinistre.status}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardDeclarant;