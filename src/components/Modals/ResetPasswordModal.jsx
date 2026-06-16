import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useValidation } from '../../hooks/useValidation';
import { validators } from '../../utils/validators';
import { playSuccessSound, playErrorSound } from '../../utils/sound';
import toast from 'react-hot-toast';

const passwordValidators = {
  old_password: (value) => validators.required(value),
  new_password: (value) => validators.passwordStrength(value) || validators.required(value),
  confirm_password: (value, values) => validators.confirmPassword(value, values?.new_password),
};

function ResetPasswordModal({ isOpen, onClose }) {
  const { resetPassword } = useAuth();
  const [showPassword, setShowPassword] = useState({ old: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    getFieldStatus,
    isValid,
  } = useValidation(passwordValidators);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid()) {
      toast.error('Veuillez corriger les erreurs du formulaire');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(values.old_password, values.new_password);
      playSuccessSound();
      toast.success('Mot de passe réinitialisé avec succès!', { duration: 3000 });
      onClose();
    } catch (error) {
      playErrorSound();
      toast.error('Une erreur s\'est produite! Veuillez réessayer plus tard');
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold bg-gradient-to-r from-mutas-600 to-mutas-400 bg-clip-text text-transparent">
                Réinitialiser le mot de passe
              </h2>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <FiX className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Ancien mot de passe */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Ancien mot de passe</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showPassword.old ? 'text' : 'password'}
                    name="old_password"
                    value={values.old_password || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full pl-10 pr-12 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 ${getInputStyles('old_password')}`}
                    placeholder="Entrez votre ancien mot de passe"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword({ ...showPassword, old: !showPassword.old })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword.old ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                {touched.old_password && errors.old_password && (
                  <p className="text-red-500 text-xs mt-1">{errors.old_password}</p>
                )}
              </div>
              
              {/* Nouveau mot de passe */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Nouveau mot de passe</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showPassword.new ? 'text' : 'password'}
                    name="new_password"
                    value={values.new_password || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full pl-10 pr-12 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 ${getInputStyles('new_password')}`}
                    placeholder="8 caractères min, avec chiffres et symboles"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword.new ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                {touched.new_password && errors.new_password && (
                  <p className="text-orange-500 text-xs mt-1">{errors.new_password}</p>
                )}
              </div>
              
              {/* Confirmer */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Confirmer le mot de passe</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showPassword.confirm ? 'text' : 'password'}
                    name="confirm_password"
                    value={values.confirm_password || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full pl-10 pr-12 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 ${getInputStyles('confirm_password')}`}
                    placeholder="Confirmez le nouveau mot de passe"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword.confirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                {touched.confirm_password && errors.confirm_password && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirm_password}</p>
                )}
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-mutas-500 to-mutas-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none"
              >
                {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ResetPasswordModal;