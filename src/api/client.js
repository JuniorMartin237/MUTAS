import axios from 'axios';
import toast from 'react-hot-toast';

const AUTH_API_URL = 'http://localhost:8000/api';
const SINISTRE_API_URL = 'http://localhost:8000/api';

// Client pour le service d'authentification
const authApi = axios.create({
  baseURL: AUTH_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Client pour le service des sinistres
const sinistreApi = axios.create({
  baseURL: SINISTRE_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token
const addTokenInterceptor = (apiInstance) => {
  apiInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
};

addTokenInterceptor(authApi);
addTokenInterceptor(sinistreApi);

// Intercepteur pour gérer les erreurs 401
const handle401Interceptor = (apiInstance, isAuthApi = false) => {
  apiInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      if (error.response?.status === 401 && !originalRequest._retry && !isAuthApi) {
        originalRequest._retry = true;
        
        const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
        
        if (refreshToken) {
          try {
            const response = await authApi.post('/accounts/refresh/', { refresh: refreshToken });
            const newAccessToken = response.data.access;
            
            if (localStorage.getItem('refresh_token')) {
              localStorage.setItem('access_token', newAccessToken);
            } else {
              sessionStorage.setItem('access_token', newAccessToken);
            }
            
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return apiInstance(originalRequest);
          } catch (refreshError) {
            localStorage.removeItem('user');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            sessionStorage.removeItem('user');
            sessionStorage.removeItem('access_token');
            sessionStorage.removeItem('refresh_token');
            window.location.href = '/login';
            toast.error('Session expirée, veuillez vous reconnecter');
          }
        } else {
          window.location.href = '/login';
          toast.error('Session expirée, veuillez vous reconnecter');
        }
      }
      
      return Promise.reject(error);
    }
  );
};

handle401Interceptor(authApi, true);
handle401Interceptor(sinistreApi);

// Export nommé et par défaut
export { authApi, sinistreApi };
export default authApi;