import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export const useSessionMonitor = () => {
  const { updateSessionActivity, checkSessionLocked, logout, user } = useAuth();
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const resetTimer = async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    if (user) {
      try {
        await updateSessionActivity();
      } catch (e) {
        console.log('Erreur mise à jour session');
      }
    }
    
    timerRef.current = setTimeout(async () => {
      if (user) {
        try {
          const locked = await checkSessionLocked();
          if (locked) {
            navigate('/session-locked');
          }
        } catch (e) {
          console.log('Erreur vérification session');
        }
      }
    }, INACTIVITY_TIMEOUT);
  };

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart', 'click'];
    resetTimer();
    events.forEach(event => window.addEventListener(event, resetTimer));
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [user]);

  return { resetTimer };
};