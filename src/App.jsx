import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { MessageProvider } from './contexts/MessageContext';
import { useSessionMonitor } from './hooks/useSessionMonitor';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import LoginPage from './pages/Login/LoginPage';
import SessionLockedPage from './pages/SessionLockedPage';
import DashboardDeclarant from './pages/Dashboard/DashboardDeclarant';
import DashboardValidateur from './pages/Dashboard/DashboardValidateur';
import DashboardExpert from './pages/Dashboard/DashboardExpert';
import DashboardDirecteur from './pages/Dashboard/DashboardDirecteur';
import DashboardAdmin from './pages/Dashboard/DashboardAdmin';
import DashboardSinistre from './pages/Dashboard/DashboardSinistre';
import ListeDeclarations from './pages/Sinistres/ListeDeclarations';
import MesSinistres from './pages/Sinistres/MesSinistres';
import IndemnisationPage from './pages/Sinistres/IndemnisationPage';
import ParametresPage from './pages/Parametres/ParametresPage';
import GestionUtilisateurs from './pages/Admin/GestionUtilisateurs';
import GestionLogs from './pages/Admin/GestionLogs';
import MessagesPage from './pages/Messages/MessagesPage';
import ProfilePage from './pages/Profile/ProfilePage';
import MesContrats from './pages/Contrats/MesContrats';
import GestionClients from './pages/Admin/GestionClients';
import Capitalisation from './pages/Sinistres/Capitalisation';
import GestionSinistres from './pages/Sinistres/GestionSinistres';
import RecouvrementClient from './pages/Sinistres/RecouvrementClient';

function AppContent() {
  const { user } = useAuth();
  const { theme, color } = useTheme();
  useSessionMonitor();

  if (!user) return null;

  const getPageTitle = () => {
    const path = window.location.pathname;
    const titles = {
      '/dashboard': 'Tableau de bord',
      '/liste-declarations': 'Validation des sinistres',
      '/mes-sinistres': 'Mes sinistres',
      '/indemnisation': 'Indemnisation',
      '/parametres': 'Paramètres',
      '/logs': 'Gestion des Logs',
      '/profile': 'Mon Compte',
      '/utilisateurs': 'Gestion des Utilisateurs',
      '/messages': 'Messagerie',
      '/clients': 'Gestion des Clients',
      '/mes-contrats': 'Mes Contrats',
      '/sinistres': 'Gestion des sinistres',
      '/capitalisation': 'Capitalisation',
      '/gestion': 'Gestion des sinistrés',
      '/recouvrement': 'Recouvrement client',
    };
    return titles[path] || 'MUTAS';
  };

  const getDashboard = () => {
    switch (user?.user_type) {
      case 'DECLARANT': return <DashboardDeclarant />;
      case 'VALIDATEUR': return <DashboardValidateur />;
      case 'EXPERT': return <DashboardExpert />;
      case 'DIRECTEUR': return <DashboardDirecteur />;
      case 'ADMIN': return <DashboardAdmin />;
      default: return <DashboardSinistre />;
    }
  };

  const bgColorClass = {
    mutas: 'from-mutas-50 to-white',
    rose: 'from-rose-50 to-white',
    citron: 'from-citron-50 to-white',
    orange: 'from-orange-50 to-white',
    rouge: 'from-rouge-50 to-white',
  }[color] || 'from-mutas-50 to-white';

  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'dark' : ''}`}>
      <Sidebar />
      <div className={`flex-1 flex flex-col overflow-hidden bg-gradient-to-br ${bgColorClass} dark:from-gray-900 dark:to-gray-800`}>
        <Header title={getPageTitle()} />
        <main className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/dashboard" element={getDashboard()} />
            <Route path="/liste-declarations" element={<ListeDeclarations />} />
            <Route path="/mes-sinistres" element={<MesSinistres />} />
            <Route path="/indemnisation" element={<IndemnisationPage />} />
            <Route path="/parametres" element={<ParametresPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/mes-contrats" element={<MesContrats />} />
            <Route path="/utilisateurs" element={<GestionUtilisateurs />} />
            <Route path="/logs" element={<GestionLogs />} />
            <Route path="/clients" element={<GestionClients />} />
            <Route path="/sinistres" element={<ListeDeclarations />} />
            <Route path="/capitalisation" element={<Capitalisation />} />
            <Route path="/gestion" element={<GestionSinistres />} />
            <Route path="/recouvrement" element={<RecouvrementClient />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <MessageProvider>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  borderRadius: '12px',
                  background: '#fff',
                  color: '#333',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                },
                success: {
                  iconTheme: { primary: '#10B981', secondary: '#fff' },
                },
                error: {
                  iconTheme: { primary: '#EF4444', secondary: '#fff' },
                },
              }}
            />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/session-locked" element={<SessionLockedPage />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AppContent />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </MessageProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;