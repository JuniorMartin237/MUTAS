import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [sessionLocked, setSessionLocked] = useState(false);

  // Initialisation : charger l'utilisateur depuis le stockage
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      const storedAccessToken = localStorage.getItem('access_token');
      const storedRefreshToken = localStorage.getItem('refresh_token');

      if (storedUser && storedAccessToken) {
        setUser(JSON.parse(storedUser));
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
        
        // Configurer le token par défaut dans axios
        api.defaults.headers.common['Authorization'] = `Bearer ${storedAccessToken}`;
        
        // Vérifier si le token est encore valide
        try {
          await refreshAccessToken();
        } catch (error) {
          console.log('Token expiré, déconnexion');
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Rafraîchir le token d'accès
  const refreshAccessToken = async () => {
    try {
      const response = await api.post('/accounts/refresh/', {
        refresh: refreshToken
      });
      const newAccessToken = response.data.access;
      setAccessToken(newAccessToken);
      localStorage.setItem('access_token', newAccessToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
      return newAccessToken;
    } catch (error) {
      throw error;
    }
  };

    // Vérifier l'authentification (pour le rafraîchissement)
  const checkAuth = async () => {
    try {
      const response = await api.get('/accounts/check-auth/');
      return response.data;
    } catch (error) {
      console.error('Check auth error:', error);
      throw error;
    }
  };

  // Obtenir les permissions de l'utilisateur
  const getUserPermissions = async (userId = null) => {
    try {
      const url = userId ? `/accounts/permissions/${userId}/` : '/accounts/permissions/';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Get permissions error:', error);
      return { permissions: [] };
    }
  };

  // Mettre à jour les permissions d'un utilisateur
  const updateUserPermissions = async (userId, userType) => {
    try {
      const response = await api.post(`/accounts/permissions/${userId}/update/`, {
        user_type: userType
      });
      return response.data;
    } catch (error) {
      console.error('Update permissions error:', error);
      throw error;
    }
  };

  // Activer MFA
  const enableMFA = async () => {
    try {
      const response = await api.post('/accounts/mfa/enable/');
      return response.data;
    } catch (error) {
      console.error('Enable MFA error:', error);
      throw error;
    }
  };

  // Vérifier et activer MFA
  const verifyMFA = async (code) => {
    try {
      const response = await api.post('/accounts/mfa/verify/', { code });
      return response.data;
    } catch (error) {
      console.error('Verify MFA error:', error);
      throw error;
    }
  };

  // Désactiver MFA
  const disableMFA = async (code) => {
    try {
      const response = await api.post('/accounts/mfa/disable/', { code });
      return response.data;
    } catch (error) {
      console.error('Disable MFA error:', error);
      throw error;
    }
  };


  // Connexion
  const login = async (username, password, remember = false) => {
    try {
      const response = await api.post('/accounts/login/', { username, password });
      console.log('Login response:', response.data);
      
      if (response.data.user) {
        const userData = response.data.user;
        const access = response.data.access;
        const refresh = response.data.refresh;
        
        // Stockage selon mémorisation
        if (remember) {
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('access_token', access);
          localStorage.setItem('refresh_token', refresh);
        } else {
          sessionStorage.setItem('user', JSON.stringify(userData));
          sessionStorage.setItem('access_token', access);
          sessionStorage.setItem('refresh_token', refresh);
        }
        
        // Configurer axios
        api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        
        setUser(userData);
        setAccessToken(access);
        setRefreshToken(refresh);
        setSessionLocked(false);
        
        return response.data;
      }
      throw new Error('Login failed');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Déconnexion
  const logout = async () => {
    try {
      await api.post('/accounts/logout/');
    } catch (e) {
      console.log('Erreur logout:', e);
    }
    
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    
    delete api.defaults.headers.common['Authorization'];
    
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    setSessionLocked(false);
  };

  // Verrouiller la session
  const lockSession = async () => {
    try {
      await api.post('/accounts/session/lock/');
      setSessionLocked(true);
      window.location.href = '/session-locked';
    } catch (e) {
      console.log('Erreur lock session:', e);
      setSessionLocked(true);
      window.location.href = '/session-locked';
    }
  };

  // Déverrouiller la session (appelé depuis la page session-locked)
  const unlockSession = async (password) => {
    try {
      const response = await api.post('/accounts/session/unlock/', { password });
      if (response.data.message) {
        setSessionLocked(false);
        // Rafraîchir l'activité
        await updateSessionActivity();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Unlock error:', error);
      return false;
    }
  };

  // Réinitialiser le mot de passe (mot de passe oublié)
  const resetPassword = async (oldPassword, newPassword) => {
    const response = await api.post('/accounts/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
      confirm_password: newPassword,
    });
    return response.data;
  };

  // Changer le mot de passe (version alternative)
  const changePassword = async (oldPassword, newPassword, confirmPassword) => {
    const response = await api.post('/accounts/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    return response.data;
  };

  // Mettre à jour les informations utilisateur
  const updateUser = async (userData) => {
    try {
      const response = await api.put('/accounts/profile/update/', userData);
      const updatedUser = response.data;
      
      // Mettre à jour le stockage
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (storedUser) {
        const currentUser = JSON.parse(storedUser);
        const newUser = { ...currentUser, ...updatedUser };
        if (localStorage.getItem('user')) {
          localStorage.setItem('user', JSON.stringify(newUser));
        } else {
          sessionStorage.setItem('user', JSON.stringify(newUser));
        }
        setUser(newUser);
      }
      return updatedUser;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  // Récupérer le profil utilisateur
  const getUserProfile = async () => {
    try {
      const response = await api.get('/accounts/profile/');
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  };

  // Mettre à jour l'activité de session (pour le monitorage d'inactivité)
  const updateSessionActivity = async () => {
    try {
      await api.post('/logs/update/');
    } catch (e) {
      console.log('Erreur update session activity:', e);
    }
  };

  // Vérifier si la session est verrouillée
  const checkSessionLocked = async () => {
    try {
      const response = await api.get('/logs/check-locked/');
      return response.data.locked;
    } catch (e) {
      console.log('Erreur check session locked:', e);
      return false;
    }
  };

  // Rafraîchir la session (prolonger l'expiration)
  const refreshSession = async () => {
    try {
      await api.post('/accounts/session/refresh/');
      return true;
    } catch (e) {
      console.log('Erreur refresh session:', e);
      return false;
    }
  };

  // Obtenir l'état de verrouillage
  const isSessionLocked = useCallback(() => {
    return sessionLocked;
  }, [sessionLocked]);

  // Vérifier si l'utilisateur est admin
  const isAdmin = useCallback(() => {
    return user?.user_type === 'ADMIN' || user?.is_superuser;
  }, [user]);

  // Valeurs exposées par le contexte
  const value = {
    user,
    loading,
    accessToken,
    refreshToken,
    sessionLocked,
    login,
    logout,
    lockSession,
    unlockSession,
    resetPassword,
    changePassword,
    updateUser,
    getUserProfile,
    updateSessionActivity,
    checkSessionLocked,
    refreshSession,
    isSessionLocked,
    isAdmin,
    setUser,
    checkAuth,
    getUserPermissions,
    updateUserPermissions,
    enableMFA,
    verifyMFA,
    disableMFA,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;