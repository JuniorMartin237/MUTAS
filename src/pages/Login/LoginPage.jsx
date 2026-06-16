import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import ResetPasswordModal from '../../components/Modals/ResetPasswordModal';
import { useValidation } from '../../hooks/useValidation';
import { validators } from '../../utils/validators';
import { playErrorSound, playSuccessSound } from '../../utils/sound';
import toast from 'react-hot-toast';
import logo from '/logo.svg';

const loginValidators = {
  username: (value) => validators.username(value),
  password: (value) => validators.required(value),
};

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    getFieldStatus,
    isValid,
  } = useValidation(loginValidators);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid()) {
      playErrorSound();
      toast.error('Veuillez remplir correctement tous les champs');
      return;
    }
    setLoading(true);
    try {
      await login(values.username, values.password, remember);
      playSuccessSound();
      navigate('/dashboard');
    } catch (error) {
      playErrorSound();
      toast.error('Identifiants invalides');
    } finally {
      setLoading(false);
    }
  };

  const getInputStyles = (fieldName) => {
    const status = getFieldStatus(fieldName);
    if (status === 'error') return 'border-red-500 ring-red-200';
    if (status === 'warning') return 'border-orange-500 ring-orange-200';
    if (status === 'success') return 'border-green-500 ring-green-200';
    return 'border-gray-300 focus:border-mutas-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mutas-200 via-mutas-100 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md p-8 border border-white/20"
        >
          <div className="flex justify-center mb-6">
            <motion.img 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              src={logo} 
              alt="MUTAS" 
              className="h-16 w-auto" 
            />
          </div>
          
          <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-2">Connexion</h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-6">Accédez à votre espace MUTAS</p>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Nom d'utilisateur</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  name="username"
                  value={values.username || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 pr-3 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 ${getInputStyles('username')}`}
                  placeholder="Entrez votre nom d'utilisateur"
                />
              </div>
              {touched.username && errors.username && (
                <p className="text-red-500 text-xs mt-1">{errors.username}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Mot de passe</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={values.password || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 pr-12 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 ${getInputStyles('password')}`}
                  placeholder="Entrez votre mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>
            
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-gray-300 text-mutas-500 focus:ring-mutas-400"
                />
                Mémoriser mes identifiants
              </label>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="text-sm text-mutas-600 dark:text-mutas-400 hover:underline"
              >
                Mot de passe oublié ?
              </button>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-mutas-500 to-mutas-600 text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connexion...
                </div>
              ) : 'Se connecter'}
            </motion.button>
          </form>
        </motion.div>
      </div>
      
      <footer className="py-4 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>
          &copy; {new Date().getFullYear()} 
          {' '}
          <a href="mailto:juniorbaketegmartin@gmail.com" className="text-mutas-600 dark:text-mutas-400 hover:underline">
            Junior Martin
          </a>
          {' '}- Tous droits réservés | Version 2.5.0
        </p>
      </footer>
      
      <ResetPasswordModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

export default LoginPage;