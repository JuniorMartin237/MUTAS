// src/components/Layout/Header.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiMessageSquare, FiSun, FiMoon, FiUser, FiSettings, FiLock, FiLogOut, FiGrid, FiCheckCircle, FiAlertCircle, FiClock } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { playNotificationSound } from '../../utils/sound';
import ThemeSwitcher from '../Theme/ThemeSwitcher';
import ColorSwitcher from '../Theme/ColorSwitcher';
import { sinistreService } from '../../services/sinistreService';
import toast from 'react-hot-toast';

function Header({ title }) {
  const { user, logout, lockSession } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const messagesRef = useRef(null);
  const colorRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Récupérer les notifications
  const fetchNotifications = async () => {
    setNotifLoading(true);
    try {
      // Appel API pour les notifications
      const response = await sinistreService.getNotifications?.() || { data: [] };
      const notifs = response.data || [];
      
      // Ajouter des notifications de démonstration si l'API n'est pas prête
      if (notifs.length === 0) {
        const demoNotifs = [
          { id: 1, type: 'sinistre', title: 'Nouveau sinistre déclaré', message: 'Le sinistre SIN-001 a été déclaré', read: false, time: 'il y a 2 min', link: '/sinistres', icon: 'alert' },
          { id: 2, type: 'validation', title: 'Validation requise', message: 'Votre validation est requise pour SIN-002', read: false, time: 'il y a 15 min', link: '/liste-declarations', icon: 'validation' },
          { id: 3, type: 'expertise', title: 'Expertise terminée', message: 'L\'expertise SIN-003 est terminée', read: true, time: 'il y a 1h', link: '/sinistres', icon: 'check' },
          { id: 4, type: 'message', title: 'Nouveau message', message: 'Vous avez reçu un nouveau message de l\'expert', read: false, time: 'il y a 2h', link: '/messages', icon: 'message' },
        ];
        setNotifications(demoNotifs);
      } else {
        setNotifications(notifs);
      }
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
      // Notifications de démonstration
      setNotifications([
        { id: 1, type: 'sinistre', title: 'Nouveau sinistre déclaré', message: 'Le sinistre SIN-001 a été déclaré', read: false, time: 'il y a 2 min', link: '/sinistres', icon: 'alert' },
        { id: 2, type: 'validation', title: 'Validation requise', message: 'Votre validation est requise pour SIN-002', read: false, time: 'il y a 15 min', link: '/liste-declarations', icon: 'validation' },
      ]);
    } finally {
      setNotifLoading(false);
    }
  };

  // Récupérer les messages
  const fetchMessages = async () => {
    setMessagesLoading(true);
    try {
      // Appel API pour les messages
      const response = await sinistreService.getMessages?.() || { data: [] };
      const msgs = response.data || [];
      
      if (msgs.length === 0) {
        const demoMessages = [
          { id: 1, from: 'Jean Dupont', subject: 'Question sur le sinistre SIN-001', message: 'Pouvez-vous me fournir plus d\'informations...', read: false, time: 'il y a 30 min', avatar: 'JD' },
          { id: 2, from: 'Expert Tribunal', subject: 'Rapport d\'expertise', message: 'Le rapport d\'expertise pour SIN-002 est disponible...', read: false, time: 'il y a 2h', avatar: 'ET' },
          { id: 3, from: 'Marie Claire', subject: 'Confirmation', message: 'Je confirme la réception des documents...', read: true, time: 'hier', avatar: 'MC' },
        ];
        setMessages(demoMessages);
      } else {
        setMessages(msgs);
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error);
      setMessages([
        { id: 1, from: 'Jean Dupont', subject: 'Question sur le sinistre SIN-001', message: 'Pouvez-vous me fournir plus d\'informations...', read: false, time: 'il y a 30 min', avatar: 'JD' },
        { id: 2, from: 'Expert Tribunal', subject: 'Rapport d\'expertise', message: 'Le rapport d\'expertise pour SIN-002 est disponible...', read: false, time: 'il y a 2h', avatar: 'ET' },
      ]);
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchMessages();

    // Intervalle pour rafraîchir les notifications toutes les 30 secondes
    const interval = setInterval(() => {
      fetchNotifications();
      fetchMessages();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const unreadNotifCount = notifications.filter(n => !n.read).length;
  const unreadMessagesCount = messages.filter(m => !m.read).length;

  const markNotificationAsRead = (id, link) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (link) {
      navigate(link);
    }
    setNotifOpen(false);
  };

  const markMessageAsRead = (id, link) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
    if (link) {
      navigate(link);
    }
    setMessagesOpen(false);
  };

  const handleNotificationClick = (notification) => {
    playNotificationSound();
    markNotificationAsRead(notification.id, notification.link);
  };

  const handleMessageClick = (message) => {
    markMessageAsRead(message.id, '/messages');
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'sinistre': return <FiAlertCircle className="text-yellow-500" />;
      case 'validation': return <FiCheckCircle className="text-blue-500" />;
      case 'expertise': return <FiClock className="text-purple-500" />;
      case 'message': return <FiMessageSquare className="text-green-500" />;
      default: return <FiBell className="text-gray-500" />;
    }
  };

  // Fermer les dropdowns quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
      if (messagesRef.current && !messagesRef.current.contains(event.target)) {
        setMessagesOpen(false);
      }
      if (colorRef.current && !colorRef.current.contains(event.target)) {
        setColorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-30 transition-colors duration-300">
      <div className="px-6 py-3 flex justify-between items-center">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl font-bold bg-gradient-to-r from-mutas-600 to-mutas-400 bg-clip-text text-transparent"
        >
          {title}
        </motion.h1>
        
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FiBell size={20} />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                </span>
              )}
            </button>
            
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl z-50 overflow-hidden border border-gray-200 dark:border-gray-700"
                >
                  <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadNotifCount > 0 && (
                      <button 
                        onClick={() => {
                          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                          toast.success('Toutes les notifications ont été marquées comme lues');
                        }}
                        className="text-xs text-mutas-500 hover:underline"
                      >
                        Tout marquer comme lu
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-mutas-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FiBell size={32} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Aucune notification</p>
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-700 ${
                            !notif.read ? 'bg-mutas-50 dark:bg-mutas-900/20' : ''
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className="flex-shrink-0">
                              {getNotificationIcon(notif.type)}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{notif.title}</p>
                              <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                            </div>
                            {!notif.read && (
                              <div className="w-2 h-2 bg-mutas-500 rounded-full flex-shrink-0 mt-2" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t border-gray-100 dark:border-gray-700 text-center">
                    <Link to="/notifications" className="text-xs text-mutas-500 hover:underline">Voir toutes les notifications</Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Messages */}
          <div className="relative" ref={messagesRef}>
            <button
              onClick={() => setMessagesOpen(!messagesOpen)}
              className="relative p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FiMessageSquare size={20} />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-mutas-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                </span>
              )}
            </button>
            
            <AnimatePresence>
              {messagesOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl z-50 overflow-hidden border border-gray-200 dark:border-gray-700"
                >
                  <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-semibold">Messages</h3>
                    {unreadMessagesCount > 0 && (
                      <button 
                        onClick={() => {
                          setMessages(prev => prev.map(m => ({ ...m, read: true })));
                          toast.success('Tous les messages ont été marqués comme lus');
                        }}
                        className="text-xs text-mutas-500 hover:underline"
                      >
                        Tout marquer comme lu
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {messagesLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-mutas-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FiMessageSquare size={32} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Aucun message</p>
                      </div>
                    ) : (
                      messages.map(msg => (
                        <div
                          key={msg.id}
                          onClick={() => handleMessageClick(msg)}
                          className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-700 ${
                            !msg.read ? 'bg-mutas-50 dark:bg-mutas-900/20' : ''
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-mutas-100 rounded-full flex items-center justify-center text-mutas-600 text-xs font-bold">
                                {msg.avatar || msg.from.charAt(0)}
                              </div>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{msg.from}</p>
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{msg.subject}</p>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{msg.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{msg.time}</p>
                            </div>
                            {!msg.read && (
                              <div className="w-2 h-2 bg-mutas-500 rounded-full flex-shrink-0 mt-2" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t border-gray-100 dark:border-gray-700 text-center">
                    <Link to="/messages" className="text-xs text-mutas-500 hover:underline">Voir tous les messages</Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Theme Switcher */}
          <ThemeSwitcher />
          
          {/* Couleurs */}
          <div className="relative" ref={colorRef}>
            <button
              onClick={() => setColorOpen(!colorOpen)}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FiGrid size={20} />
            </button>
            <AnimatePresence>
              {colorOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl z-50 p-3 border border-gray-200 dark:border-gray-700"
                >
                  <ColorSwitcher />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-mutas-600 dark:hover:text-mutas-400 transition-colors"
            >
              <div className="w-9 h-9 bg-gradient-to-r from-mutas-500 to-mutas-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </div>
            </button>
            
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-2 z-50 overflow-hidden border border-gray-200 dark:border-gray-700"
                >
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-semibold">{user?.first_name} {user?.last_name}</p>
                    <p className="text-xs text-gray-500">@{user?.username}</p>
                    <p className="text-xs text-mutas-500 mt-1 capitalize">{user?.user_type?.toLowerCase()}</p>
                  </div>
                  <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                    <FiUser size={16} /> Mon compte
                  </Link>
                  <button onClick={lockSession} className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left transition">
                    <FiLock size={16} /> Verrouiller ma session
                  </button>
                  {user?.user_type === 'ADMIN' && (
                    <Link to="/parametres" className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                      <FiSettings size={16} /> Paramètres
                    </Link>
                  )}
                  <button onClick={() => setColorOpen(true)} className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left transition">
                    <FiGrid size={16} /> Personnaliser interfaces
                  </button>
                  <hr className="my-1 border-gray-100 dark:border-gray-700" />
                  <button onClick={logout} className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left transition">
                    <FiLogOut size={16} /> Déconnexion
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;