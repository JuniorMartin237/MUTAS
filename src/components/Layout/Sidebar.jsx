import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiHome, FiFileText, FiUsers, FiFile, FiDollarSign, 
  FiSliders, FiUserCheck, FiShield, FiLogOut, FiBarChart2, 
  FiUserPlus, FiCreditCard
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import logo from '/logo.svg';

const menuItems = {
  SINISTRE: [
    { path: '/dashboard', icon: FiHome, label: 'Tableau de bord' },
    { path: '/mes-sinistres', icon: FiFileText, label: 'Mes sinistres' },
    { path: '/mes-contrats', icon: FiFile, label: 'Mes contrats' },
  ],
  DECLARANT: [
    { path: '/dashboard', icon: FiHome, label: 'Tableau de bord' },
    { path: '/sinistres', icon: FiFileText, label: 'Mes déclarations' },
    { path: '/capitalisation', icon: FiBarChart2, label: 'Capitalisation' },
    { path: '/clients', icon: FiUsers, label: 'Gestion des sinistrés' },
  ],
  VALIDATEUR: [
    { path: '/dashboard', icon: FiHome, label: 'Tableau de bord' },
    { path: '/sinistres', icon: FiFileText, label: 'Gestion des sinistres' },
    { path: '/capitalisation', icon: FiBarChart2, label: 'Capitalisation' },
    { path: '/gestion', icon: FiUserPlus, label: 'Gestion sinistrés' },
    { path: '/recouvrement', icon: FiCreditCard, label: 'Recouvrement' },
    { path: '/liste-declarations', icon: FiUserCheck, label: 'Validation' },
  ],
  EXPERT: [
    { path: '/dashboard', icon: FiHome, label: 'Tableau de bord' },
    { path: '/sinistres', icon: FiFileText, label: 'Gestion des sinistres' },
    { path: '/capitalisation', icon: FiBarChart2, label: 'Capitalisation' },
    { path: '/gestion', icon: FiUserPlus, label: 'Gestion sinistrés' },
    { path: '/indemnisation', icon: FiDollarSign, label: 'Indemnisation' },
    { path: '/liste-declarations', icon: FiUserCheck, label: 'Expertise' },
  ],
  DIRECTEUR: [
    { path: '/dashboard', icon: FiHome, label: 'Tableau de bord' },
    { path: '/sinistres', icon: FiFileText, label: 'Gestion des sinistres' },
    { path: '/capitalisation', icon: FiBarChart2, label: 'Capitalisation' },
    { path: '/gestion', icon: FiUserPlus, label: 'Gestion sinistrés' },
    { path: '/recouvrement', icon: FiCreditCard, label: 'Recouvrement' },
    { path: '/indemnisation', icon: FiDollarSign, label: 'Indemnisation' },
  ],
  ADMIN: [
    { path: '/dashboard', icon: FiHome, label: 'Tableau de bord' },
    { path: '/sinistres', icon: FiFileText, label: 'Gestion des sinistres' },
    { path: '/capitalisation', icon: FiBarChart2, label: 'Capitalisation' },
    { path: '/gestion', icon: FiUserPlus, label: 'Gestion sinistrés' },
    { path: '/recouvrement', icon: FiCreditCard, label: 'Recouvrement' },
    { path: '/indemnisation', icon: FiDollarSign, label: 'Indemnisation' },
    { path: '/utilisateurs', icon: FiUserCheck, label: 'Gestion des utilisateurs' },
    { path: '/logs', icon: FiShield, label: 'Gestion des logs' },
    { path: '/parametres', icon: FiSliders, label: 'Paramètres' },
  ],
};

function Sidebar() {
  const { user, logout } = useAuth();
  const { color } = useTheme();
  const location = useLocation();
  
  const menu = menuItems[user?.user_type || 'SINISTRE'] || menuItems.SINISTRE;

  const getSidebarGradient = () => {
    const gradients = {
      mutas: 'from-mutas-600 to-mutas-800',
      rose: 'from-rose-600 to-rose-800',
      citron: 'from-citron-600 to-citron-800',
      orange: 'from-orange-600 to-orange-800',
      rouge: 'from-rouge-600 to-rouge-800',
    };
    return gradients[color] || 'from-mutas-600 to-mutas-800';
  };

  const isActivePath = (path) => {
    if (path === '/sinistres') {
      return location.pathname === '/sinistres' || location.pathname.startsWith('/sinistres/');
    }
    return location.pathname === path;
  };

  return (
    <aside className={`w-64 bg-gradient-to-b ${getSidebarGradient()} text-white flex flex-col shadow-xl transition-all duration-300`}>
      <div className="p-5">
        <Link to="/dashboard" className="flex items-center justify-center group">
          <img src={logo} alt="MUTAS" className="h-12 w-auto brightness-0 invert" />
        </Link>
      </div>
      <div className="h-px bg-white/20 mx-4" />
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {menu.map((item, index) => {
          const Icon = item.icon;
          const isActive = isActivePath(item.path);
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={item.path}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                  isActive 
                    ? 'bg-white/20 text-white shadow-lg' 
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'scale-110' : ''}`} />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 w-1 h-8 bg-white rounded-r-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

    </aside>
  );
}

export default Sidebar;