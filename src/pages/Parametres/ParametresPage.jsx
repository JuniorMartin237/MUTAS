import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSave, FiRefreshCw, FiGlobe, FiBell, FiShield, FiUsers, 
  FiDatabase, FiMail, FiSmartphone, FiEye, FiEyeOff, FiCheck,
  FiAlertTriangle, FiSettings, FiSliders, FiLock, FiUserCheck,
  FiClock, FiCalendar, FiDownload, FiUpload, FiTrash2, FiImage,
  FiPlus, FiChevronUp, FiChevronDown, FiMessageSquare, FiX,
  FiHelpCircle, FiServer, FiCloud, FiPrinter
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../api/client';
import toast from 'react-hot-toast';

function ParametresPage() {
  const { user, isAdmin } = useAuth();
  const { theme, toggleTheme, color, setColor } = useTheme();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  // Configuration système
  const [systemConfig, setSystemConfig] = useState({
    appName: 'MUTAS',
    slogan: 'Gestion intelligente des sinistres',
    description: 'Plateforme complète de gestion du cycle de vie des sinistres',
    companyName: 'MUTAS Assurance',
    companyEmail: 'contact@mutas.com',
    companyPhone: '+237 6XX XXX XXX',
    supportEmail: 'support@mutas.com',
    logo_url: null
  });
  
  // Configuration workflow
  const [workflowConfig, setWorkflowConfig] = useState({
    autoValidation: false,
    validationLevels: 2,
    expertRequired: true,
    directorApproval: true,
    maxDaysForDeclaration: 30,
    autoArchiveDays: 90,
  });
  
  // Ordre hiérarchique
  const [hierarchyOrder, setHierarchyOrder] = useState([
    { id: 1, role: 'DECLARANT', name: 'Déclarant', level: 1, next: 'VALIDATEUR' },
    { id: 2, role: 'VALIDATEUR', name: 'Validateur', level: 2, next: 'EXPERT' },
    { id: 3, role: 'EXPERT', name: 'Expert', level: 3, next: 'DIRECTEUR' },
    { id: 4, role: 'DIRECTEUR', name: 'Directeur', level: 4, next: null },
  ]);
  
  // Motifs de rejet
  const [rejectionReasons, setRejectionReasons] = useState([
    'Dossier incomplet',
    'Pièces justificatives manquantes',
    'Non couvert par la police',
    'Franchise non atteinte',
    'Délai de déclaration dépassé',
  ]);
  const [newRejectionReason, setNewRejectionReason] = useState('');
  
  // Configuration sécurité
  const [securityConfig, setSecurityConfig] = useState({
    sessionTimeout: 300,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireMfaForAdmin: true,
    sessionLockOnInactivity: true,
    twoFactorAuthEnabled: true,
  });
  
  // Configuration notifications
  const [notifConfig, setNotifConfig] = useState({
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    dailyDigest: false,
    notifyOnStatusChange: true,
    notifyOnAssignment: true,
    notifyOnValidation: true,
  });
  
  // Configuration exports
  const [exportConfig, setExportConfig] = useState({
    defaultFormat: 'excel',
    includeHeaders: true,
    dateFormat: 'dd/MM/yyyy',
    maxRowsExport: 10000,
    autoExportEnabled: false,
    autoExportFrequency: 'weekly',
  });
  
  // Couleurs disponibles
  const colors = [
    { id: 'mutas', name: 'Bleu MUTAS', color: '#0EA5E9', bgClass: 'bg-mutas-500' },
    { id: 'rose', name: 'Rose', color: '#F43F5E', bgClass: 'bg-rose-500' },
    { id: 'citron', name: 'Citron', color: '#A3E635', bgClass: 'bg-citron-500' },
    { id: 'orange', name: 'Orange', color: '#F97316', bgClass: 'bg-orange-500' },
    { id: 'rouge', name: 'Rouge', color: '#EF4444', bgClass: 'bg-red-500' },
  ];

  useEffect(() => {
    loadConfigurations();
    loadLogo();
  }, []);

  const loadConfigurations = async () => {
    try {
      const response = await api.get('/settings/config/');
      if (response.data) {
        setSystemConfig(prev => ({ ...prev, ...response.data.system }));
        setWorkflowConfig(prev => ({ ...prev, ...response.data.workflow }));
        setSecurityConfig(prev => ({ ...prev, ...response.data.security }));
        setNotifConfig(prev => ({ ...prev, ...response.data.notifications }));
        setExportConfig(prev => ({ ...prev, ...response.data.exports }));
        if (response.data.hierarchy) setHierarchyOrder(response.data.hierarchy);
        if (response.data.rejection_reasons) setRejectionReasons(response.data.rejection_reasons);
      }
    } catch (error) {
      console.error('Erreur chargement config:', error);
    }
  };

  const loadLogo = async () => {
    try {
      const response = await api.get('/settings/logo/');
      if (response.data.logo_url) {
        setLogoPreview(`http://localhost:8000${response.data.logo_url}`);
        setSystemConfig(prev => ({ ...prev, logo_url: response.data.logo_url }));
      }
    } catch (error) {
      console.error('Erreur chargement logo:', error);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Le logo ne doit pas dépasser 2MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
    setLogoFile(file);
  };

  const saveLogo = async () => {
    if (!logoFile) return;
    
    setUploadingLogo(true);
    const formData = new FormData();
    formData.append('logo', logoFile);
    
    try {
      const response = await api.post('/settings/upload-logo/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSystemConfig(prev => ({ ...prev, logo_url: response.data.logo_url }));
      toast.success('Logo mis à jour');
    } catch (error) {
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSystemSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/settings/config/system/', systemConfig);
      toast.success('Configuration système enregistrée');
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkflowSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/settings/config/workflow/', workflowConfig);
      await api.post('/settings/config/hierarchy/', hierarchyOrder);
      await api.post('/settings/config/rejection-reasons/', rejectionReasons);
      toast.success('Configuration workflow enregistrée');
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/settings/config/security/', securityConfig);
      toast.success('Configuration sécurité enregistrée');
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const handleNotifSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/settings/config/notifications/', notifConfig);
      toast.success('Configuration notifications enregistrée');
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const handleExportSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/settings/config/exports/', exportConfig);
      toast.success('Configuration exports enregistrée');
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSettings = async () => {
    if (window.confirm('⚠️ Attention : Cette action va réinitialiser tous les paramètres par défaut. Continuer ?')) {
      try {
        await api.post('/settings/config/reset/');
        toast.success('Paramètres réinitialisés');
        loadConfigurations();
      } catch (error) {
        toast.error('Erreur lors de la réinitialisation');
      }
    }
  };

  const handleExportData = async () => {
    try {
      const response = await api.get('/settings/export/data/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `mutas_export_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export des données réussi');
    } catch (error) {
      toast.error('Erreur lors de l\'export');
    }
  };

  const handleClearCache = async () => {
    if (window.confirm('Vider le cache de l\'application ?')) {
      try {
        localStorage.clear();
        sessionStorage.clear();
        toast.success('Cache vidé, l\'application va se recharger');
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        toast.error('Erreur');
      }
    }
  };

  const moveHierarchyUp = (index) => {
    if (index === 0) return;
    const newHierarchy = [...hierarchyOrder];
    [newHierarchy[index - 1], newHierarchy[index]] = [newHierarchy[index], newHierarchy[index - 1]];
    setHierarchyOrder(newHierarchy);
  };

  const moveHierarchyDown = (index) => {
    if (index === hierarchyOrder.length - 1) return;
    const newHierarchy = [...hierarchyOrder];
    [newHierarchy[index + 1], newHierarchy[index]] = [newHierarchy[index], newHierarchy[index + 1]];
    setHierarchyOrder(newHierarchy);
  };

  const addRejectionReason = () => {
    if (newRejectionReason.trim()) {
      setRejectionReasons([...rejectionReasons, newRejectionReason.trim()]);
      setNewRejectionReason('');
    }
  };

  const removeRejectionReason = (index) => {
    setRejectionReasons(rejectionReasons.filter((_, i) => i !== index));
  };

  if (!isAdmin()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FiShield className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Accès réservé aux administrateurs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <button onClick={handleResetSettings} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
          <FiRefreshCw size={16} /> Réinitialiser
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'general', name: 'Général', icon: FiGlobe },
          { id: 'workflow', name: 'Workflow', icon: FiSliders },
          { id: 'security', name: 'Sécurité', icon: FiShield },
          { id: 'notifications', name: 'Notifications', icon: FiBell },
          { id: 'exports', name: 'Exports', icon: FiDownload },
          { id: 'appearance', name: 'Apparence', icon: FiEye },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-mutas-500 text-mutas-500'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon size={18} /> {tab.name}
          </button>
        ))}
      </div>

      {/* Onglet Général */}
      {activeTab === 'general' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FiGlobe /> Configuration générale</h2>
          <form onSubmit={handleSystemSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Nom de l'application</label><input type="text" value={systemConfig.appName} onChange={(e) => setSystemConfig({...systemConfig, appName: e.target.value})} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700" /></div>
              <div><label className="block text-sm font-medium mb-1">Slogan</label><input type="text" value={systemConfig.slogan} onChange={(e) => setSystemConfig({...systemConfig, slogan: e.target.value})} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700" /></div>
              <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Description</label><textarea maxLength={100} value={systemConfig.description} onChange={(e) => setSystemConfig({...systemConfig, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700" rows={2} /><p className="text-xs text-gray-500 mt-1">{systemConfig.description.length}/100 caractères</p></div>
              <div><label className="block text-sm font-medium mb-1">Nom de l'entreprise</label><input type="text" value={systemConfig.companyName} onChange={(e) => setSystemConfig({...systemConfig, companyName: e.target.value})} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700" /></div>
              <div><label className="block text-sm font-medium mb-1">Email de contact</label><input type="email" value={systemConfig.companyEmail} onChange={(e) => setSystemConfig({...systemConfig, companyEmail: e.target.value})} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700" /></div>
              <div><label className="block text-sm font-medium mb-1">Téléphone</label><input type="tel" value={systemConfig.companyPhone} onChange={(e) => setSystemConfig({...systemConfig, companyPhone: e.target.value})} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700" /></div>
              <div><label className="block text-sm font-medium mb-1">Email support</label><input type="email" value={systemConfig.supportEmail} onChange={(e) => setSystemConfig({...systemConfig, supportEmail: e.target.value})} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700" /></div>
              
              {/* Upload Logo */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Logo de l'application</label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                    ) : systemConfig.logo_url ? (
                      <img src={`http://localhost:8000${systemConfig.logo_url}`} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <FiImage className="text-gray-400 text-3xl" />
                    )}
                  </div>
                  <div>
                    <label className="cursor-pointer bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2">
                      <FiUpload size={16} /> Choisir un logo
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    </label>
                    {logoFile && (
                      <button onClick={saveLogo} disabled={uploadingLogo} className="ml-2 bg-mutas-500 text-white px-4 py-2 rounded-lg hover:bg-mutas-600 disabled:opacity-50">
                        {uploadingLogo ? 'Upload...' : 'Enregistrer'}
                      </button>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Format recommandé: PNG, 200x200px, max 2MB</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end"><button type="submit" disabled={loading} className="flex items-center gap-2 bg-mutas-500 text-white px-6 py-2 rounded-lg"><FiSave /> {loading ? 'Enregistrement...' : 'Enregistrer'}</button></div>
          </form>
        </motion.div>
      )}

      {/* Onglet Workflow */}
      {activeTab === 'workflow' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FiSliders /> Configuration du workflow</h2>
            <form onSubmit={handleWorkflowSubmit} className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer"><div><p className="font-medium">Validation automatique</p><p className="text-sm text-gray-500">Les sinistres sont validés automatiquement</p></div><button type="button" onClick={() => setWorkflowConfig({...workflowConfig, autoValidation: !workflowConfig.autoValidation})} className={`relative w-12 h-6 rounded-full transition-colors ${workflowConfig.autoValidation ? 'bg-mutas-500' : 'bg-gray-300'}`}><span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${workflowConfig.autoValidation ? 'right-1' : 'left-1'}`} /></button></label>
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer"><div><p className="font-medium">Expertise obligatoire</p><p className="text-sm text-gray-500">Tout sinistre doit passer par un expert</p></div><button type="button" onClick={() => setWorkflowConfig({...workflowConfig, expertRequired: !workflowConfig.expertRequired})} className={`relative w-12 h-6 rounded-full transition-colors ${workflowConfig.expertRequired ? 'bg-mutas-500' : 'bg-gray-300'}`}><span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${workflowConfig.expertRequired ? 'right-1' : 'left-1'}`} /></button></label>
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer"><div><p className="font-medium">Validation direction obligatoire</p><p className="text-sm text-gray-500">Approbation de la direction requise</p></div><button type="button" onClick={() => setWorkflowConfig({...workflowConfig, directorApproval: !workflowConfig.directorApproval})} className={`relative w-12 h-6 rounded-full transition-colors ${workflowConfig.directorApproval ? 'bg-mutas-500' : 'bg-gray-300'}`}><span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${workflowConfig.directorApproval ? 'right-1' : 'left-1'}`} /></button></label>
                
                <div className="p-3 bg-gray-50 rounded-lg"><label className="block text-sm font-medium mb-2">Niveaux de validation</label><select value={workflowConfig.validationLevels} onChange={(e) => setWorkflowConfig({...workflowConfig, validationLevels: parseInt(e.target.value)})} className="w-full px-3 py-2 border rounded-lg"><option value={1}>1 niveau</option><option value={2}>2 niveaux</option><option value={3}>3 niveaux</option></select></div>
                <div className="p-3 bg-gray-50 rounded-lg"><label className="block text-sm font-medium mb-2">Délai max de déclaration (jours)</label><input type="number" min={1} max={365} value={workflowConfig.maxDaysForDeclaration} onChange={(e) => setWorkflowConfig({...workflowConfig, maxDaysForDeclaration: parseInt(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div className="p-3 bg-gray-50 rounded-lg"><label className="block text-sm font-medium mb-2">Archivage automatique après (jours)</label><input type="number" min={30} max={730} value={workflowConfig.autoArchiveDays} onChange={(e) => setWorkflowConfig({...workflowConfig, autoArchiveDays: parseInt(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" /></div>
              </div>
              
              {/* Ordre hiérarchique */}
              <div className="mt-6 pt-4 border-t"><h3 className="font-medium mb-3 flex items-center gap-2"><FiUsers /> Ordre hiérarchique de validation</h3><div className="space-y-2">{hierarchyOrder.map((item, index) => (<div key={item.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"><div className="flex-1"><span className="font-medium">{item.name}</span><span className="text-xs text-gray-500 ml-2">({item.role})</span></div><div className="flex gap-1"><button onClick={() => moveHierarchyUp(index)} className="p-1 hover:bg-gray-200 rounded"><FiChevronUp size={16} /></button><button onClick={() => moveHierarchyDown(index)} className="p-1 hover:bg-gray-200 rounded"><FiChevronDown size={16} /></button></div><div className="text-sm text-gray-500">→ {item.next ? hierarchyOrder.find(h => h.role === item.next)?.name || item.next : 'Fin'}</div></div>))}</div></div>
              
              {/* Motifs de rejet */}
              <div className="mt-6 pt-4 border-t"><h3 className="font-medium mb-3 flex items-center gap-2"><FiMessageSquare /> Motifs de rejet des déclarations</h3><div className="space-y-2">{rejectionReasons.map((reason, index) => (<div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded-lg"><span className="text-sm">{reason}</span><button onClick={() => removeRejectionReason(index)} className="text-red-500 hover:text-red-700"><FiTrash2 size={16} /></button></div>))}<div className="flex gap-2 mt-2"><input type="text" value={newRejectionReason} onChange={(e) => setNewRejectionReason(e.target.value)} placeholder="Nouveau motif de rejet..." className="flex-1 px-3 py-2 border rounded-lg" /><button onClick={addRejectionReason} className="bg-mutas-500 text-white px-4 py-2 rounded-lg"><FiPlus /> Ajouter</button></div></div></div>
              
              <div className="flex justify-end"><button type="submit" disabled={loading} className="flex items-center gap-2 bg-mutas-500 text-white px-6 py-2 rounded-lg"><FiSave /> {loading ? 'Enregistrement...' : 'Enregistrer'}</button></div>
            </form>
          </div>
        </motion.div>
      )}

      {/* Onglet Sécurité */}
      {activeTab === 'security' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FiLock /> Configuration sécurité</h2>
          <form onSubmit={handleSecuritySubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg"><label className="block text-sm font-medium mb-2">Délai d'inactivité (secondes)</label><input type="number" min={60} max={1800} step={30} value={securityConfig.sessionTimeout} onChange={(e) => setSecurityConfig({...securityConfig, sessionTimeout: parseInt(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" /><p className="text-xs text-gray-500 mt-1">Actuel: {Math.floor(securityConfig.sessionTimeout / 60)} minutes</p></div>
              <div className="p-3 bg-gray-50 rounded-lg"><label className="block text-sm font-medium mb-2">Tentatives de connexion max</label><input type="number" min={3} max={10} value={securityConfig.maxLoginAttempts} onChange={(e) => setSecurityConfig({...securityConfig, maxLoginAttempts: parseInt(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div className="p-3 bg-gray-50 rounded-lg"><label className="block text-sm font-medium mb-2">Longueur minimale mot de passe</label><input type="number" min={6} max={20} value={securityConfig.passwordMinLength} onChange={(e) => setSecurityConfig({...securityConfig, passwordMinLength: parseInt(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" /></div>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer"><div><p className="font-medium">MFA obligatoire pour admins</p><p className="text-sm text-gray-500">Double authentification requise</p></div><button type="button" onClick={() => setSecurityConfig({...securityConfig, requireMfaForAdmin: !securityConfig.requireMfaForAdmin})} className={`relative w-12 h-6 rounded-full transition-colors ${securityConfig.requireMfaForAdmin ? 'bg-mutas-500' : 'bg-gray-300'}`}><span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${securityConfig.requireMfaForAdmin ? 'right-1' : 'left-1'}`} /></button></label>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer"><div><p className="font-medium">Verrouillage session sur inactivité</p><p className="text-sm text-gray-500">Verrouiller après inactivité</p></div><button type="button" onClick={() => setSecurityConfig({...securityConfig, sessionLockOnInactivity: !securityConfig.sessionLockOnInactivity})} className={`relative w-12 h-6 rounded-full transition-colors ${securityConfig.sessionLockOnInactivity ? 'bg-mutas-500' : 'bg-gray-300'}`}><span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${securityConfig.sessionLockOnInactivity ? 'right-1' : 'left-1'}`} /></button></label>
            </div>
            <div className="flex justify-end"><button type="submit" disabled={loading} className="flex items-center gap-2 bg-mutas-500 text-white px-6 py-2 rounded-lg"><FiSave /> {loading ? 'Enregistrement...' : 'Enregistrer'}</button></div>
          </form>
        </motion.div>
      )}

      {/* Onglet Notifications */}
      {activeTab === 'notifications' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FiBell /> Configuration des notifications</h2>
          <form onSubmit={handleNotifSubmit} className="space-y-4">
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer"><div><p className="font-medium flex items-center gap-2"><FiMail /> Notifications email</p><p className="text-sm text-gray-500">Envoyer des notifications par email</p></div><button type="button" onClick={() => setNotifConfig({...notifConfig, emailEnabled: !notifConfig.emailEnabled})} className={`relative w-12 h-6 rounded-full transition-colors ${notifConfig.emailEnabled ? 'bg-mutas-500' : 'bg-gray-300'}`}><span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${notifConfig.emailEnabled ? 'right-1' : 'left-1'}`} /></button></label>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer"><div><p className="font-medium flex items-center gap-2"><FiSmartphone /> Notifications SMS</p><p className="text-sm text-gray-500">Envoyer des notifications par SMS</p></div><button type="button" onClick={() => setNotifConfig({...notifConfig, smsEnabled: !notifConfig.smsEnabled})} className={`relative w-12 h-6 rounded-full transition-colors ${notifConfig.smsEnabled ? 'bg-mutas-500' : 'bg-gray-300'}`}><span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${notifConfig.smsEnabled ? 'right-1' : 'left-1'}`} /></button></label>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer"><div><p className="font-medium">Notifications push</p><p className="text-sm text-gray-500">Notifications en temps réel</p></div><button type="button" onClick={() => setNotifConfig({...notifConfig, pushEnabled: !notifConfig.pushEnabled})} className={`relative w-12 h-6 rounded-full transition-colors ${notifConfig.pushEnabled ? 'bg-mutas-500' : 'bg-gray-300'}`}><span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${notifConfig.pushEnabled ? 'right-1' : 'left-1'}`} /></button></label>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer"><div><p className="font-medium">Récapitulatif quotidien</p><p className="text-sm text-gray-500">Résumé des activités chaque jour</p></div><button type="button" onClick={() => setNotifConfig({...notifConfig, dailyDigest: !notifConfig.dailyDigest})} className={`relative w-12 h-6 rounded-full transition-colors ${notifConfig.dailyDigest ? 'bg-mutas-500' : 'bg-gray-300'}`}><span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${notifConfig.dailyDigest ? 'right-1' : 'left-1'}`} /></button></label>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer"><div><p className="font-medium">Notification changement de statut</p><p className="text-sm text-gray-500">Être notifié des changements de statut</p></div><button type="button" onClick={() => setNotifConfig({...notifConfig, notifyOnStatusChange: !notifConfig.notifyOnStatusChange})} className={`relative w-12 h-6 rounded-full transition-colors ${notifConfig.notifyOnStatusChange ? 'bg-mutas-500' : 'bg-gray-300'}`}><span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${notifConfig.notifyOnStatusChange ? 'right-1' : 'left-1'}`} /></button></label>
            </div>
            <div className="flex justify-end"><button type="submit" disabled={loading} className="flex items-center gap-2 bg-mutas-500 text-white px-6 py-2 rounded-lg"><FiSave /> {loading ? 'Enregistrement...' : 'Enregistrer'}</button></div>
          </form>
        </motion.div>
      )}

      {/* Onglet Exports */}
      {activeTab === 'exports' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FiDownload /> Configuration des exports</h2>
            <form onSubmit={handleExportSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg"><label className="block text-sm font-medium mb-2">Format par défaut</label><select value={exportConfig.defaultFormat} onChange={(e) => setExportConfig({...exportConfig, defaultFormat: e.target.value})} className="w-full px-3 py-2 border rounded-lg"><option value="excel">Excel (.xlsx)</option><option value="csv">CSV</option><option value="pdf">PDF</option><option value="json">JSON</option></select></div>
                <div className="p-3 bg-gray-50 rounded-lg"><label className="block text-sm font-medium mb-2">Format de date</label><select value={exportConfig.dateFormat} onChange={(e) => setExportConfig({...exportConfig, dateFormat: e.target.value})} className="w-full px-3 py-2 border rounded-lg"><option value="dd/MM/yyyy">DD/MM/YYYY</option><option value="MM/dd/yyyy">MM/DD/YYYY</option><option value="yyyy-MM-dd">YYYY-MM-DD</option></select></div>
                <div className="p-3 bg-gray-50 rounded-lg"><label className="block text-sm font-medium mb-2">Lignes max par export</label><input type="number" min={100} max={100000} step={1000} value={exportConfig.maxRowsExport} onChange={(e) => setExportConfig({...exportConfig, maxRowsExport: parseInt(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" /></div>
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer"><div><p className="font-medium">Inclure les en-têtes</p><p className="text-sm text-gray-500">Ajouter les noms de colonnes</p></div><button type="button" onClick={() => setExportConfig({...exportConfig, includeHeaders: !exportConfig.includeHeaders})} className={`relative w-12 h-6 rounded-full transition-colors ${exportConfig.includeHeaders ? 'bg-mutas-500' : 'bg-gray-300'}`}><span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${exportConfig.includeHeaders ? 'right-1' : 'left-1'}`} /></button></label>
              </div>
              <div className="flex justify-end"><button type="submit" disabled={loading} className="flex items-center gap-2 bg-mutas-500 text-white px-6 py-2 rounded-lg"><FiSave /> {loading ? 'Enregistrement...' : 'Enregistrer'}</button></div>
            </form>
          </div>

          {/* Actions supplémentaires */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"><h2 className="text-lg font-semibold mb-4">Actions sur les données</h2><div className="flex flex-wrap gap-4"><button onClick={handleExportData} className="flex items-center gap-2 px-4 py-2 bg-mutas-500 text-white rounded-lg"><FiDownload /> Exporter toutes les données</button><button onClick={handleClearCache} className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg"><FiTrash2 /> Vider le cache</button></div></div>
        </motion.div>
      )}

      {/* Onglet Apparence */}
      {activeTab === 'appearance' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"><h2 className="text-lg font-semibold mb-4">Thème</h2><div className="flex gap-4"><button onClick={toggleTheme} className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-all ${theme === 'light' ? 'border-mutas-500 bg-mutas-50 text-mutas-700' : 'border-gray-200'}`}><FiEye /> Mode clair</button><button onClick={toggleTheme} className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-all ${theme === 'dark' ? 'border-mutas-500 bg-mutas-50 text-mutas-700' : 'border-gray-200'}`}><FiEyeOff /> Mode sombre</button></div></div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"><h2 className="text-lg font-semibold mb-4">Couleur principale</h2><div className="grid grid-cols-5 gap-4">{colors.map(c => (<button key={c.id} onClick={() => setColor(c.id)} className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${color === c.id ? 'border-mutas-500 shadow-lg' : 'border-gray-200'}`}><div className={`w-12 h-12 rounded-full ${c.bgClass} shadow-md`} /><span className="text-sm font-medium">{c.name}</span>{color === c.id && <FiCheck className="text-mutas-500 text-sm" />}</button>))}</div></div>
        </motion.div>
      )}
    </div>
  );
}

export default ParametresPage;