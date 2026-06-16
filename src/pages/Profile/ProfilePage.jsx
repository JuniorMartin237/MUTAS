import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUser, FiMail, FiPhone, FiMapPin, FiSave, FiShield, FiShieldOff, 
  FiCopy, FiCheck, FiLock, FiBell, FiSmartphone, FiKey, FiAlertCircle,
  FiEdit2, FiCamera, FiLogOut, FiRefreshCw, FiEye, FiEyeOff, FiUpload,
  FiTrash2, FiClock, FiActivity, FiServer, FiGlobe
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';
import toast from 'react-hot-toast';

function ProfilePage() {
  const { user, updateUser, changePassword, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
  });
  
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  
  const [showMfaModal, setShowMfaModal] = useState(false);
  const [mfaStep, setMfaStep] = useState('start');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaStatus, setMfaStatus] = useState({
    enabled: false,
    qrCode: '',
    secret: '',
    backupCodes: []
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true
  });
  
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [sessionInfo, setSessionInfo] = useState({
    last_login: null,
    last_activity: null,
    session_duration: null,
    devices: []
  });
  const [activeSessions, setActiveSessions] = useState([]);
  const [showSessionsModal, setShowSessionsModal] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
      });
      setNotificationSettings({
        email_notifications: user.email_notifications !== false,
        sms_notifications: user.sms_notifications || false,
        push_notifications: true
      });
      if (user.profile_image) {
        setProfileImagePreview(`http://localhost:8000${user.profile_image}`);
      }
    }
    fetchSessionInfo();
    fetchActiveSessions();
  }, [user]);

  const fetchSessionInfo = async () => {
    try {
      const response = await api.get('/accounts/session/info/');
      setSessionInfo(response.data);
    } catch (error) {
      console.error('Erreur session info:', error);
    }
  };

  const fetchActiveSessions = async () => {
    try {
      const response = await api.get('/accounts/sessions/');
      setActiveSessions(response.data);
    } catch (error) {
      console.error('Erreur sessions:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.put('/accounts/profile/update/', formData);
      await updateUser(response.data);
      toast.success('Profil mis à jour avec succès');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (passwordData.new_password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    setPasswordLoading(true);
    try {
      await changePassword(passwordData.old_password, passwordData.new_password, passwordData.confirm_password);
      toast.success('Mot de passe modifié avec succès');
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
      setShowPasswordForm(false);
    } catch (error) {
      toast.error(error.response?.data?.old_password || 'Ancien mot de passe incorrect');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
    setProfileImage(file);
    
    setUploadingImage(true);
    const formData = new FormData();
    formData.append('profile_image', file);
    
    try {
      const response = await api.post('/accounts/profile/upload-image/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await updateUser(response.data);
      toast.success('Photo de profil mise à jour');
    } catch (error) {
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEnableMFA = async () => {
    try {
      const response = await api.post('/accounts/mfa/enable/');
      setMfaStatus({
        enabled: false,
        qrCode: response.data.qr_code,
        secret: response.data.secret,
        backupCodes: response.data.backup_codes
      });
      setMfaStep('verify');
      setShowMfaModal(true);
    } catch (error) {
      toast.error('Erreur lors de l\'activation MFA');
    }
  };

  const handleVerifyMFA = async () => {
    if (!mfaCode || mfaCode.length !== 6) {
      toast.error('Veuillez entrer un code à 6 chiffres');
      return;
    }
    try {
      await api.post('/accounts/mfa/verify/', { code: mfaCode });
      toast.success('MFA activé avec succès');
      setShowMfaModal(false);
      setMfaCode('');
      setMfaStep('start');
      const response = await api.get('/accounts/profile/');
      await updateUser(response.data);
    } catch (error) {
      toast.error('Code invalide');
    }
  };

  const handleDisableMFA = async () => {
    const code = prompt('Entrez votre code MFA pour désactiver la double authentification:');
    if (code && code.length === 6) {
      try {
        await api.post('/accounts/mfa/disable/', { code });
        toast.success('MFA désactivé');
        const response = await api.get('/accounts/profile/');
        await updateUser(response.data);
      } catch (error) {
        toast.error('Code invalide');
      }
    } else if (code) {
      toast.error('Code à 6 chiffres requis');
    }
  };

  const handleUpdateNotifications = async (type, value) => {
    const newSettings = { ...notificationSettings, [type]: value };
    setNotificationSettings(newSettings);
    try {
      await api.patch('/accounts/profile/update/', {
        email_notifications: newSettings.email_notifications,
        sms_notifications: newSettings.sms_notifications
      });
      toast.success('Préférences de notification mises à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleRevokeSession = async (sessionId) => {
    if (window.confirm('Révoquer cette session ?')) {
      try {
        await api.post(`/accounts/sessions/${sessionId}/revoke/`);
        toast.success('Session révoquée');
        fetchActiveSessions();
      } catch (error) {
        toast.error('Erreur');
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié dans le presse-papier');
  };

  const getInitials = () => {
    return (formData.first_name?.charAt(0) || user?.username?.charAt(0) || 'U').toUpperCase();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Mon compte</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carte profil */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-28 h-28 bg-gradient-to-r from-mutas-500 to-mutas-600 rounded-full mx-auto flex items-center justify-center text-white text-4xl font-bold mb-4 shadow-lg overflow-hidden">
                  {profileImagePreview ? (
                    <img src={profileImagePreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    getInitials()
                  )}
                </div>
                <label className="absolute bottom-2 right-0 bg-gray-200 dark:bg-gray-700 p-2 rounded-full hover:bg-mutas-500 hover:text-white transition-colors cursor-pointer">
                  <FiCamera size={14} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                </label>
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <h2 className="text-xl font-semibold">{formData.first_name} {formData.last_name}</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-1">@{user?.username}</p>
              <p className="text-sm inline-block px-3 py-1 rounded-full bg-mutas-100 text-mutas-700 font-medium mb-4">
                {user?.user_type}
              </p>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Statut</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user?.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Sécurité MFA</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user?.mfa_enabled ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {user?.mfa_enabled ? 'Activé' : 'Désactivé'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Membre depuis</span>
                  <span className="text-xs">{new Date(user?.date_joined).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              {user?.mfa_enabled ? (
                <button onClick={handleDisableMFA} className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                  <FiShieldOff size={18} /> Désactiver MFA
                </button>
              ) : (
                <button onClick={handleEnableMFA} className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100">
                  <FiShield size={18} /> Activer MFA
                </button>
              )}
              
              <button onClick={() => setShowPasswordForm(!showPasswordForm)} className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                <FiKey size={18} /> Changer le mot de passe
              </button>
              
              <button onClick={() => setShowSessionsModal(true)} className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100">
                <FiActivity size={18} /> Sessions actives ({activeSessions.length})
              </button>
              
              <button onClick={logout} className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                <FiLogOut size={18} /> Déconnexion
              </button>
            </div>
          </div>
        </motion.div>

        {/* Formulaire informations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FiUser /> Informations personnelles</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Prénom</label><input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700" /></div>
                <div><label className="block text-sm font-medium mb-1">Nom</label><input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700" /></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700" required /></div>
              <div><label className="block text-sm font-medium mb-1">Téléphone</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700" placeholder="+237 6XX XXX XXX" /></div>
              <div><label className="block text-sm font-medium mb-1">Adresse</label><textarea name="address" rows={3} value={formData.address} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700" /></div>
              <button type="submit" disabled={loading} className="flex items-center gap-2 bg-mutas-500 text-white px-6 py-2 rounded-lg hover:bg-mutas-600 disabled:opacity-50"><FiSave size={18} />{loading ? 'Enregistrement...' : 'Enregistrer'}</button>
            </form>
          </div>

          {/* Changement mot de passe */}
          <AnimatePresence>
            {showPasswordForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 overflow-hidden">
                <h3 className="text-lg font-semibold mb-4"><FiLock /> Changer le mot de passe</h3>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div><label>Ancien mot de passe</label><input type={showOldPassword ? 'text' : 'password'} name="old_password" value={passwordData.old_password} onChange={handlePasswordChange} className="w-full px-3 py-2 border rounded-lg" required /></div>
                  <div><label>Nouveau mot de passe</label><input type={showPassword ? 'text' : 'password'} name="new_password" value={passwordData.new_password} onChange={handlePasswordChange} className="w-full px-3 py-2 border rounded-lg" required minLength={8} /></div>
                  <div><label>Confirmer</label><input type={showConfirmPassword ? 'text' : 'password'} name="confirm_password" value={passwordData.confirm_password} onChange={handlePasswordChange} className="w-full px-3 py-2 border rounded-lg" required /></div>
                  <div className="flex gap-3"><button type="submit" disabled={passwordLoading} className="bg-mutas-500 text-white px-4 py-2 rounded-lg">{passwordLoading ? 'Changement...' : 'Changer'}</button><button type="button" onClick={() => setShowPasswordForm(false)} className="border px-4 py-2 rounded-lg">Annuler</button></div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notifications */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4"><FiBell /> Préférences de notification</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer"><div><p className="font-medium">Notifications email</p><p className="text-sm text-gray-500">Recevoir des alertes par email</p></div><button type="button" onClick={() => handleUpdateNotifications('email_notifications', !notificationSettings.email_notifications)} className={`relative w-12 h-6 rounded-full transition-colors ${notificationSettings.email_notifications ? 'bg-mutas-500' : 'bg-gray-300'}`}><span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${notificationSettings.email_notifications ? 'right-1' : 'left-1'}`} /></button></label>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer"><div><p className="font-medium">Notifications SMS</p><p className="text-sm text-gray-500">Recevoir des alertes par SMS</p></div><button type="button" onClick={() => handleUpdateNotifications('sms_notifications', !notificationSettings.sms_notifications)} className={`relative w-12 h-6 rounded-full transition-colors ${notificationSettings.sms_notifications ? 'bg-mutas-500' : 'bg-gray-300'}`}><span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${notificationSettings.sms_notifications ? 'right-1' : 'left-1'}`} /></button></label>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modal MFA */}
      <AnimatePresence>
        {showMfaModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4">
              <div className="p-6 border-b"><h2 className="text-xl font-bold">Double authentification</h2></div>
              <div className="p-6">
                {mfaStep === 'verify' && (
                  <>
                    <div className="text-center mb-4"><p className="font-medium">Scannez ce QR code</p><p className="text-sm text-gray-500">Utilisez Google Authenticator</p></div>
                    {mfaStatus.qrCode && <div className="flex justify-center mb-4"><img src={`data:image/png;base64,${mfaStatus.qrCode}`} alt="QR Code" className="w-48 h-48 border rounded-lg p-2" /></div>}
                    <div className="bg-gray-50 p-3 rounded-lg mb-4"><p className="text-xs text-gray-500">Code secret</p><div className="flex justify-between"><code className="font-mono text-sm">{mfaStatus.secret}</code><button onClick={() => copyToClipboard(mfaStatus.secret)} className="text-mutas-500"><FiCopy size={16} /></button></div></div>
                    <input type="text" placeholder="Code à 6 chiffres" value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="w-full px-4 py-3 text-center text-2xl font-mono border rounded-lg mb-4" maxLength={6} autoFocus />
                    <button onClick={handleVerifyMFA} className="w-full bg-mutas-500 text-white py-2 rounded-lg">Vérifier et activer</button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Sessions */}
      <AnimatePresence>
        {showSessionsModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="p-5 border-b flex justify-between"><h2 className="text-xl font-bold">Sessions actives</h2><button onClick={() => setShowSessionsModal(false)}><FiX size={24} /></button></div>
              <div className="p-5 space-y-3">
                {activeSessions.map(session => (
                  <div key={session.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div><p className="font-medium">{session.device || 'Appareil inconnu'}</p><p className="text-xs text-gray-500">IP: {session.ip} • Dernière activité: {new Date(session.last_activity).toLocaleString()}</p></div>
                    {session.is_current ? <span className="text-green-500 text-sm">Session actuelle</span> : <button onClick={() => handleRevokeSession(session.id)} className="text-red-500 text-sm">Révoquer</button>}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ProfilePage;