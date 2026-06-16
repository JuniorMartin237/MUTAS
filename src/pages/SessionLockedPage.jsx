import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiLock, FiUnlock } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function SessionLockedPage() {
  const { user, login } = useAuth();
  const { color } = useTheme();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getLoginGradient = () => {
    const gradients = {
      mutas: 'from-mutas-200 via-mutas-100 to-white',
      rose: 'from-rose-200 via-rose-100 to-white',
      citron: 'from-citron-200 via-citron-100 to-white',
      orange: 'from-orange-200 via-orange-100 to-white',
      rouge: 'from-rouge-200 via-rouge-100 to-white',
    };
    return gradients[color] || 'from-mutas-200 via-mutas-100 to-white';
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(user?.username, password, false);
      navigate('/dashboard');
    } catch (error) {
      toast.error('Mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getLoginGradient()} dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4`}>
      <motion.div
        initial={{ opacity: 0, y: -30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md p-8 border border-white/20"
      >
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-mutas-100 dark:bg-mutas-900/30 rounded-full flex items-center justify-center">
            <FiLock className="w-8 h-8 text-mutas-500" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-2">Session verrouillée</h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
          Veuillez saisir votre mot de passe pour déverrouiller votre session
        </p>
        
        <form onSubmit={handleUnlock} className="space-y-5">
          <div>
            <input
              type="password"
              placeholder="Votre mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-mutas-500 focus:border-mutas-500"
              autoFocus
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-mutas-500 to-mutas-600 text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50"
          >
            <FiUnlock />
            {loading ? 'Déverrouillage...' : 'Déverrouiller ma session'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default SessionLockedPage;